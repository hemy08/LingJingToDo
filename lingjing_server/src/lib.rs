mod config;

use config::ConfigState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();
    
    log::info!("灵境待办应用启动中...");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            log::info!("初始化配置状态");
            let config_state = ConfigState::new(app.handle());
            app.manage(config_state);
            log::info!("配置状态初始化完成");
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
