mod config;

use config::ConfigState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let config_state = ConfigState::new(app.handle());
            app.manage(config_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config::get_statuses,
            config::add_status,
            config::update_status,
            config::delete_status,
            config::get_types,
            config::add_type,
            config::update_type,
            config::delete_type,
            config::get_priorities,
            config::add_priority,
            config::update_priority,
            config::delete_priority,
            config::get_themes,
            config::get_recent_files,
            config::add_recent_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
