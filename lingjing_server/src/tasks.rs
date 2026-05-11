use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub status_id: String,
    pub type_id: String,
    pub priority_id: String,
    pub due_date: Option<String>,
    pub subtasks: Option<Vec<Task>>,
    pub remark: Option<String>,
    pub created_date: Option<String>,
    pub closed_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskData {
    pub tasks: HashMap<String, Vec<Task>>,
}

impl TaskData {
    pub fn new() -> Self {
        TaskData {
            tasks: HashMap::new(),
        }
    }

    pub fn load() -> Self {
        let path = Self::get_data_path();
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(data) = serde_json::from_str(&content) {
                    return data;
                }
            }
        }
        Self::new()
    }

    pub fn save(&self) {
        let path = Self::get_data_path();
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(content) = serde_json::to_string_pretty(&self) {
            let _ = fs::write(&path, content);
        }
    }

    fn get_data_path() -> PathBuf {
        let mut path = PathBuf::from(".");
        path.push("data");
        path.push("tasks.json");
        path
    }

    pub fn get_tasks(&self, date: &str) -> Vec<Task> {
        self.tasks.get(date).cloned().unwrap_or_default()
    }

    pub fn add_task(&mut self, date: &str, task: Task) -> Vec<Task> {
        let tasks = self.tasks.entry(date.to_string()).or_insert_with(Vec::new);
        tasks.push(task);
        self.save();
        tasks.clone()
    }

    pub fn update_task(&mut self, date: &str, task: Task) -> Option<Vec<Task>> {
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(index) = tasks.iter().position(|t| t.id == task.id) {
                tasks[index] = task;
                self.save();
                return Some(tasks.clone());
            }
        }
        None
    }

    pub fn delete_task(&mut self, date: &str, task_id: &str) -> Option<Vec<Task>> {
        if let Some(tasks) = self.tasks.get_mut(date) {
            tasks.retain(|t| t.id != task_id);
            self.save();
            return Some(tasks.clone());
        }
        None
    }

    pub fn reorder_tasks(&mut self, date: &str, reordered_tasks: Vec<Task>) -> Option<Vec<Task>> {
        if let Some(tasks) = self.tasks.get_mut(date) {
            *tasks = reordered_tasks;
            self.save();
            return Some(tasks.clone());
        }
        None
    }

    pub fn get_all_tasks(&self) -> HashMap<String, Vec<Task>> {
        self.tasks.clone()
    }

    pub fn import_tasks(&mut self, tasks_data: HashMap<String, Vec<Task>>) {
        self.tasks = tasks_data;
        self.save();
    }

    // 添加子任务
    pub fn add_subtask(&mut self, date: &str, parent_id: &str, subtask: Task) -> Option<Vec<Task>> {
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(parent_task) = tasks.iter_mut().find(|t| t.id == parent_id) {
                let subtasks = parent_task.subtasks.get_or_insert_with(Vec::new);
                subtasks.push(subtask);
                self.save();
                return Some(tasks.clone());
            }
        }
        None
    }

    // 更新子任务
    pub fn update_subtask(&mut self, date: &str, parent_id: &str, subtask: Task) -> Option<Vec<Task>> {
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(parent_task) = tasks.iter_mut().find(|t| t.id == parent_id) {
                if let Some(subtasks) = &mut parent_task.subtasks {
                    if let Some(index) = subtasks.iter().position(|s| s.id == subtask.id) {
                        subtasks[index] = subtask;
                        self.save();
                        return Some(tasks.clone());
                    }
                }
            }
        }
        None
    }

    // 删除子任务
    pub fn delete_subtask(&mut self, date: &str, parent_id: &str, subtask_id: &str) -> Option<Vec<Task>> {
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(parent_task) = tasks.iter_mut().find(|t| t.id == parent_id) {
                if let Some(subtasks) = &mut parent_task.subtasks {
                    subtasks.retain(|s| s.id != subtask_id);
                    self.save();
                    return Some(tasks.clone());
                }
            }
        }
        None
    }

    // 按条件查询任务
    pub fn query_tasks(&self, date: &str, type_id: Option<&str>, status_id: Option<&str>, priority_id: Option<&str>) -> Vec<Task> {
        if let Some(tasks) = self.tasks.get(date) {
            tasks.iter()
                .filter(|t| {
                    let type_match = type_id.map_or(true, |id| t.type_id == id);
                    let status_match = status_id.map_or(true, |id| t.status_id == id);
                    let priority_match = priority_id.map_or(true, |id| t.priority_id == id);
                    type_match && status_match && priority_match
                })
                .cloned()
                .collect()
        } else {
            Vec::new()
        }
    }
}

// 生成主任务 ID
pub fn generate_main_task_id() -> String {
    format!("US{}", chrono::Local::now().timestamp_millis())
}

// 生成子任务 ID
pub fn generate_subtask_id() -> String {
    format!("TASK{}", chrono::Local::now().timestamp_millis())
}

// Tauri 命令
#[tauri::command]
pub fn get_tasks(state: State<Mutex<TaskData>>, date: String) -> Vec<Task> {
    let data = state.lock().unwrap();
    data.get_tasks(&date)
}

#[tauri::command]
pub fn add_task(state: State<Mutex<TaskData>>, date: String, task: Task) -> Vec<Task> {
    let mut data = state.lock().unwrap();
    data.add_task(&date, task)
}

#[tauri::command]
pub fn update_task(state: State<Mutex<TaskData>>, date: String, task: Task) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.update_task(&date, task)
}

#[tauri::command]
pub fn delete_task(state: State<Mutex<TaskData>>, date: String, task_id: String) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.delete_task(&date, &task_id)
}

#[tauri::command]
pub fn reorder_tasks(state: State<Mutex<TaskData>>, date: String, reordered_tasks: Vec<Task>) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.reorder_tasks(&date, reordered_tasks)
}

#[tauri::command]
pub fn get_all_tasks(state: State<Mutex<TaskData>>) -> HashMap<String, Vec<Task>> {
    let data = state.lock().unwrap();
    data.get_all_tasks()
}

#[tauri::command]
pub fn import_tasks(state: State<Mutex<TaskData>>, tasks_data: HashMap<String, Vec<Task>>) {
    let mut data = state.lock().unwrap();
    data.import_tasks(tasks_data);
}

#[tauri::command]
pub fn generate_main_task_id() -> String {
    generate_main_task_id()
}

#[tauri::command]
pub fn generate_subtask_id() -> String {
    generate_subtask_id()
}

// 子任务相关命令
#[tauri::command]
pub fn add_subtask(state: State<Mutex<TaskData>>, date: String, parent_id: String, subtask: Task) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.add_subtask(&date, &parent_id, subtask)
}

#[tauri::command]
pub fn update_subtask(state: State<Mutex<TaskData>>, date: String, parent_id: String, subtask: Task) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.update_subtask(&date, &parent_id, subtask)
}

#[tauri::command]
pub fn delete_subtask(state: State<Mutex<TaskData>>, date: String, parent_id: String, subtask_id: String) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.delete_subtask(&date, &parent_id, &subtask_id)
}

// 查询命令
#[tauri::command]
pub fn query_tasks(
    state: State<Mutex<TaskData>>,
    date: String,
    type_id: Option<String>,
    status_id: Option<String>,
    priority_id: Option<String>,
) -> Vec<Task> {
    let data = state.lock().unwrap();
    data.query_tasks(
        &date,
        type_id.as_deref(),
        status_id.as_deref(),
        priority_id.as_deref(),
    )
}
