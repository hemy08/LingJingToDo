use log::{info, debug, warn, error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
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
pub struct TaskStore {
    pub tasks: Vec<Task>,
    pub task_index: HashMap<String, usize>,
    #[serde(skip)]
    dirty: bool,
    #[serde(skip)]
    unfinished_cache: Option<Vec<Task>>,
}

impl TaskStore {
    pub fn new() -> Self {
        TaskStore {
            tasks: Vec::new(),
            task_index: HashMap::new(),
            dirty: false,
            unfinished_cache: None,
        }
    }

    pub fn load() -> Self {
        let path = Self::get_tasks_file_path();
        
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(tasks) = serde_json::from_str::<Vec<Task>>(&content) {
                    let mut store = TaskStore {
                        tasks,
                        task_index: HashMap::new(),
                        dirty: false,
                        unfinished_cache: None,
                    };
                    store.build_index();
                    info!("从 {} 加载任务数据成功，共 {} 个任务", path.display(), store.tasks.len());
                    return store;
                } else {
                    warn!("任务文件格式错误，创建新实例");
                }
            } else {
                warn!("无法读取任务文件，创建新实例");
            }
        }

        info!("任务数据文件不存在，创建新实例");
        let store = TaskStore::new();
        if let Err(e) = store.save_atomic() {
            error!("创建初始任务文件失败: {}", e);
        }
        store
    }

    fn get_tasks_file_path() -> PathBuf {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");
        let mut path = exe_dir.to_path_buf();
        path.push("data");
        path.push("tasks.json");
        path
    }

    fn build_index(&mut self) {
        self.task_index.clear();
        for (idx, task) in self.tasks.iter().enumerate() {
            self.task_index.insert(task.id.clone(), idx);
        }
    }

    pub fn save(&self) {
        if let Err(e) = self.save_atomic() {
            error!("保存任务数据失败: {}", e);
        }
    }

    fn save_atomic(&self) -> Result<(), std::io::Error> {
        let path = Self::get_tasks_file_path();
        
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let temp_path = path.with_extension("json.tmp");
        let content = serde_json::to_string_pretty(&self.tasks)?;
        fs::write(&temp_path, content)?;
        fs::rename(&temp_path, &path)?;
        
        info!("任务数据保存成功，共 {} 个任务", self.tasks.len());
        Ok(())
    }

    fn invalidate_cache(&mut self) {
        self.unfinished_cache = None;
        self.dirty = true;
    }

    fn get_all_unfinished_tasks(&mut self) -> Vec<Task> {
        if let Some(ref cache) = self.unfinished_cache {
            return cache.clone();
        }

        let mut unfinished: Vec<Task> = self.tasks.iter()
            .filter(|task| {
                task.status_id != "st_done" && task.status_id != "st_closed"
            })
            .cloned()
            .collect();

        unfinished.sort_by(|a, b| {
            let priority_order = |p: &str| -> u8 {
                match p {
                    "P0" => 0, "P1" => 1, "P2" => 2, "P3" => 3,
                    "P4" => 4, "P5" => 5, "P6" => 6, _ => 7
                }
            };
            
            let pa = priority_order(&a.priority_id);
            let pb = priority_order(&b.priority_id);
            
            if pa != pb {
                pa.cmp(&pb)
            } else {
                b.created_date.cmp(&a.created_date)
            }
        });

        self.unfinished_cache = Some(unfinished.clone());
        unfinished
    }

    pub fn get_tasks(&mut self, _date: &str) -> Vec<Task> {
        debug!("获取未完成任务列表");
        self.get_all_unfinished_tasks()
    }

    pub fn add_task(&mut self, _date: &str, mut task: Task) -> Vec<Task> {
        info!("添加任务，任务ID: {}, 标题: {}", task.id, task.title);
        
        if task.created_date.is_none() {
            task.created_date = Some(chrono::Local::now().to_rfc3339());
        }
        
        self.tasks.push(task);
        self.build_index();
        self.invalidate_cache();
        self.save();
        
        self.get_all_unfinished_tasks()
    }

    pub fn update_task(&mut self, _date: &str, task: Task) -> Option<Vec<Task>> {
        info!("更新任务，任务ID: {}", task.id);
        
        if let Some(&idx) = self.task_index.get(&task.id) {
            self.tasks[idx] = task;
            self.build_index();
            self.invalidate_cache();
            self.save();
            Some(self.get_all_unfinished_tasks())
        } else {
            warn!("未找到要更新的任务: {}", task.id);
            None
        }
    }

    pub fn delete_task(&mut self, _date: &str, task_id: &str) -> Option<Vec<Task>> {
        info!("删除任务，任务ID: {}", task_id);
        
        if let Some(&idx) = self.task_index.get(task_id) {
            self.tasks.remove(idx);
            self.build_index();
            self.invalidate_cache();
            self.save();
            Some(self.get_all_unfinished_tasks())
        } else {
            warn!("未找到要删除的任务: {}", task_id);
            None
        }
    }

    pub fn reorder_tasks(&mut self, _date: &str, reordered_tasks: Vec<Task>) -> Option<Vec<Task>> {
        info!("重排序任务，任务数量: {}", reordered_tasks.len());
        self.tasks = reordered_tasks;
        self.build_index();
        self.invalidate_cache();
        self.save();
        Some(self.get_all_unfinished_tasks())
    }

    pub fn get_all_tasks(&self) -> HashMap<String, Vec<Task>> {
        let mut result = HashMap::new();
        result.insert("all".to_string(), self.tasks.clone());
        result
    }

    pub fn import_tasks(&mut self, tasks_data: HashMap<String, Vec<Task>>) {
        if let Some(tasks) = tasks_data.get("all") {
            self.tasks = tasks.clone();
        } else {
            self.tasks = tasks_data.values().flatten().cloned().collect();
        }
        self.build_index();
        self.invalidate_cache();
        self.save();
    }

    pub fn add_subtask(&mut self, _date: &str, parent_id: &str, subtask: Task) -> Option<Vec<Task>> {
        info!("添加子任务，父任务ID: {}，子任务ID: {}", parent_id, subtask.id);
        
        if let Some(&idx) = self.task_index.get(parent_id) {
            let parent_task = &mut self.tasks[idx];
            let subtasks = parent_task.subtasks.get_or_insert_with(Vec::new);
            subtasks.push(subtask);
            self.invalidate_cache();
            self.save();
            Some(self.get_all_unfinished_tasks())
        } else {
            warn!("未找到父任务: {}", parent_id);
            None
        }
    }

    pub fn update_subtask(&mut self, _date: &str, parent_id: &str, subtask: Task) -> Option<Vec<Task>> {
        info!("更新子任务，父任务ID: {}，子任务ID: {}", parent_id, subtask.id);
        
        if let Some(&idx) = self.task_index.get(parent_id) {
            if let Some(subtasks) = &mut self.tasks[idx].subtasks {
                if let Some(s_idx) = subtasks.iter().position(|s| s.id == subtask.id) {
                    subtasks[s_idx] = subtask;
                    self.invalidate_cache();
                    self.save();
                    return Some(self.get_all_unfinished_tasks());
                }
            }
        }
        None
    }

    pub fn delete_subtask(&mut self, _date: &str, parent_id: &str, subtask_id: &str) -> Option<Vec<Task>> {
        info!("删除子任务，父任务ID: {}，子任务ID: {}", parent_id, subtask_id);
        
        if let Some(&idx) = self.task_index.get(parent_id) {
            if let Some(subtasks) = &mut self.tasks[idx].subtasks {
                subtasks.retain(|s| s.id != subtask_id);
                self.invalidate_cache();
                self.save();
                return Some(self.get_all_unfinished_tasks());
            }
        }
        None
    }

    pub fn query_tasks(&self, _date: &str, type_id: Option<&str>, status_id: Option<&str>, priority_id: Option<&str>) -> Vec<Task> {
        info!("查询任务，类型: {:?}，状态: {:?}，优先级: {:?}", type_id, status_id, priority_id);
        
        let result: Vec<Task> = self.tasks.iter()
            .filter(|t| {
                let type_match = type_id.map_or(true, |id| t.type_id == id);
                let status_match = status_id.map_or(true, |id| t.status_id == id);
                let priority_match = priority_id.map_or(true, |id| t.priority_id == id);
                type_match && status_match && priority_match
            })
            .cloned()
            .collect();
        
        info!("查询到 {} 个符合条件的任务", result.len());
        result
    }

    pub fn check_and_update_overdue_tasks(&mut self) -> usize {
        info!("开始检查过期任务（包含子任务）...");
        
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let mut updated_count = 0;
        
        for task in &mut self.tasks {
            // 检查主任务
            if let Some(due_date) = &task.due_date {
                if due_date < &today {
                    let status = task.status_id.as_str();
                    if status != "st_done" && status != "st_closed" && status != "st_overdue" {
                        info!("主任务 [{}] 已过期，截止日期: {}，状态更新为 st_overdue", task.title, due_date);
                        task.status_id = "st_overdue".to_string();
                        updated_count += 1;
                    }
                }
            }
            
            // 检查子任务
            if let Some(subtasks) = &mut task.subtasks {
                for subtask in subtasks.iter_mut() {
                    if let Some(due_date) = &subtask.due_date {
                        if due_date < &today {
                            let status = subtask.status_id.as_str();
                            if status != "st_done" && status != "st_closed" && status != "st_overdue" {
                                info!("子任务 [{}] 已过期，截止日期: {}，状态更新为 st_overdue", subtask.title, due_date);
                                subtask.status_id = "st_overdue".to_string();
                                updated_count += 1;
                            }
                        }
                    }
                }
            }
        }
        
        if updated_count > 0 {
            self.build_index();
            self.invalidate_cache();
            self.save();
            info!("共更新 {} 个过期任务（包含子任务）", updated_count);
        } else {
            info!("未发现需要更新的过期任务");
        }
        
        updated_count
    }
}

