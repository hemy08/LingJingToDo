mod config;
mod tasks;
mod file_ops;

use config::ConfigState;
use tasks::TaskData;
use tauri::Manager;
use std::sync::Mutex;
use tauri_plugin_process;
use std::time::Duration;
use std::thread;

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

            // 启动自动保存定时任务
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                loop {
                    // 计算到下一个凌晨1点的时间
                    let now = chrono::Local::now();
                    let tomorrow = now.date_naive() + chrono::Duration::days(1);
                    let next_1am = chrono::DateTime::from_naive_utc_and_offset(
                        tomorrow.and_hms_opt(1, 0, 0).unwrap(),
                        *now.offset()
                    );
                    let duration_until_1am = next_1am - now;

                    log::info!("下次自动保存时间: {} ({}秒后)", next_1am, duration_until_1am.num_seconds());

                    // 等待到凌晨1点
                    thread::sleep(Duration::from_secs(duration_until_1am.num_seconds() as u64));

                    // 执行保存
                    if let Some(task_data) = app_handle.try_state::<Mutex<TaskData>>() {
                        let data = task_data.lock().unwrap();
                        data.save();
                        log::info!("凌晨1点自动保存完成");
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
            file_ops::open_file,
            file_ops::save_file,
            file_ops::get_recent_files,
            file_ops::add_recent_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
