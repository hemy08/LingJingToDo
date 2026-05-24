mod config;
mod tasks;
mod file_ops;
mod migration;
mod backup;
mod error;
mod error_logger;
mod recovery;
mod task_index;
mod query_cache;
mod query_optimizer;
mod sharded_store;

use config::ConfigState;
use tasks::TaskStore;
use sharded_store::ShardedTaskStore;
use tauri::Manager;
use std::sync::Mutex;
use tauri_plugin_process;
use std::time::Duration;
use std::thread;
use chrono::Datelike;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();
    
    log::info!("灵境待办应用启动中...");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            log::info!("初始化配置状态");
            let config_state = ConfigState::new(app.handle());
            app.manage(config_state);
            log::info!("配置状态初始化完成");
            
            if migration::Migration::check_migration_needed() {
                log::info!("检测到旧数据格式，开始迁移...");
                let config = migration::MigrationConfig::default();
                let result = migration::Migration::execute(config);
                
                if result.success {
                    log::info!("数据迁移成功: {} 个文件, {} 个任务", 
                        result.source_files, result.migrated_tasks);
                } else {
                    log::error!("数据迁移失败: {:?}", result.errors);
                }
            }
            
            log::info!("初始化任务数据状态");
            let mut task_store = TaskStore::load();
            let overdue_count = task_store.check_and_update_overdue_tasks();
            if overdue_count > 0 {
                log::info!("启动时检测到 {} 个过期任务，已自动更新状态", overdue_count);
            }
            let task_data = Mutex::new(task_store);
            app.manage(task_data);
            log::info!("任务数据状态初始化完成");
            
            log::info!("初始化优化任务存储");
            let sharded_store = Mutex::new(ShardedTaskStore::load());
            app.manage(sharded_store);
            log::info!("优化任务存储初始化完成");

            let app_handle = app.handle().clone();
            thread::spawn(move || {
                let mut last_backup_date = None;
                
                loop {
                    let now = chrono::Local::now();
                    let tomorrow = now.date_naive() + chrono::Duration::days(1);
                    let next_1am = chrono::DateTime::from_naive_utc_and_offset(
                        tomorrow.and_hms_opt(1, 0, 0).unwrap(),
                        *now.offset()
                    );
                    let duration_until_1am = next_1am - now;

                    log::info!("下次自动保存时间: {} ({}秒后)", next_1am, duration_until_1am.num_seconds());

                    thread::sleep(Duration::from_secs(duration_until_1am.num_seconds() as u64));

                    if let Some(task_data) = app_handle.try_state::<Mutex<TaskStore>>() {
                        let mut data = task_data.lock().unwrap();
                        
                        let overdue_count = data.check_and_update_overdue_tasks();
                        if overdue_count > 0 {
                            log::info!("定时检查: 更新 {} 个过期任务", overdue_count);
                        }
                        
                        data.save();
                        log::info!("凌晨1点自动保存完成");
                        
                        let today = chrono::Local::now();
                        if today.day() == 1 {
                            let today_str = today.format("%Y-%m-%d").to_string();
                            if last_backup_date.as_ref() != Some(&today_str) {
                                log::info!("检测到每月1号，执行备份...");
                                
                                let config = backup::BackupConfig::default();
                                let mut scheduler = backup::BackupScheduler::new(config);
                                
                                match scheduler.execute_backup(&data.tasks) {
                                    Ok(metadata) => {
                                        log::info!("备份成功: {} 个任务", metadata.task_count);
                                        last_backup_date = Some(today_str);
                                    }
                                    Err(e) => {
                                        log::error!("备份失败: {}", e);
                                    }
                                }
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config::get_statuses,
            config::update_statuses,
            config::delete_status,
            config::get_types,
            config::update_types,
            config::delete_type,
            config::get_priorities,
            config::update_priorities,
            config::delete_priority,
            config::get_themes,
            tasks::get_tasks,
            tasks::add_task,
            tasks::update_task,
            tasks::delete_task,
            tasks::reorder_tasks,
            tasks::get_all_tasks,
            tasks::import_tasks,
            tasks::generate_main_task_id,
            tasks::generate_subtask_id,
            tasks::add_subtask,
            tasks::update_subtask,
            tasks::delete_subtask,
            tasks::query_tasks,
            tasks::get_task_statistics,
            tasks::check_overdue_tasks,
            file_ops::open_file,
            file_ops::save_file,
            file_ops::get_recent_files,
            file_ops::add_recent_file,
            migration::check_migration_needed,
            migration::execute_migration,
            backup::execute_backup,
            backup::get_backup_history,
            backup::cleanup_old_backups,
            backup::restore_from_backup,
            backup::verify_backup_integrity,
            backup::get_backup_by_id,
            error_logger::log_error_to_backend,
            error_logger::get_error_logs,
            error_logger::get_error_statistics,
            error_logger::cleanup_error_logs,
            recovery::execute_recovery,
            recovery::get_recovery_history,
            recovery::determine_recovery_strategy,
            sharded_store::get_tasks_paginated,
            sharded_store::get_tasks_by_date_range,
            sharded_store::get_task_index_stats,
            sharded_store::get_query_cache_stats,
            sharded_store::get_tasks_optimized,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
