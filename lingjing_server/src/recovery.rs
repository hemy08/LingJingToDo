use log::{info, warn, error};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::time::Duration;
use crate::error::{AppError, AppResult, ErrorCategory, ErrorLevel};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum RecoveryStrategy {
    AutoRetry,
    StateReset,
    DataRollback,
    UserIntervention,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum RecoveryResult {
    Success,
    PartialSuccess,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryRecord {
    pub recovery_id: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub recovery_time: DateTime<Utc>,
    pub trigger_error_id: String,
    pub recovery_strategy: RecoveryStrategy,
    pub recovery_result: RecoveryResult,
    pub duration: u64,
    pub attempts: u32,
    pub affected_scope: Option<Vec<String>>,
    pub affected_modules: Option<Vec<String>>,
    pub backup_used: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryRequest {
    pub error_id: String,
    pub error_type: ErrorCategory,
    pub error_level: ErrorLevel,
    pub strategy: Option<RecoveryStrategy>,
    pub backup_id: Option<String>,
    pub max_retries: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryConfig {
    pub max_retries: u32,
    pub initial_delay: u64,
    pub max_delay: u64,
    pub backoff_multiplier: u64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        RetryConfig {
            max_retries: 3,
            initial_delay: 1000,
            max_delay: 4000,
            backoff_multiplier: 2,
        }
    }
}

pub struct RecoveryExecutor {
    retry_config: RetryConfig,
    recovery_history: Vec<RecoveryRecord>,
}

impl RecoveryExecutor {
    pub fn new() -> Self {
        RecoveryExecutor {
            retry_config: RetryConfig::default(),
            recovery_history: Vec::new(),
        }
    }
    
    pub fn with_retry_config(config: RetryConfig) -> Self {
        RecoveryExecutor {
            retry_config: config,
            recovery_history: Vec::new(),
        }
    }
    
    pub fn determine_strategy(error_type: ErrorCategory, error_level: ErrorLevel) -> RecoveryStrategy {
        match (error_type, error_level) {
            (ErrorCategory::NetworkError, ErrorLevel::Critical) |
            (ErrorCategory::NetworkError, ErrorLevel::Warning) => {
                RecoveryStrategy::AutoRetry
            }
            (ErrorCategory::NetworkError, ErrorLevel::Fatal) => {
                RecoveryStrategy::UserIntervention
            }
            (ErrorCategory::DataError, ErrorLevel::Warning) |
            (ErrorCategory::DataError, ErrorLevel::Critical) => {
                RecoveryStrategy::StateReset
            }
            (ErrorCategory::DataError, ErrorLevel::Fatal) => {
                RecoveryStrategy::DataRollback
            }
            (ErrorCategory::PermissionError, _) => {
                RecoveryStrategy::UserIntervention
            }
            (ErrorCategory::SystemError, ErrorLevel::Fatal) => {
                RecoveryStrategy::UserIntervention
            }
            (ErrorCategory::SystemError, ErrorLevel::Critical) => {
                RecoveryStrategy::StateReset
            }
            (ErrorCategory::BusinessError, ErrorLevel::Warning) => {
                RecoveryStrategy::AutoRetry
            }
            (ErrorCategory::BusinessError, ErrorLevel::Critical) => {
                RecoveryStrategy::StateReset
            }
            (ErrorCategory::ConfigError, _) => {
                RecoveryStrategy::StateReset
            }
            _ => RecoveryStrategy::UserIntervention,
        }
    }
    
    pub fn execute_retry<F, T>(
        &self,
        operation: F,
        config: Option<RetryConfig>,
    ) -> AppResult<T>
    where
        F: Fn() -> AppResult<T>,
    {
        let config = config.unwrap_or_else(|| self.retry_config.clone());
        let mut last_error: Option<AppError> = None;
        let mut delay = config.initial_delay;
        
        for attempt in 0..config.max_retries {
            match operation() {
                Ok(result) => {
                    info!("重试操作成功,尝试次数: {}", attempt + 1);
                    return Ok(result);
                }
                Err(e) => {
                    last_error = Some(e);
                    if attempt < config.max_retries - 1 {
                        warn!("重试失败,等待 {} ms 后重试", delay);
                        std::thread::sleep(Duration::from_millis(delay));
                        delay = std::cmp::min(delay * config.backoff_multiplier, config.max_delay);
                    }
                }
            }
        }
        
        error!("重试操作失败,已达到最大重试次数: {}", config.max_retries);
        Err(last_error.unwrap_or_else(|| AppError::Recovery("重试失败".to_string())))
    }
    
    pub fn execute_recovery(
        &mut self,
        request: RecoveryRequest,
    ) -> Result<RecoveryRecord, String> {
        use uuid::Uuid;
        
        let recovery_id = Uuid::new_v4().to_string();
        let start_time = std::time::Instant::now();
        
        let strategy = request.strategy.unwrap_or_else(|| {
            Self::determine_strategy(request.error_type, request.error_level)
        });
        
        info!("开始执行恢复策略: {:?}, 错误ID: {}", strategy, request.error_id);
        
        let (result, attempts, backup_used, error_message) = match strategy {
            RecoveryStrategy::AutoRetry => {
                (RecoveryResult::Failed, 0, None, Some("自动重试需要指定操作".to_string()))
            }
            RecoveryStrategy::StateReset => {
                match self.execute_state_reset() {
                    Ok(_) => (RecoveryResult::Success, 1, None, None),
                    Err(e) => (RecoveryResult::Failed, 1, None, Some(e)),
                }
            }
            RecoveryStrategy::DataRollback => {
                let backup_id = request.backup_id.clone();
                match self.execute_data_rollback(backup_id.as_deref()) {
                    Ok(_) => (RecoveryResult::Success, 1, backup_id, None),
                    Err(e) => (RecoveryResult::Failed, 1, backup_id, Some(e)),
                }
            }
            RecoveryStrategy::UserIntervention => {
                (RecoveryResult::Failed, 0, None, Some("需要用户干预".to_string()))
            }
        };
        
        let duration = start_time.elapsed().as_millis() as u64;
        
        let record = RecoveryRecord {
            recovery_id: recovery_id.clone(),
            recovery_time: Utc::now(),
            trigger_error_id: request.error_id,
            recovery_strategy: strategy.clone(),
            recovery_result: result.clone(),
            duration,
            attempts,
            affected_scope: None,
            affected_modules: None,
            backup_used,
            error_message,
        };
        
        self.recovery_history.push(record.clone());
        
        info!(
            "恢复执行完成: {:?}, 耗时: {} ms, 结果: {:?}",
            strategy, duration, result
        );
        
        Ok(record)
    }
    
    fn execute_state_reset(&self) -> Result<(), String> {
        info!("执行状态重置恢复策略");
        Ok(())
    }
    
    fn execute_data_rollback(&self, backup_id: Option<&str>) -> Result<(), String> {
        info!("执行数据回滚恢复策略, 备份ID: {:?}", backup_id);
        
        if backup_id.is_none() {
            return Err("未指定备份ID".to_string());
        }
        
        Ok(())
    }
    
    pub fn get_recovery_history(&self) -> &[RecoveryRecord] {
        &self.recovery_history
    }
    
    pub fn clear_recovery_history(&mut self) {
        self.recovery_history.clear();
    }
    
    pub fn get_success_rate(&self) -> f64 {
        if self.recovery_history.is_empty() {
            return 0.0;
        }
        
        let success_count = self.recovery_history
            .iter()
            .filter(|r| r.recovery_result == RecoveryResult::Success)
            .count();
        
        (success_count as f64 / self.recovery_history.len() as f64) * 100.0
    }
}

impl Default for RecoveryExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub fn execute_recovery(request: RecoveryRequest) -> Result<RecoveryRecord, String> {
    let mut executor = RecoveryExecutor::new();
    executor.execute_recovery(request)
}

#[tauri::command]
pub fn get_recovery_history() -> Vec<RecoveryRecord> {
    let executor = RecoveryExecutor::new();
    executor.get_recovery_history().to_vec()
}

#[tauri::command]
pub fn determine_recovery_strategy(
    error_type: ErrorCategory,
    error_level: ErrorLevel,
) -> RecoveryStrategy {
    RecoveryExecutor::determine_strategy(error_type, error_level)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_retry_config_default() {
        let config = RetryConfig::default();
        assert_eq!(config.max_retries, 3);
        assert_eq!(config.initial_delay, 1000);
    }
    
    #[test]
    fn test_determine_strategy() {
        let strategy = RecoveryExecutor::determine_strategy(
            ErrorCategory::NetworkError,
            ErrorLevel::Warning,
        );
        assert_eq!(strategy, RecoveryStrategy::AutoRetry);
        
        let strategy = RecoveryExecutor::determine_strategy(
            ErrorCategory::DataError,
            ErrorLevel::Fatal,
        );
        assert_eq!(strategy, RecoveryStrategy::DataRollback);
        
        let strategy = RecoveryExecutor::determine_strategy(
            ErrorCategory::PermissionError,
            ErrorLevel::Critical,
        );
        assert_eq!(strategy, RecoveryStrategy::UserIntervention);
    }
    
    #[test]
    fn test_recovery_executor_creation() {
        let executor = RecoveryExecutor::new();
        assert_eq!(executor.retry_config.max_retries, 3);
    }
    
    #[test]
    fn test_execute_retry_success() {
        let executor = RecoveryExecutor::new();
        let operation = || Ok(42);
        
        let result = executor.execute_retry(operation, None);
        assert_eq!(result.unwrap(), 42);
    }
    
    #[test]
    fn test_recovery_request() {
        let request = RecoveryRequest {
            error_id: "test-error-id".to_string(),
            error_type: ErrorCategory::NetworkError,
            error_level: ErrorLevel::Warning,
            strategy: None,
            backup_id: None,
            max_retries: None,
        };
        
        assert_eq!(request.error_id, "test-error-id");
    }
}
