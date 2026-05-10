use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Status {
    pub id: String,
    pub name: String,
    pub color: String,
    pub emoji: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Type {
    pub id: String,
    pub name: String,
    pub color: String,
    pub emoji: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Priority {
    pub id: String,
    pub name: String,
    pub color: String,
    pub emoji: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub id: String,
    pub name: String,
    pub primary: String,
    pub secondary: String,
    pub background: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub statuses: Vec<Status>,
    pub types: Vec<Type>,
    pub priorities: Vec<Priority>,
    pub themes: Vec<Theme>,
    pub recent_files: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            statuses: vec![
                Status { id: "st_default".to_string(), name: "待规划".to_string(), color: "#6c757d".to_string(), emoji: "📋".to_string() },
                Status { id: "st_start".to_string(), name: "已启动".to_string(), color: "#2b8c5e".to_string(), emoji: "🚀".to_string() },
                Status { id: "st_doing".to_string(), name: "进行中".to_string(), color: "#f59e0b".to_string(), emoji: "⚡".to_string() },
                Status { id: "st_done".to_string(), name: "已完成".to_string(), color: "#3b82f6".to_string(), emoji: "✅".to_string() },
                Status { id: "st_delay".to_string(), name: "已延期".to_string(), color: "#dc2626".to_string(), emoji: "⏰".to_string() },
            ],
            types: vec![
                Type { id: "ty_work".to_string(), name: "工作".to_string(), color: "#0d6efd".to_string(), emoji: "💼".to_string() },
                Type { id: "ty_study".to_string(), name: "学习".to_string(), color: "#6f42c1".to_string(), emoji: "📚".to_string() },
                Type { id: "ty_life".to_string(), name: "生活".to_string(), color: "#20c997".to_string(), emoji: "🏠".to_string() },
            ],
            priorities: vec![
                Priority { id: "p0".to_string(), name: "最高优先级".to_string(), color: "#e74c3c".to_string(), emoji: "🔥".to_string() },
                Priority { id: "p1".to_string(), name: "非常紧急".to_string(), color: "#e67e22".to_string(), emoji: "⚠️".to_string() },
                Priority { id: "p2".to_string(), name: "紧急".to_string(), color: "#f39c12".to_string(), emoji: "🔶".to_string() },
                Priority { id: "p3".to_string(), name: "重要".to_string(), color: "#3498db".to_string(), emoji: "💎".to_string() },
                Priority { id: "p4".to_string(), name: "中等".to_string(), color: "#2ecc71".to_string(), emoji: "📊".to_string() },
                Priority { id: "p5".to_string(), name: "一般".to_string(), color: "#95a5a6".to_string(), emoji: "📝".to_string() },
                Priority { id: "p6".to_string(), name: "不紧急".to_string(), color: "#bdc3c7".to_string(), emoji: "💤".to_string() },
            ],
            themes: vec![
                Theme { id: "theme_default".to_string(), name: "默认".to_string(), primary: "#0077c8".to_string(), secondary: "#6c757d".to_string(), background: "#ffffff".to_string(), text: "#333333".to_string() },
            ],
            recent_files: vec![],
        }
    }
}

pub struct ConfigState {
    pub config: Mutex<Config>,
    pub config_path: PathBuf,
}

impl ConfigState {
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        let config_dir = app_handle.path().app_config_dir().expect("Failed to get config dir");
        fs::create_dir_all(&config_dir).expect("Failed to create config dir");
        
        let config_path = config_dir.join("config.json");
        
        let config = if config_path.exists() {
            let content = fs::read_to_string(&config_path).expect("Failed to read config file");
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            let default_config = Config::default();
            let content = serde_json::to_string_pretty(&default_config).expect("Failed to serialize config");
            fs::write(&config_path, &content).expect("Failed to write config file");
            default_config
        };
        
        ConfigState {
            config: Mutex::new(config),
            config_path,
        }
    }
    
    pub fn save(&self) {
        let config = self.config.lock().unwrap();
        let content = serde_json::to_string_pretty(&*config).expect("Failed to serialize config");
        fs::write(&self.config_path, &content).expect("Failed to write config file");
    }
}

// API命令
#[tauri::command]
pub fn get_statuses(state: tauri::State<ConfigState>) -> Vec<Status> {
    let config = state.config.lock().unwrap();
    config.statuses.clone()
}

#[tauri::command]
pub fn add_status(state: tauri::State<ConfigState>, status: Status) -> Vec<Status> {
    let mut config = state.config.lock().unwrap();
    config.statuses.push(status);
    let result = config.statuses.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn update_status(state: tauri::State<ConfigState>, status: Status) -> Vec<Status> {
    let mut config = state.config.lock().unwrap();
    if let Some(pos) = config.statuses.iter().position(|s| s.id == status.id) {
        config.statuses[pos] = status;
    }
    let result = config.statuses.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn delete_status(state: tauri::State<ConfigState>, id: String) -> Vec<Status> {
    let mut config = state.config.lock().unwrap();
    config.statuses.retain(|s| s.id != id);
    let result = config.statuses.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn get_types(state: tauri::State<ConfigState>) -> Vec<Type> {
    let config = state.config.lock().unwrap();
    config.types.clone()
}

#[tauri::command]
pub fn add_type(state: tauri::State<ConfigState>, type_item: Type) -> Vec<Type> {
    let mut config = state.config.lock().unwrap();
    config.types.push(type_item);
    let result = config.types.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn update_type(state: tauri::State<ConfigState>, type_item: Type) -> Vec<Type> {
    let mut config = state.config.lock().unwrap();
    if let Some(pos) = config.types.iter().position(|t| t.id == type_item.id) {
        config.types[pos] = type_item;
    }
    let result = config.types.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn delete_type(state: tauri::State<ConfigState>, id: String) -> Vec<Type> {
    let mut config = state.config.lock().unwrap();
    config.types.retain(|t| t.id != id);
    let result = config.types.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn get_priorities(state: tauri::State<ConfigState>) -> Vec<Priority> {
    let config = state.config.lock().unwrap();
    config.priorities.clone()
}

#[tauri::command]
pub fn add_priority(state: tauri::State<ConfigState>, priority: Priority) -> Vec<Priority> {
    let mut config = state.config.lock().unwrap();
    config.priorities.push(priority);
    let result = config.priorities.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn update_priority(state: tauri::State<ConfigState>, priority: Priority) -> Vec<Priority> {
    let mut config = state.config.lock().unwrap();
    if let Some(pos) = config.priorities.iter().position(|p| p.id == priority.id) {
        config.priorities[pos] = priority;
    }
    let result = config.priorities.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn delete_priority(state: tauri::State<ConfigState>, id: String) -> Vec<Priority> {
    let mut config = state.config.lock().unwrap();
    config.priorities.retain(|p| p.id != id);
    let result = config.priorities.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn get_themes(state: tauri::State<ConfigState>) -> Vec<Theme> {
    let config = state.config.lock().unwrap();
    config.themes.clone()
}

#[tauri::command]
pub fn get_recent_files(state: tauri::State<ConfigState>) -> Vec<String> {
    let config = state.config.lock().unwrap();
    config.recent_files.clone()
}

#[tauri::command]
pub fn add_recent_file(state: tauri::State<ConfigState>, file_path: String) -> Vec<String> {
    let mut config = state.config.lock().unwrap();
    config.recent_files.retain(|f| f != &file_path);
    config.recent_files.insert(0, file_path);
    if config.recent_files.len() > 10 {
        config.recent_files.truncate(10);
    }
    let result = config.recent_files.clone();
    drop(config);
    state.save();
    result
}
