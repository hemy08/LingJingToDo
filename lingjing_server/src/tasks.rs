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
pub struct TaskData {
    pub tasks: HashMap<String, Vec<Task>>,
}

impl TaskData {
    #[allow(dead_code)]
    pub fn new() -> Self {
        TaskData {
            tasks: HashMap::new(),
        }
    }

    pub fn load() -> Self {
        // 从按天的文件加载数据
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");

        let mut tasks_dir = exe_dir.to_path_buf();
        tasks_dir.push("data");
        tasks_dir.push("tasks");

        let mut tasks = HashMap::new();

        // 如果tasks目录存在，读取所有日期的文件
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
                                    tasks.insert(date, date_tasks);
                                }
                            }
                        }
                    }
                }
            }
        }

        if tasks.is_empty() {
            info!("任务数据文件不存在，创建新实例");
        } else {
            info!("任务数据加载成功，共 {} 个日期", tasks.len());
        }

        TaskData { tasks }
    }

    pub fn save(&self) {
        // 按天保存任务数据
        for (date, tasks) in &self.tasks {
            self.save_date(date, tasks);
        }
        info!("任务数据保存成功，共 {} 个日期", self.tasks.len());
    }

    // 保存指定日期的任务数据
    fn save_date(&self, date: &str, tasks: &[Task]) {
        let path = Self::get_date_path(date);
        debug!("保存日期 {} 的任务数据，路径: {:?}", date, path);

        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        if let Ok(content) = serde_json::to_string_pretty(&tasks) {
            if let Err(e) = fs::write(&path, content) {
                error!("保存日期 {} 的任务数据失败: {}", date, e);
            } else {
                info!("日期 {} 的任务数据保存成功，共 {} 个任务", date, tasks.len());
            }
        }
    }

    #[allow(dead_code)]
    fn get_data_path() -> PathBuf {
        // 获取当前可执行文件所在目录
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");

        // 在 exe 所在目录下创建 data 目录
        let mut path = exe_dir.to_path_buf();
        path.push("data");
        path.push("tasks.json");
        path
    }

    // 获取指定日期的数据文件路径
    fn get_date_path(date: &str) -> PathBuf {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");

        let mut path = exe_dir.to_path_buf();
        path.push("data");
        path.push("tasks");
        path.push(format!("{}.json", date));
        path
    }

    pub fn get_tasks(&self, date: &str) -> Vec<Task> {
        debug!("获取日期 {} 的任务", date);
        let tasks = self.tasks.get(date).cloned().unwrap_or_default();
        info!("获取到 {} 个任务", tasks.len());
        tasks
    }

    pub fn add_task(&mut self, date: &str, mut task: Task) -> Vec<Task> {
        info!("添加任务到日期 {}，任务ID: {}, 标题: {}", date, task.id, task.title);
        
        // 如果没有创建时间，自动设置
        if task.created_date.is_none() {
            task.created_date = Some(chrono::Local::now().to_rfc3339());
        }
        
        let tasks = self.tasks.entry(date.to_string()).or_insert_with(Vec::new);
        tasks.push(task);
        let result = tasks.clone();
        self.save();
        result
    }

    pub fn update_task(&mut self, date: &str, task: Task) -> Option<Vec<Task>> {
        info!("更新任务，日期: {}，任务ID: {}", date, task.id);
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(index) = tasks.iter().position(|t| t.id == task.id) {
                tasks[index] = task;
                let result = tasks.clone();
                self.save();
                return Some(result);
            }
            warn!("未找到要更新的任务: {}", task.id);
        }
        None
    }

    pub fn delete_task(&mut self, date: &str, task_id: &str) -> Option<Vec<Task>> {
        info!("删除任务，日期: {}，任务ID: {}", date, task_id);
        if let Some(tasks) = self.tasks.get_mut(date) {
            tasks.retain(|t| t.id != task_id);
            let result = tasks.clone();
            self.save();
            return Some(result);
        }
        warn!("未找到日期 {} 的任务列表", date);
        None
    }

    pub fn reorder_tasks(&mut self, date: &str, reordered_tasks: Vec<Task>) -> Option<Vec<Task>> {
        info!("重排序任务，日期: {}，任务数量: {}", date, reordered_tasks.len());
        if let Some(tasks) = self.tasks.get_mut(date) {
            *tasks = reordered_tasks;
            let result = tasks.clone();
            self.save();
            return Some(result);
        }
        warn!("未找到日期 {} 的任务列表", date);
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
        info!("添加子任务，日期: {}，父任务ID: {}，子任务ID: {}", date, parent_id, subtask.id);
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(parent_task) = tasks.iter_mut().find(|t| t.id == parent_id) {
                let subtasks = parent_task.subtasks.get_or_insert_with(Vec::new);
                subtasks.push(subtask);
                let result = tasks.clone();
                self.save();
                return Some(result);
            }
            warn!("未找到父任务: {}", parent_id);
        }
        None
    }

    // 更新子任务
    pub fn update_subtask(&mut self, date: &str, parent_id: &str, subtask: Task) -> Option<Vec<Task>> {
        info!("更新子任务，日期: {}，父任务ID: {}，子任务ID: {}", date, parent_id, subtask.id);
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(parent_task) = tasks.iter_mut().find(|t| t.id == parent_id) {
                if let Some(subtasks) = &mut parent_task.subtasks {
                    if let Some(index) = subtasks.iter().position(|s| s.id == subtask.id) {
                        subtasks[index] = subtask;
                        let result = tasks.clone();
                        self.save();
                        return Some(result);
                    }
                }
            }
        }
        None
    }

    // 删除子任务
    pub fn delete_subtask(&mut self, date: &str, parent_id: &str, subtask_id: &str) -> Option<Vec<Task>> {
        info!("删除子任务，日期: {}，父任务ID: {}，子任务ID: {}", date, parent_id, subtask_id);
        if let Some(tasks) = self.tasks.get_mut(date) {
            if let Some(parent_task) = tasks.iter_mut().find(|t| t.id == parent_id) {
                if let Some(subtasks) = &mut parent_task.subtasks {
                    subtasks.retain(|s| s.id != subtask_id);
                    let result = tasks.clone();
                    self.save();
                    return Some(result);
                }
            }
        }
        None
    }

    // 按条件查询任务
    pub fn query_tasks(&self, date: &str, type_id: Option<&str>, status_id: Option<&str>, priority_id: Option<&str>) -> Vec<Task> {
        info!("查询任务，日期: {}，类型: {:?}，状态: {:?}，优先级: {:?}", date, type_id, status_id, priority_id);
        if let Some(tasks) = self.tasks.get(date) {
            let result: Vec<Task> = tasks.iter()
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
        } else {
            info!("未找到日期 {} 的任务列表", date);
            Vec::new()
        }
    }
}

