use log::{info, warn, error};
use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::Write as IoWrite;
use std::path::PathBuf;
use std::env;
use chrono::{DateTime, Local, Utc};
use crate::error::{ErrorCategory, ErrorLevel, ErrorContext};
use crate::recovery::RecoveryStrategy;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorLog {
    pub error_id: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub timestamp: DateTime<Utc>,
    pub error_code: String,
    pub error_type: ErrorCategory,
    pub error_level: ErrorLevel,
    pub message: String,
    pub stack: Option<String>,
    pub context: ErrorContext,
    pub recovery_attempted: bool,
    pub recovery_success: Option<bool>,
    pub recovery_strategy: Option<RecoveryStrategy>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFilter {
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub error_type: Option<Vec<ErrorCategory>>,
    pub error_level: Option<Vec<ErrorLevel>>,
    pub error_code: Option<Vec<String>>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

impl Default for LogFilter {
    fn default() -> Self {
        LogFilter {
            start_time: None,
            end_time: None,
            error_type: None,
            error_level: None,
            error_code: None,
            limit: Some(100),
            offset: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorStatistics {
    pub total_errors: usize,
    pub errors_by_type: std::collections::HashMap<String, usize>,
    pub errors_by_level: std::collections::HashMap<String, usize>,
    pub errors_by_code: std::collections::HashMap<String, usize>,
    pub recovery_success_rate: f64,
    pub average_recovery_time: f64,
}

pub struct ErrorLogger {
    log_dir: PathBuf,
    max_file_size: u64,
    max_files: usize,
    retention_days: u32,
    current_file: Option<PathBuf>,
}

impl ErrorLogger {
    pub fn new() -> Self {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");
        let log_dir = exe_dir.join("data").join("logs");
        
        ErrorLogger {
            log_dir,
            max_file_size: 10 * 1024 * 1024,
            max_files: 30,
            retention_days: 30,
            current_file: None,
        }
    }
    
    pub fn with_config(log_dir: PathBuf, max_file_size: u64, max_files: usize, retention_days: u32) -> Self {
        ErrorLogger {
            log_dir,
            max_file_size,
            max_files,
            retention_days,
            current_file: None,
        }
    }
    
    pub fn write_log(&mut self, error_log: &ErrorLog) -> Result<(), String> {
        if let Err(e) = fs::create_dir_all(&self.log_dir) {
            let err_msg = format!("创建日志目录失败: {}", e);
            error!("{}", err_msg);
            return Err(err_msg);
        }
        
        let log_file = self.get_or_create_log_file()?;
        
        let json_line = serde_json::to_string(error_log)
            .map_err(|e| format!("序列化日志失败: {}", e))?;
        
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file)
            .map_err(|e| format!("打开日志文件失败: {}", e))?;
        
        writeln!(file, "{}", json_line)
            .map_err(|e| format!("写入日志失败: {}", e))?;
        
        self.check_rotation()?;
        
        Ok(())
    }
    
    fn get_or_create_log_file(&mut self) -> Result<PathBuf, String> {
        let now = Local::now();
        let filename = format!("error-{}-{:03}.log", 
            now.format("%Y-%m-%d"), 
            self.get_file_sequence(&now)?
        );
        let log_path = self.log_dir.join(&filename);
        
        if !log_path.exists() {
            File::create(&log_path)
                .map_err(|e| format!("创建日志文件失败: {}", e))?;
        }
        
        self.current_file = Some(log_path.clone());
        Ok(log_path)
    }
    
    fn get_file_sequence(&self, date: &DateTime<Local>) -> Result<usize, String> {
        let date_str = date.format("%Y-%m-%d").to_string();
        let mut sequence = 1;
        
        if let Ok(entries) = fs::read_dir(&self.log_dir) {
            for entry in entries.flatten() {
                let filename = entry.file_name().to_string_lossy().to_string();
                if filename.starts_with(&format!("error-{}-", date_str)) {
                    if let Some(seq_str) = filename.split('-').nth(3) {
                        if let Some(seq) = seq_str.strip_suffix(".log") {
                            if let Ok(n) = seq.parse::<usize>() {
                                if n >= sequence {
                                    sequence = n + 1;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        Ok(sequence)
    }
    
    fn check_rotation(&mut self) -> Result<(), String> {
        if let Some(ref log_file) = self.current_file {
            let metadata = fs::metadata(log_file)
                .map_err(|e| format!("获取文件元数据失败: {}", e))?;
            
            if metadata.len() >= self.max_file_size {
                self.current_file = None;
            }
        }
        
        Ok(())
    }
    
    pub fn cleanup_old_logs(&self) -> Result<usize, String> {
        let mut removed = 0;
        let now = Local::now();
        let cutoff_date = now - chrono::Duration::days(self.retention_days as i64);
        
        if !self.log_dir.exists() {
            return Ok(0);
        }
        
        let entries: Vec<_> = fs::read_dir(&self.log_dir)
            .map_err(|e| format!("读取日志目录失败: {}", e))?
            .collect();
        
        for entry in entries.into_iter().flatten() {
            let path = entry.path();
            
            if let Ok(metadata) = fs::metadata(&path) {
                if let Ok(modified) = metadata.modified() {
                    let modified_time: DateTime<Local> = modified.into();
                    
                    if modified_time < cutoff_date {
                        if let Err(e) = fs::remove_file(&path) {
                            warn!("删除旧日志文件 {:?} 失败: {}", path, e);
                        } else {
                            removed += 1;
                        }
                    }
                }
            }
        }
        
        info!("清理了 {} 个旧日志文件", removed);
        Ok(removed)
    }
    
    pub fn query_logs(&self, filter: &LogFilter) -> Result<Vec<ErrorLog>, String> {
        let mut logs = Vec::new();
        
        if !self.log_dir.exists() {
            return Ok(logs);
        }
        
        let entries: Vec<_> = fs::read_dir(&self.log_dir)
            .map_err(|e| format!("读取日志目录失败: {}", e))?
            .collect();
        
        for entry in entries.into_iter().flatten() {
            let path = entry.path();
            
            if path.extension().map_or(false, |ext| ext == "log") {
                if let Ok(content) = fs::read_to_string(&path) {
                    for line in content.lines() {
                        if line.trim().is_empty() {
                            continue;
                        }
                        
                        if let Ok(mut log) = serde_json::from_str::<ErrorLog>(line) {
                            if self.matches_filter(&log, filter) {
                                logs.push(log);
                            }
                        }
                    }
                }
            }
        }
        
        logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        let offset = filter.offset.unwrap_or(0);
        let limit = filter.limit.unwrap_or(100);
        
        if offset < logs.len() {
            logs = logs[offset..].to_vec();
        }
        
        logs.truncate(limit);
        
        Ok(logs)
    }
    
    fn matches_filter(&self, log: &ErrorLog, filter: &LogFilter) -> bool {
        if let Some(ref start_time) = filter.start_time {
            if let Ok(start) = start_time.parse::<DateTime<Utc>>() {
                if log.timestamp < start {
                    return false;
                }
            }
        }
        
        if let Some(ref end_time) = filter.end_time {
            if let Ok(end) = end_time.parse::<DateTime<Utc>>() {
                if log.timestamp > end {
                    return false;
                }
            }
        }
        
        if let Some(ref types) = filter.error_type {
            if !types.contains(&log.error_type) {
                return false;
            }
        }
        
        if let Some(ref levels) = filter.error_level {
            if !levels.contains(&log.error_level) {
                return false;
            }
        }
        
        if let Some(ref codes) = filter.error_code {
            if !codes.contains(&log.error_code) {
                return false;
            }
        }
        
        true
    }
    
    pub fn get_statistics(&self, start_time: Option<String>, end_time: Option<String>) -> Result<ErrorStatistics, String> {
        let filter = LogFilter {
            start_time,
            end_time,
            error_type: None,
            error_level: None,
            error_code: None,
            limit: None,
            offset: None,
        };
        
        let logs = self.query_logs(&filter)?;
        
        let mut errors_by_type = std::collections::HashMap::new();
        let mut errors_by_level = std::collections::HashMap::new();
        let mut errors_by_code = std::collections::HashMap::new();
        
        let mut recovery_attempts = 0;
        let mut recovery_successes = 0;
        let mut total_recovery_time = 0.0;
        
        for log in &logs {
            let type_key = format!("{:?}", log.error_type);
            *errors_by_type.entry(type_key).or_insert(0) += 1;
            
            let level_key = format!("{:?}", log.error_level);
            *errors_by_level.entry(level_key).or_insert(0) += 1;
            
            *errors_by_code.entry(log.error_code.clone()).or_insert(0) += 1;
            
            if log.recovery_attempted {
                recovery_attempts += 1;
                if log.recovery_success.unwrap_or(false) {
                    recovery_successes += 1;
                }
            }
        }
        
        let recovery_success_rate = if recovery_attempts > 0 {
            (recovery_successes as f64 / recovery_attempts as f64) * 100.0
        } else {
            0.0
        };
        
        let average_recovery_time = if recovery_attempts > 0 {
            total_recovery_time / recovery_attempts as f64
        } else {
            0.0
        };
        
        Ok(ErrorStatistics {
            total_errors: logs.len(),
            errors_by_type,
            errors_by_level,
            errors_by_code,
            recovery_success_rate,
            average_recovery_time,
        })
    }
}

impl Default for ErrorLogger {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub fn log_error_to_backend(
    error_id: String,
    error_code: String,
    error_type: ErrorCategory,
    error_level: ErrorLevel,
    message: String,
    stack: Option<String>,
    context: ErrorContext,
    recovery_attempted: bool,
    recovery_success: Option<bool>,
    recovery_strategy: Option<RecoveryStrategy>,
) -> Result<(), String> {
    let error_log = ErrorLog {
        error_id,
        timestamp: Utc::now(),
        error_code,
        error_type,
        error_level,
        message,
        stack,
        context,
        recovery_attempted,
        recovery_success,
        recovery_strategy,
    };
    
    let mut logger = ErrorLogger::new();
    logger.write_log(&error_log)
}

#[tauri::command]
pub fn get_error_logs(filter: LogFilter) -> Result<Vec<ErrorLog>, String> {
    let logger = ErrorLogger::new();
    logger.query_logs(&filter)
}

#[tauri::command]
pub fn get_error_statistics(
    start_time: Option<String>,
    end_time: Option<String>,
) -> Result<ErrorStatistics, String> {
    let logger = ErrorLogger::new();
    logger.get_statistics(start_time, end_time)
}

#[tauri::command]
pub fn cleanup_error_logs(days_to_keep: Option<u32>) -> Result<usize, String> {
    let logger = ErrorLogger::new();
    let days = days_to_keep.unwrap_or(30);
    
    let mut custom_logger = ErrorLogger::with_config(
        logger.log_dir,
        logger.max_file_size,
        logger.max_files,
        days,
    );
    
    custom_logger.cleanup_old_logs()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_error_logger_creation() {
        let logger = ErrorLogger::new();
        assert!(logger.log_dir.to_string_lossy().contains("logs"));
    }
    
    #[test]
    fn test_log_filter_default() {
        let filter = LogFilter::default();
        assert_eq!(filter.limit, Some(100));
        assert_eq!(filter.offset, None);
    }
}
