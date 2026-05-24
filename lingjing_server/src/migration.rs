use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::env;
use super::tasks::Task;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationConfig {
    pub source_dir: PathBuf,
    pub target_file: PathBuf,
    pub backup_original: bool,
    pub dedup_strategy: DedupStrategy,
    pub backup_dir: PathBuf,
}

impl Default for MigrationConfig {
    fn default() -> Self {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");
        
        MigrationConfig {
            source_dir: exe_dir.join("data").join("tasks"),
            target_file: exe_dir.join("data").join("tasks.json"),
            backup_original: true,
            dedup_strategy: DedupStrategy::Skip,
            backup_dir: exe_dir.join("data").join("tasks_backup"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DedupStrategy {
    Skip,
    Overwrite,
    Merge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationResult {
    pub source_files: usize,
    pub total_tasks: usize,
    pub duplicated_tasks: usize,
    pub migrated_tasks: usize,
    pub duration_ms: u64,
    pub success: bool,
    pub errors: Vec<String>,
}

pub struct Migration;

impl Migration {
    pub fn check_migration_needed() -> bool {
        let config = MigrationConfig::default();
        config.source_dir.exists() && config.source_dir.is_dir()
    }

    pub fn execute(config: MigrationConfig) -> MigrationResult {
        let start = std::time::Instant::now();
        let mut errors = Vec::new();
        
        info!("开始数据迁移，源目录: {:?}", config.source_dir);
        
        let all_tasks = match Self::collect_tasks_from_dir(&config.source_dir) {
            Ok(tasks) => tasks,
            Err(e) => {
                errors.push(format!("收集任务失败: {}", e));
                return MigrationResult {
                    source_files: 0,
                    total_tasks: 0,
                    duplicated_tasks: 0,
                    migrated_tasks: 0,
                    duration_ms: start.elapsed().as_millis() as u64,
                    success: false,
                    errors,
                };
            }
        };
        
        let source_files = match fs::read_dir(&config.source_dir) {
            Ok(entries) => entries.filter(|e| e.is_ok()).count(),
            Err(_) => 0,
        };
        
        let total_tasks = all_tasks.len();
        info!("从 {} 个文件中收集到 {} 个任务", source_files, total_tasks);
        
        let deduplicated = Self::deduplicate_tasks(all_tasks, &config.dedup_strategy);
        let duplicated_tasks = total_tasks - deduplicated.len();
        info!("去重后剩余 {} 个任务，去除 {} 个重复任务", deduplicated.len(), duplicated_tasks);
        
        if let Some(parent) = config.target_file.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                errors.push(format!("创建目标目录失败: {}", e));
                return MigrationResult {
                    source_files,
                    total_tasks,
                    duplicated_tasks,
                    migrated_tasks: 0,
                    duration_ms: start.elapsed().as_millis() as u64,
                    success: false,
                    errors,
                };
            }
        }
        
        let temp_path = config.target_file.with_extension("json.tmp");
        match serde_json::to_string_pretty(&deduplicated) {
            Ok(content) => {
                if let Err(e) = fs::write(&temp_path, content) {
                    errors.push(format!("写入临时文件失败: {}", e));
                    return MigrationResult {
                        source_files,
                        total_tasks,
                        duplicated_tasks,
                        migrated_tasks: 0,
                        duration_ms: start.elapsed().as_millis() as u64,
                        success: false,
                        errors,
                    };
                }
                
                if let Err(e) = fs::rename(&temp_path, &config.target_file) {
                    errors.push(format!("重命名文件失败: {}", e));
                    return MigrationResult {
                        source_files,
                        total_tasks,
                        duplicated_tasks,
                        migrated_tasks: 0,
                        duration_ms: start.elapsed().as_millis() as u64,
                        success: false,
                        errors,
                    };
                }
            }
            Err(e) => {
                errors.push(format!("序列化任务失败: {}", e));
                return MigrationResult {
                    source_files,
                    total_tasks,
                    duplicated_tasks,
                    migrated_tasks: 0,
                    duration_ms: start.elapsed().as_millis() as u64,
                    success: false,
                    errors,
                };
            }
        }
        
        info!("写入目标文件成功: {:?}", config.target_file);
        
        if config.backup_original {
            if let Err(e) = Self::backup_original_files(&config.source_dir, &config.backup_dir) {
                errors.push(format!("备份原文件失败: {}", e));
                warn!("备份原文件失败: {}", e);
            } else {
                info!("原文件备份成功到: {:?}", config.backup_dir);
            }
        }
        
        MigrationResult {
            source_files,
            total_tasks,
            duplicated_tasks,
            migrated_tasks: deduplicated.len(),
            duration_ms: start.elapsed().as_millis() as u64,
            success: true,
            errors,
        }
    }

    fn collect_tasks_from_dir(dir: &PathBuf) -> Result<Vec<Task>, std::io::Error> {
        let mut all_tasks = Vec::new();
        
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.extension().map_or(false, |ext| ext == "json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    match serde_json::from_str::<Vec<Task>>(&content) {
                        Ok(tasks) => {
                            info!("从 {:?} 读取 {} 个任务", path.file_name().unwrap(), tasks.len());
                            all_tasks.extend(tasks);
                        }
                        Err(e) => {
                            warn!("解析文件 {:?} 失败: {}", path, e);
                        }
                    }
                }
            }
        }
        
        Ok(all_tasks)
    }

    fn deduplicate_tasks(tasks: Vec<Task>, strategy: &DedupStrategy) -> Vec<Task> {
        use std::collections::HashMap;
        
        match strategy {
            DedupStrategy::Skip => {
                let mut seen = HashMap::new();
                for task in tasks {
                    seen.entry(task.id.clone()).or_insert(task);
                }
                seen.into_values().collect()
            }
            DedupStrategy::Overwrite => {
                let mut map = HashMap::new();
                for task in tasks {
                    map.insert(task.id.clone(), task);
                }
                map.into_values().collect()
            }
            DedupStrategy::Merge => {
                let mut map = HashMap::new();
                for task in tasks {
                    let key = task.id.clone();
                    map.entry(key).and_modify(|existing: &mut Task| {
                        if task.created_date > existing.created_date {
                            *existing = task.clone();
                        }
                    }).or_insert(task);
                }
                map.into_values().collect()
            }
        }
    }

    fn backup_original_files(source_dir: &PathBuf, backup_dir: &PathBuf) -> Result<(), std::io::Error> {
        fs::create_dir_all(backup_dir)?;
        
        for entry in fs::read_dir(source_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.extension().map_or(false, |ext| ext == "json") {
                if let Some(filename) = path.file_name() {
                    let backup_path = backup_dir.join(filename);
                    fs::copy(&path, &backup_path)?;
                }
            }
        }
        
        Ok(())
    }
}

#[tauri::command]
pub fn check_migration_needed() -> bool {
    Migration::check_migration_needed()
}

#[tauri::command]
pub fn execute_migration(config: Option<MigrationConfig>) -> MigrationResult {
    let config = config.unwrap_or_else(MigrationConfig::default);
    Migration::execute(config)
}
