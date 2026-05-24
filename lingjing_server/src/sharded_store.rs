use crate::task_index::{TaskIndex, IndexStats};
use crate::query_optimizer::{
    QueryOptimizer, Pagination, PaginatedResult, QueryFilters, TaskSummary, Task,
    sort_tasks_by_priority,
};
use crate::query_cache::CacheStats;
use log::{info, debug, warn, error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShardedTaskStore {
    pub tasks_by_date: HashMap<String, Vec<Task>>,
    #[serde(skip)]
    pub task_index: TaskIndex,
    #[serde(skip)]
    query_optimizer: QueryOptimizer,
    #[serde(skip)]
    dirty_dates: Vec<String>,
    #[serde(skip)]
    dirty: bool,
}

impl ShardedTaskStore {
    pub fn new() -> Self {
        ShardedTaskStore {
            tasks_by_date: HashMap::new(),
            task_index: TaskIndex::new(),
            query_optimizer: QueryOptimizer::new(),
            dirty_dates: Vec::new(),
            dirty: false,
        }
    }

    pub fn load() -> Self {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");
        
        let mut tasks_dir = exe_dir.to_path_buf();
        tasks_dir.push("data");
        tasks_dir.push("tasks");

        let mut tasks_by_date = HashMap::new();

        if tasks_dir.exists() {
            if let Ok(entries) = fs::read_dir(&tasks_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().map_or(false, |ext| ext == "json") {
                        if let Some(filename) = path.file_stem() {
                            let date = filename.to_string_lossy().to_string();
                            if let Ok(content) = fs::read_to_string(&path) {
                                if let Ok(date_tasks) = serde_json::from_str::<Vec<Task>>(&content) {
                                    info!("加载日期 {} 的任务数据，共 {} 个任务", date, date_tasks.len());
                                    tasks_by_date.insert(date, date_tasks);
                                }
                            }
                        }
                    }
                }
            }
        }

        if tasks_by_date.is_empty() {
            let old_path = Self::get_old_tasks_file_path();
            if old_path.exists() {
                info!("检测到旧格式tasks.json，开始迁移...");
                if let Ok(content) = fs::read_to_string(&old_path) {
                    if let Ok(all_tasks) = serde_json::from_str::<Vec<Task>>(&content) {
                        tasks_by_date = Self::migrate_tasks_to_shards(&all_tasks);
                        info!("迁移完成，共 {} 个日期", tasks_by_date.len());
                    }
                }
            }
        }

        let mut store = ShardedTaskStore {
            tasks_by_date,
            task_index: TaskIndex::load(),
            query_optimizer: QueryOptimizer::new(),
            dirty_dates: Vec::new(),
            dirty: false,
        };

        store.task_index.rebuild_from_tasks(&store.tasks_by_date);
        store.task_index.save();

        info!("任务数据加载完成，共 {} 个日期，{} 个任务",
            store.tasks_by_date.len(),
            store.task_index.task_to_date.len());

        store
    }

    fn get_data_dir() -> PathBuf {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");
        let mut path = exe_dir.to_path_buf();
        path.push("data");
        path
    }

    fn get_tasks_dir() -> PathBuf {
        let mut path = Self::get_data_dir();
        path.push("tasks");
        path
    }

    fn get_old_tasks_file_path() -> PathBuf {
        let mut path = Self::get_data_dir();
        path.push("tasks.json");
        path
    }

    fn get_date_file_path(date: &str) -> PathBuf {
        let mut path = Self::get_tasks_dir();
        path.push(format!("{}.json", date));
        path
    }

    fn migrate_tasks_to_shards(tasks: &[Task]) -> HashMap<String, Vec<Task>> {
        let mut tasks_by_date: HashMap<String, Vec<Task>> = HashMap::new();

        for task in tasks {
            let date = task.created_date.as_ref()
                .and_then(|d| {
                    if d.len() >= 10 {
                        Some(d[..10].to_string())
                    } else {
                        None
                    }
                })
                .unwrap_or_else(|| {
                    chrono::Local::now().format("%Y-%m-%d").to_string()
                });

            tasks_by_date
                .entry(date)
                .or_insert_with(Vec::new)
                .push(task.clone());
        }

        for (date, date_tasks) in &tasks_by_date {
            let path = Self::get_date_file_path(date);
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            if let Ok(content) = serde_json::to_string_pretty(date_tasks) {
                let _ = fs::write(&path, content);
            }
        }

        tasks_by_date
    }

    fn mark_dirty(&mut self, date: &str) {
        if !self.dirty_dates.contains(&date.to_string()) {
            self.dirty_dates.push(date.to_string());
        }
        self.dirty = true;
    }

    pub fn save(&mut self) {
        if !self.dirty && self.dirty_dates.is_empty() {
            debug!("无脏数据，跳过保存");
            return;
        }

        let tasks_dir = Self::get_tasks_dir();
        if let Err(e) = fs::create_dir_all(&tasks_dir) {
            error!("创建任务目录失败: {}", e);
            return;
        }

        for date in &self.dirty_dates {
            if let Some(tasks) = self.tasks_by_date.get(date) {
                self.save_date_file(date, tasks);
            }
        }

        self.task_index.save();
        self.dirty_dates.clear();
        self.dirty = false;
        
        info!("任务数据保存完成");
    }

    fn save_date_file(&self, date: &str, tasks: &[Task]) {
        let path = Self::get_date_file_path(date);
        
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        let temp_path = path.with_extension("json.tmp");
        
        if let Ok(content) = serde_json::to_string_pretty(&tasks) {
            if let Err(e) = fs::write(&temp_path, content) {
                error!("写入临时文件失败: {}", e);
                return;
            }
            
            if let Err(e) = fs::rename(&temp_path, &path) {
                error!("重命名文件失败: {}", e);
            } else {
                debug!("日期 {} 数据保存成功，共 {} 个任务", date, tasks.len());
            }
        }
    }

    pub fn get_tasks_by_date(&mut self, date: &str) -> Vec<Task> {
        if let Some(tasks) = self.tasks_by_date.get(date) {
            let mut result = tasks.clone();
            sort_tasks_by_priority(&mut result);
            result
        } else {
            Vec::new()
        }
    }

    pub fn get_all_unfinished_tasks(&mut self) -> Vec<Task> {
        let mut all_tasks: Vec<Task> = self.tasks_by_date.values()
            .flat_map(|tasks| tasks.iter())
            .filter(|task| {
                task.status_id != "st_done" && task.status_id != "st_closed"
            })
            .cloned()
            .collect();

        sort_tasks_by_priority(&mut all_tasks);
        all_tasks
    }

    pub fn add_task(&mut self, date: &str, mut task: Task) -> Vec<Task> {
        info!("添加任务: {} ({})", task.title, task.id);
        
        if task.created_date.is_none() {
            task.created_date = Some(date.to_string());
        }

        self.tasks_by_date
            .entry(date.to_string())
            .or_insert_with(Vec::new)
            .push(task.clone());

        self.task_index.add_task(date, &task);
        self.mark_dirty(date);
        self.query_optimizer.invalidate_cache(date);
        self.save();

        self.get_all_unfinished_tasks()
    }

    pub fn update_task(&mut self, task: Task) -> Option<Vec<Task>> {
        info!("更新任务: {}", task.id);

        if let Some(old_date) = self.task_index.get_task_date(&task.id).cloned() {
            if let Some(old_tasks) = self.tasks_by_date.get_mut(&old_date) {
                if let Some(old_task) = old_tasks.iter().find(|t| t.id == task.id).cloned() {
                    old_tasks.retain(|t| t.id != task.id);
                    
                    let new_date = task.created_date.as_ref()
                        .and_then(|d| if d.len() >= 10 { Some(&d[..10]) } else { None })
                        .unwrap_or(&old_date);
                    
                    self.tasks_by_date
                        .entry(new_date.to_string())
                        .or_insert_with(Vec::new)
                        .push(task.clone());
                    
                    self.task_index.update_task(&old_task, &task, Some(new_date));
                    self.mark_dirty(&old_date);
                    if new_date != old_date {
                        self.mark_dirty(new_date);
                    }
                    
                    self.query_optimizer.invalidate_cache(&old_date);
                    self.query_optimizer.invalidate_cache(new_date);
                    self.save();
                    
                    return Some(self.get_all_unfinished_tasks());
                }
            }
        }

        warn!("未找到任务: {}", task.id);
        None
    }

    pub fn delete_task(&mut self, task_id: &str) -> Option<Vec<Task>> {
        info!("删除任务: {}", task_id);

        if let Some(date) = self.task_index.get_task_date(task_id).cloned() {
            if let Some(tasks) = self.tasks_by_date.get_mut(&date) {
                tasks.retain(|t| t.id != task_id);
                
                if tasks.is_empty() {
                    self.tasks_by_date.remove(&date);
                    let path = Self::get_date_file_path(&date);
                    let _ = fs::remove_file(&path);
                }
                
                self.task_index.remove_task(task_id);
                self.mark_dirty(&date);
                self.query_optimizer.invalidate_cache(&date);
                self.save();
                
                return Some(self.get_all_unfinished_tasks());
            }
        }

        warn!("未找到任务: {}", task_id);
        None
    }

    pub fn get_tasks_paginated(
        &mut self,
        date: &str,
        page: usize,
        page_size: usize,
        filters: Option<QueryFilters>,
    ) -> PaginatedResult<TaskSummary> {
        let tasks = self.tasks_by_date.get(date).cloned().unwrap_or_default();
        let pagination = Pagination::new(page, page_size);
        let filters = filters.unwrap_or_default();
        
        self.query_optimizer.query_tasks_paginated(&tasks, pagination, filters)
    }

    pub fn get_tasks_by_date_range(
        &mut self,
        start_date: &str,
        end_date: &str,
    ) -> Vec<TaskSummary> {
        self.query_optimizer.query_tasks_by_date_range(&self.tasks_by_date, start_date, end_date)
    }

    pub fn get_task_index_stats(&self) -> IndexStats {
        self.task_index.get_stats()
    }

    pub fn get_query_cache_stats(&self) -> CacheStats {
        self.query_optimizer.get_cache_stats()
    }

    pub fn get_task_count(&self) -> usize {
        self.task_index.task_to_date.len()
    }

    pub fn get_date_count(&self) -> usize {
        self.tasks_by_date.len()
    }
}

