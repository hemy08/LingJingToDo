use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use log::info;

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
pub struct Owner {
    pub id: String,
    pub name: String,
    pub color: String,
    pub emoji: String,
    pub skills: Option<Vec<String>>,
    pub types: Option<Vec<String>>,
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
    pub owners: Vec<Owner>,
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
                Status { id: "st_closed".to_string(), name: "已关闭".to_string(), color: "#9ca3af".to_string(), emoji: "🔒".to_string() },
            ],
            types: vec![
                Type { id: "ty_requirement".to_string(), name: "需求".to_string(), color: "#0d6efd".to_string(), emoji: "📋".to_string() },
                Type { id: "ty_issue".to_string(), name: "问题".to_string(), color: "#dc2626".to_string(), emoji: "🐛".to_string() },
                Type { id: "ty_feature".to_string(), name: "入项".to_string(), color: "#10b981".to_string(), emoji: "✨".to_string() },
                Type { id: "ty_research".to_string(), name: "攻关".to_string(), color: "#f59e0b".to_string(), emoji: "🔬".to_string() },
                Type { id: "ty_maintenance".to_string(), name: "维护".to_string(), color: "#6b7280".to_string(), emoji: "🔧".to_string() },
                Type { id: "ty_work".to_string(), name: "工作".to_string(), color: "#0d6efd".to_string(), emoji: "💼".to_string() },
                Type { id: "ty_study".to_string(), name: "学习".to_string(), color: "#6f42c1".to_string(), emoji: "📚".to_string() },
                Type { id: "ty_life".to_string(), name: "生活".to_string(), color: "#20c997".to_string(), emoji: "🏠".to_string() },
            ],
            priorities: vec![
                Priority { id: "p0".to_string(), name: "P0 - 致命".to_string(), color: "#e74c3c".to_string(), emoji: "🚨".to_string() },
                Priority { id: "p1".to_string(), name: "P1 - 紧急".to_string(), color: "#e67e22".to_string(), emoji: "🔥".to_string() },
                Priority { id: "p2".to_string(), name: "P2 - 高".to_string(), color: "#f39c12".to_string(), emoji: "🔴".to_string() },
                Priority { id: "p3".to_string(), name: "P3 - 中".to_string(), color: "#3498db".to_string(), emoji: "🟡".to_string() },
                Priority { id: "p4".to_string(), name: "P4 - 低".to_string(), color: "#2ecc71".to_string(), emoji: "🟢".to_string() },
                Priority { id: "p5".to_string(), name: "P5 - N".to_string(), color: "#95a5a6".to_string(), emoji: "⚪".to_string() },
                Priority { id: "p6".to_string(), name: "不紧急".to_string(), color: "#bdc3c7".to_string(), emoji: "💤".to_string() },
            ],
            owners: vec![
                Owner { id: "owner_default".to_string(), name: "默认责任人".to_string(), color: "#6c757d".to_string(), emoji: "👤".to_string(), skills: Some(vec![]), types: Some(vec![]) },
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
    let result = config.statuses.clone();
    info!("获取状态列表: {} 个状态", result.len());
    result
}

#[tauri::command]
pub fn update_statuses(state: tauri::State<ConfigState>, statuses: Vec<Status>) -> Vec<Status> {
    let mut config = state.config.lock().unwrap();
    info!("全量更新状态列表: {} 个状态", statuses.len());
    config.statuses = statuses;
    let result = config.statuses.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn delete_status(state: tauri::State<ConfigState>, id: String) -> Vec<Status> {
    let mut config = state.config.lock().unwrap();
    info!("删除状态: {}", id);
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
pub fn update_types(state: tauri::State<ConfigState>, types: Vec<Type>) -> Vec<Type> {
    let mut config = state.config.lock().unwrap();
    info!("全量更新类型列表: {} 个类型", types.len());
    config.types = types;
    let result = config.types.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn delete_type(state: tauri::State<ConfigState>, id: String) -> Vec<Type> {
    let mut config = state.config.lock().unwrap();
    info!("删除类型: {}", id);
    config.types.retain(|t| t.id != id);
    let result = config.types.clone();
    drop(config);
    state.save();
    result
}
#[tauri::command]
pub fn get_priorities(state: tauri::State<ConfigState>) -> Vec<Priority> {
    let config = state.config.lock().unwrap();
    let result = config.priorities.clone();
    info!("获取优先级列表: {} 个优先级", result.len());
    result
}

#[tauri::command]
pub fn update_priorities(state: tauri::State<ConfigState>, priorities: Vec<Priority>) -> Vec<Priority> {
    let mut config = state.config.lock().unwrap();
    info!("全量更新优先级列表: {} 个优先级", priorities.len());
    config.priorities = priorities;
    let result = config.priorities.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn delete_priority(state: tauri::State<ConfigState>, id: String) -> Vec<Priority> {
    let mut config = state.config.lock().unwrap();
    info!("删除优先级: {}", id);
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
pub fn get_owners(state: tauri::State<ConfigState>) -> Vec<Owner> {
    let config = state.config.lock().unwrap();
    let result = config.owners.clone();
    info!("获取责任人列表: {} 个责任人", result.len());
    result
}

#[tauri::command]
pub fn update_owners(state: tauri::State<ConfigState>, owners: Vec<Owner>) -> Vec<Owner> {
    let mut config = state.config.lock().unwrap();
    info!("全量更新责任人列表: {} 个责任人", owners.len());
    config.owners = owners;
    let result = config.owners.clone();
    drop(config);
    state.save();
    result
}

#[tauri::command]
pub fn delete_owner(state: tauri::State<ConfigState>, id: String) -> Vec<Owner> {
    let mut config = state.config.lock().unwrap();
    info!("删除责任人: {}", id);
    config.owners.retain(|o| o.id != id);
    let result = config.owners.clone();
    drop(config);
    state.save();
    result
}

