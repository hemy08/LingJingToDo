mod config;
mod tasks;
mod file_ops;

use config::ConfigState;
use tasks::TaskData;
use tauri::Manager;
use std::sync::Mutex;
use tauri_plugin_process;

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
            
            log::info!("初始化任务数据状态");
            let task_data = Mutex::new(TaskData::load());
            app.manage(task_data);
            log::info!("任务数据状态初始化完成");
            
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
            config::get_recent_files,
            config::add_recent_file,
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
            file_ops::open_file,
            file_ops::save_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