#[tauri::command]
pub fn generate_main_task_id() -> String {
    let id = format!("US{}", chrono::Local::now().timestamp_millis());
    info!("生成主任务ID: {}", id);
    id
}

#[tauri::command]
pub fn generate_subtask_id() -> String {
    let id = format!("TASK{}", chrono::Local::now().timestamp_millis());
    info!("生成子任务ID: {}", id);
    id
}

#[tauri::command]
pub fn get_tasks(state: State<Mutex<TaskStore>>, date: String) -> Vec<Task> {
    let mut data = state.lock().unwrap();
    data.get_tasks(&date)
}

#[tauri::command]
pub fn add_task(state: State<Mutex<TaskStore>>, date: String, task: Task) -> Vec<Task> {
    let mut data = state.lock().unwrap();
    data.add_task(&date, task)
}

#[tauri::command]
pub fn update_task(state: State<Mutex<TaskStore>>, date: String, task: Task) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.update_task(&date, task)
}

#[tauri::command]
pub fn delete_task(state: State<Mutex<TaskStore>>, date: String, task_id: String) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.delete_task(&date, &task_id)
}

#[tauri::command]
pub fn reorder_tasks(state: State<Mutex<TaskStore>>, date: String, reordered_tasks: Vec<Task>) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.reorder_tasks(&date, reordered_tasks)
}

