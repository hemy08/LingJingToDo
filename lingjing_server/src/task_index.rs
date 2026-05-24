use crate::query_optimizer::Task;
use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskIndex {
    pub date_index: HashMap<String, Vec<String>>,
    pub status_index: HashMap<String, Vec<String>>,
    pub type_index: HashMap<String, Vec<String>>,
    pub priority_index: HashMap<String, Vec<String>>,
    pub task_to_date: HashMap<String, String>,
    pub last_updated: String,
}

impl TaskIndex {
    pub fn new() -> Self {
        TaskIndex {
            date_index: HashMap::new(),
            status_index: HashMap::new(),
            type_index: HashMap::new(),
            priority_index: HashMap::new(),
            task_to_date: HashMap::new(),
            last_updated: chrono::Local::now().to_rfc3339(),
        }
    }

    pub fn load() -> Self {
        let path = Self::get_index_file_path();
        
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(index) = serde_json::from_str::<TaskIndex>(&content) {
                    info!("加载任务索引成功");
                    return index;
                }
            }
        }

        info!("任务索引文件不存在，创建新索引");
        TaskIndex::new()
    }

    pub fn save(&self) {
        let path = Self::get_index_file_path();
        
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        if let Ok(content) = serde_json::to_string_pretty(&self) {
            if let Err(e) = fs::write(&path, content) {
                log::error!("保存任务索引失败: {}", e);
            } else {
                info!("任务索引保存成功");
            }
        }
    }

    fn get_index_file_path() -> PathBuf {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");
        let mut path = exe_dir.to_path_buf();
        path.push("data");
        path.push("tasks_index.json");
        path
    }

    pub fn rebuild_from_tasks(&mut self, tasks_by_date: &HashMap<String, Vec<Task>>) {
        self.date_index.clear();
        self.status_index.clear();
        self.type_index.clear();
        self.priority_index.clear();
        self.task_to_date.clear();

        for (date, tasks) in tasks_by_date {
            let mut task_ids = Vec::new();
            
            for task in tasks {
                task_ids.push(task.id.clone());
                self.task_to_date.insert(task.id.clone(), date.clone());
                
                self.status_index
                    .entry(task.status_id.clone())
                    .or_insert_with(Vec::new)
                    .push(task.id.clone());
                
                self.type_index
                    .entry(task.type_id.clone())
                    .or_insert_with(Vec::new)
                    .push(task.id.clone());
                
                self.priority_index
                    .entry(task.priority_id.clone())
                    .or_insert_with(Vec::new)
                    .push(task.id.clone());
            }
            
            self.date_index.insert(date.clone(), task_ids);
        }

        self.last_updated = chrono::Local::now().to_rfc3339();
        info!("索引重建完成，共 {} 个日期，{} 个任务", 
            self.date_index.len(), 
            self.task_to_date.len());
    }

    pub fn add_task(&mut self, date: &str, task: &Task) {
        self.date_index
            .entry(date.to_string())
            .or_insert_with(Vec::new)
            .push(task.id.clone());
        
        self.task_to_date.insert(task.id.clone(), date.to_string());
        
        self.status_index
            .entry(task.status_id.clone())
            .or_insert_with(Vec::new)
            .push(task.id.clone());
        
        self.type_index
            .entry(task.type_id.clone())
            .or_insert_with(Vec::new)
            .push(task.id.clone());
        
        self.priority_index
            .entry(task.priority_id.clone())
            .or_insert_with(Vec::new)
            .push(task.id.clone());

        self.last_updated = chrono::Local::now().to_rfc3339();
    }

    pub fn update_task(&mut self, old_task: &Task, new_task: &Task, new_date: Option<&str>) {
        let old_date = self.task_to_date.get(&old_task.id).cloned();
        
        self.remove_task(&old_task.id);
        
        let date = new_date.unwrap_or_else(|| {
            old_date.as_deref().unwrap_or("")
        });
        
        self.add_task(date, new_task);
    }

    pub fn remove_task(&mut self, task_id: &str) {
        if let Some(date) = self.task_to_date.remove(task_id) {
            if let Some(task_ids) = self.date_index.get_mut(&date) {
                task_ids.retain(|id| id != task_id);
                if task_ids.is_empty() {
                    self.date_index.remove(&date);
                }
            }
        }

        for task_ids in self.status_index.values_mut() {
            task_ids.retain(|id| id != task_id);
        }
        
        for task_ids in self.type_index.values_mut() {
            task_ids.retain(|id| id != task_id);
        }
        
        for task_ids in self.priority_index.values_mut() {
            task_ids.retain(|id| id != task_id);
        }

        self.last_updated = chrono::Local::now().to_rfc3339();
    }

    pub fn get_task_ids_by_date(&self, date: &str) -> Option<&Vec<String>> {
        self.date_index.get(date)
    }

    pub fn get_task_ids_by_status(&self, status_id: &str) -> Option<&Vec<String>> {
        self.status_index.get(status_id)
    }

    pub fn get_task_ids_by_type(&self, type_id: &str) -> Option<&Vec<String>> {
        self.type_index.get(type_id)
    }

    pub fn get_task_ids_by_priority(&self, priority_id: &str) -> Option<&Vec<String>> {
        self.priority_index.get(priority_id)
    }

    pub fn get_task_date(&self, task_id: &str) -> Option<&String> {
        self.task_to_date.get(task_id)
    }

    pub fn get_stats(&self) -> IndexStats {
        IndexStats {
            total_tasks: self.task_to_date.len(),
            date_count: self.date_index.len(),
            status_count: self.status_index.len(),
            type_count: self.type_index.len(),
            priority_count: self.priority_index.len(),
            last_updated: self.last_updated.clone(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct IndexStats {
    pub total_tasks: usize,
    pub date_count: usize,
    pub status_count: usize,
    pub type_count: usize,
    pub priority_count: usize,
    pub last_updated: String,
}

impl Default for TaskIndex {
    fn default() -> Self {
        Self::new()
    }
}