impl Default for ShardedTaskStore {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub fn get_tasks_paginated(
    state: State<Mutex<ShardedTaskStore>>,
    date: String,
    page: usize,
    page_size: usize,
    status_id: Option<String>,
    type_id: Option<String>,
    priority_id: Option<String>,
    include_completed: Option<bool>,
) -> PaginatedResult<TaskSummary> {
    let mut store = state.lock().unwrap();
    let filters = QueryFilters {
        status_id,
        type_id,
        priority_id,
        include_completed: include_completed.unwrap_or(false),
    };
    store.get_tasks_paginated(&date, page, page_size, Some(filters))
}

#[tauri::command]
pub fn get_tasks_by_date_range(
    state: State<Mutex<ShardedTaskStore>>,
    start_date: String,
    end_date: String,
) -> Vec<TaskSummary> {
    let mut store = state.lock().unwrap();
    store.get_tasks_by_date_range(&start_date, &end_date)
}

#[tauri::command]
pub fn get_task_index_stats(state: State<Mutex<ShardedTaskStore>>) -> IndexStats {
    let store = state.lock().unwrap();
    store.get_task_index_stats()
}

#[tauri::command]
pub fn get_query_cache_stats(state: State<Mutex<ShardedTaskStore>>) -> CacheStats {
    let store = state.lock().unwrap();
    store.get_query_cache_stats()
}

#[tauri::command]
pub fn get_tasks_optimized(state: State<Mutex<ShardedTaskStore>>, date: String) -> Vec<Task> {
    let mut store = state.lock().unwrap();
    store.get_tasks_by_date(&date)
}