#[tauri::command]
pub fn get_all_tasks(state: State<Mutex<TaskStore>>) -> HashMap<String, Vec<Task>> {
    let data = state.lock().unwrap();
    data.get_all_tasks()
}

#[tauri::command]
pub fn import_tasks(state: State<Mutex<TaskStore>>, tasks_data: HashMap<String, Vec<Task>>) {
    let mut data = state.lock().unwrap();
    data.import_tasks(tasks_data);
}

#[tauri::command]
pub fn add_subtask(state: State<Mutex<TaskStore>>, date: String, parent_id: String, subtask: Task) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.add_subtask(&date, &parent_id, subtask)
}

#[tauri::command]
pub fn update_subtask(state: State<Mutex<TaskStore>>, date: String, parent_id: String, subtask: Task) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.update_subtask(&date, &parent_id, subtask)
}

#[tauri::command]
pub fn delete_subtask(state: State<Mutex<TaskStore>>, date: String, parent_id: String, subtask_id: String) -> Option<Vec<Task>> {
    let mut data = state.lock().unwrap();
    data.delete_subtask(&date, &parent_id, &subtask_id)
}

#[tauri::command]
pub fn query_tasks(
    state: State<Mutex<TaskStore>>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStatistics {
    pub total_count: usize,
    pub main_task_count: usize,
    pub subtask_count: usize,
    pub due_today_count: usize,
    pub overdue_count: usize,
}

#[tauri::command]
pub fn get_task_statistics(state: State<Mutex<TaskStore>>) -> TaskStatistics {
    let data = state.lock().unwrap();
    
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let now = chrono::Local::now().format("%Y-%m-%d").to_string();
    
    let main_task_count = data.tasks.len();
    
    let subtask_count = data.tasks.iter()
        .filter_map(|task| task.subtasks.as_ref())
        .map(|subtasks| subtasks.len())
        .sum();
    
    let total_count = main_task_count + subtask_count;
    
    let due_today_count = data.tasks.iter()
        .filter(|task| task.due_date.as_ref().map_or(false, |d| d == &today))
        .count();
    
    let overdue_count = data.tasks.iter()
        .filter(|task| {
            if let Some(due_date) = &task.due_date {
                if due_date < &now {
                    let status = task.status_id.as_str();
                    status != "st_closed" && status != "st_done"
                } else {
                    false
                }
            } else {
                false
            }
        })
        .count();
    
    TaskStatistics {
        total_count,
        main_task_count,
        subtask_count,
        due_today_count,
        overdue_count,
    }
}

#[tauri::command]
pub fn check_overdue_tasks(state: State<Mutex<TaskStore>>) -> usize {
    let mut data = state.lock().unwrap();
    data.check_and_update_overdue_tasks()
}
