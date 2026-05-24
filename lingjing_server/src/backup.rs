use log::{info, warn, error};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::env;
use chrono::{DateTime, Local, Datelike};
use super::tasks::Task;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupConfig {
    pub backup_dir: PathBuf,
    pub backup_day: u32,
    pub keep_backups: usize,
    pub compress_backups: bool,
}

impl Default for BackupConfig {
    fn default() -> Self {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");
        
        BackupConfig {
            backup_dir: exe_dir.join("data").join("backup"),
            backup_day: 1,
            keep_backups: 12,
            compress_backups: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub backup_id: String,
    pub filename: String,
    pub created_at: String,
    pub task_count: usize,
    pub file_size: u64,
    pub checksum: Option<String>,
    pub integrity_verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreResult {
    pub success: bool,
    pub restored_count: usize,
    pub backup_id: String,
    pub restored_at: String,
    pub error_message: Option<String>,
}

pub struct BackupScheduler {
    config: BackupConfig,
    last_backup_date: Option<String>,
}

impl BackupScheduler {
    pub fn new(config: BackupConfig) -> Self {
        BackupScheduler {
            config,
            last_backup_date: None,
        }
    }

    pub fn should_backup(&self) -> bool {
        let now = Local::now();
        
        if now.day() != self.config.backup_day {
            return false;
        }
        
        let today = now.format("%Y-%m-%d").to_string();
        match &self.last_backup_date {
            Some(last) => last != &today,
            None => true,
        }
    }

    pub fn execute_backup(&mut self, tasks: &[Task]) -> Result<BackupMetadata, String> {
        info!("开始执行备份");
        
        use uuid::Uuid;
        let backup_id = Uuid::new_v4().to_string();
        
        let unfinished: Vec<Task> = tasks.iter()
            .filter(|task| task.status_id != "st_done" && task.status_id != "st_closed")
            .cloned()
            .collect();
        
        let now = Local::now();
        let filename = format!("backup_{}.json", now.format("%Y-%m-%d"));
        let backup_path = self.config.backup_dir.join(&filename);
        
        if let Err(e) = fs::create_dir_all(&self.config.backup_dir) {
            let err_msg = format!("创建备份目录失败: {}", e);
            error!("{}", err_msg);
            return Err(err_msg);
        }
        
        let temp_path = backup_path.with_extension("json.tmp");
        let content = serde_json::to_string_pretty(&unfinished)
            .map_err(|e| format!("序列化任务失败: {}", e))?;
        
        let checksum = format!("{:x}", md5::compute(&content));
        
        fs::write(&temp_path, &content)
            .map_err(|e| format!("写入临时文件失败: {}", e))?;
        
        fs::rename(&temp_path, &backup_path)
            .map_err(|e| format!("重命名文件失败: {}", e))?;
        
        let file_size = fs::metadata(&backup_path)
            .map(|m| m.len())
            .unwrap_or(0);
        
        let metadata = BackupMetadata {
            backup_id,
            filename: filename.clone(),
            created_at: now.to_rfc3339(),
            task_count: unfinished.len(),
            file_size,
            checksum: Some(checksum),
            integrity_verified: true,
        };
        
        self.last_backup_date = Some(now.format("%Y-%m-%d").to_string());
        
        info!("备份成功: {} 个任务，文件大小: {} 字节", metadata.task_count, metadata.file_size);
        
        Ok(metadata)
    }

    pub fn get_backup_history(&self, limit: Option<usize>) -> Vec<BackupMetadata> {
        let limit = limit.unwrap_or(10);
        let mut backups = Vec::new();
        
        if !self.config.backup_dir.exists() {
            return backups;
        }
        
        if let Ok(entries) = fs::read_dir(&self.config.backup_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                
                if path.extension().map_or(false, |ext| ext == "json") {
                    if let Some(filename) = path.file_name() {
                        let filename = filename.to_string_lossy().to_string();
                        
                        if filename.starts_with("backup_") {
                            let task_count = fs::read_to_string(&path)
                                .ok()
                                .and_then(|content| serde_json::from_str::<Vec<Task>>(&content).ok())
                                .map(|tasks| tasks.len())
                                .unwrap_or(0);
                            
                            let file_size = fs::metadata(&path)
                                .map(|m| m.len())
                                .unwrap_or(0);
                            
                            let created_at = fs::metadata(&path)
                                .ok()
                                .and_then(|m| m.modified().ok())
                                .map(|t| {
                                    let datetime: DateTime<Local> = t.into();
                                    datetime.to_rfc3339()
                                })
                                .unwrap_or_else(|| "unknown".to_string());
                            
                            let backup_id = format!("backup-{}", filename.replace("backup_", "").replace(".json", ""));
                            
                            backups.push(BackupMetadata {
                                backup_id,
                                filename,
                                created_at,
                                task_count,
                                file_size,
                                checksum: None,
                                integrity_verified: false,
                            });
                        }
                    }
                }
            }
        }
        
        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        backups.truncate(limit);
        
        backups
    }

    pub fn cleanup_old_backups(&self) -> Result<usize, String> {
        let mut backups = self.get_backup_history(None);
        
        if backups.len() <= self.config.keep_backups {
            return Ok(0);
        }
        
        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        
        let to_remove = &backups[self.config.keep_backups..];
        let mut removed = 0;
        
        for backup in to_remove {
            let path = self.config.backup_dir.join(&backup.filename);
            if let Err(e) = fs::remove_file(&path) {
                warn!("删除旧备份文件 {:?} 失败: {}", path, e);
            } else {
                removed += 1;
            }
        }
        
        info!("清理了 {} 个旧备份文件", removed);
        Ok(removed)
    }
}

#[tauri::command]
pub fn execute_backup(tasks: Vec<Task>) -> Result<BackupMetadata, String> {
    let config = BackupConfig::default();
    let mut scheduler = BackupScheduler::new(config);
    scheduler.execute_backup(&tasks)
}

#[tauri::command]
pub fn get_backup_history(limit: Option<usize>) -> Vec<BackupMetadata> {
    let config = BackupConfig::default();
    let scheduler = BackupScheduler::new(config);
    scheduler.get_backup_history(limit)
}

#[tauri::command]
pub fn cleanup_old_backups() -> Result<usize, String> {
    let config = BackupConfig::default();
    let scheduler = BackupScheduler::new(config);
    scheduler.cleanup_old_backups()
}

impl BackupScheduler {
    pub fn restore_from_backup(&self, backup_id: &str) -> Result<RestoreResult, String> {
        info!("开始从备份恢复: {}", backup_id);
        
        let filename = if backup_id.starts_with("backup-") {
            format!("backup_{}.json", backup_id.replace("backup-", ""))
        } else {
            format!("backup_{}.json", backup_id)
        };
        
        let backup_path = self.config.backup_dir.join(&filename);
        
        if !backup_path.exists() {
            let err_msg = format!("备份文件不存在: {}", filename);
            error!("{}", err_msg);
            return Err(err_msg);
        }
        
        let content = fs::read_to_string(&backup_path)
            .map_err(|e| format!("读取备份文件失败: {}", e))?;
        
        let tasks: Vec<Task> = serde_json::from_str(&content)
            .map_err(|e| format!("解析备份数据失败: {}", e))?;
        
        let restored_count = tasks.len();
        let now = Local::now();
        
        info!("备份恢复成功: 恢复 {} 个任务", restored_count);
        
        Ok(RestoreResult {
            success: true,
            restored_count,
            backup_id: backup_id.to_string(),
            restored_at: now.to_rfc3339(),
            error_message: None,
        })
    }
    
    pub fn verify_backup_integrity(&self, backup_id: &str) -> Result<bool, String> {
        info!("验证备份完整性: {}", backup_id);
        
        let filename = if backup_id.starts_with("backup-") {
            format!("backup_{}.json", backup_id.replace("backup-", ""))
        } else {
            format!("backup_{}.json", backup_id)
        };
        
        let backup_path = self.config.backup_dir.join(&filename);
        
        if !backup_path.exists() {
            warn!("备份文件不存在: {}", filename);
            return Ok(false);
        }
        
        let content = match fs::read_to_string(&backup_path) {
            Ok(c) => c,
            Err(e) => {
                warn!("读取备份文件失败: {}", e);
                return Ok(false);
            }
        };
        
        match serde_json::from_str::<Vec<Task>>(&content) {
            Ok(tasks) => {
                let is_valid = !tasks.is_empty();
                info!("备份验证完成: {}, 任务数: {}", filename, tasks.len());
                Ok(is_valid)
            }
            Err(e) => {
                warn!("备份文件格式错误: {}", e);
                Ok(false)
            }
        }
    }
    
    pub fn get_backup_by_id(&self, backup_id: &str) -> Option<BackupMetadata> {
        let backups = self.get_backup_history(None);
        backups.into_iter().find(|b| b.backup_id == backup_id)
    }
}

#[tauri::command]
pub fn restore_from_backup(backup_id: String) -> Result<RestoreResult, String> {
    let config = BackupConfig::default();
    let scheduler = BackupScheduler::new(config);
    scheduler.restore_from_backup(&backup_id)
}

#[tauri::command]
pub fn verify_backup_integrity(backup_id: String) -> Result<bool, String> {
    let config = BackupConfig::default();
    let scheduler = BackupScheduler::new(config);
    scheduler.verify_backup_integrity(&backup_id)
}

#[tauri::command]
pub fn get_backup_by_id(backup_id: String) -> Option<BackupMetadata> {
    let config = BackupConfig::default();
    let scheduler = BackupScheduler::new(config);
    scheduler.get_backup_by_id(&backup_id)
}