// 生成主任务 ID
#[tauri::command]
pub fn generate_main_task_id() -> String {
    let id = format!("US{}", chrono::Local::now().timestamp_millis());
    info!("生成主任务ID: {}", id);
    id
}

// 生成子任务 ID
#[tauri::command]
pub fn generate_subtask_id() -> String {
    let id = format!("TASK{}", chrono::Local::now().timestamp_millis());
    info!("生成子任务ID: {}", id);
    id
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

// 任务统计结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStatistics {
    pub total_count: usize,
    pub main_task_count: usize,
    pub subtask_count: usize,
    pub due_today_count: usize,
    pub overdue_count: usize,
}

// 获取任务统计
#[tauri::command]
pub fn get_task_statistics(state: State<Mutex<TaskData>>) -> TaskStatistics {
    let data = state.lock().unwrap();

    // 获取今天的日期
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    // 获取当天的任务
    let today_tasks = data.tasks.get(&today).cloned().unwrap_or_default();

    // 主任务数
    let main_task_count = today_tasks.len();

    // 子任务数
    let subtask_count = today_tasks.iter()
        .filter_map(|task| task.subtasks.as_ref())
        .map(|subtasks| subtasks.len())
        .sum();

    // 总任务数
    let total_count = main_task_count + subtask_count;

    // 今天截止的任务数
    let due_today_count = today_tasks.iter()
        .filter(|task| task.due_date.as_ref().map_or(false, |d| d == &today))
        .count();

    // 已经延期的任务数（当前时间在截止时间后，并且任务未关闭或完成）
    let now = chrono::Local::now().format("%Y-%m-%d").to_string();
    let overdue_count = today_tasks.iter()
        .filter(|task| {
            // 检查是否有截止日期
            if let Some(due_date) = &task.due_date {
                // 检查是否已过期
                if due_date < &now {
                    // 检查任务状态是否不是关闭或完成
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