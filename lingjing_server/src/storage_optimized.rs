use log::{info, debug, warn, error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use chrono::{DateTime, Local, Duration};

/// 任务数据结构
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

/// 任务数据管理
pub struct TaskData {
    pub tasks: HashMap<String, Vec<Task>>,
    /// 脏数据标记：记录哪些日期的数据被修改
    dirty_dates: Vec<String>,
    /// 上次保存时间
    last_save_time: Option<DateTime<Local>>,
}

/// 归档配置
pub struct ArchiveConfig {
    /// 归档阈值（天数）
    pub archive_threshold_days: i64,
    /// 是否启用压缩
    pub enable_compression: bool,
    /// 归档目录
    pub archive_dir: PathBuf,
}

impl Default for ArchiveConfig {
    fn default() -> Self {
        ArchiveConfig {
            archive_threshold_days: 90, // 90天前的数据归档
            enable_compression: true,
            archive_dir: PathBuf::from("data/archive"),
        }
    }
}

impl TaskData {
    /// 创建新的任务数据实例
    pub fn new() -> Self {
        TaskData {
            tasks: HashMap::new(),
            dirty_dates: Vec::new(),
            last_save_time: None,
        }
    }

    /// 加载任务数据
    pub fn load() -> Self {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");

        let mut tasks_dir = exe_dir.to_path_buf();
        tasks_dir.push("data");
        tasks_dir.push("tasks");

        let mut tasks = HashMap::new();

        // 加载活跃数据
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

        // 加载归档数据（按需加载）
        let mut archive_dir = exe_dir.to_path_buf();
        archive_dir.push("data");
        archive_dir.push("archive");
        
        if archive_dir.exists() {
            if let Ok(entries) = fs::read_dir(&archive_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().map_or(false, |ext| ext == "json" || ext == "gz") {
                        if let Some(filename) = path.file_stem() {
                            let date = filename.to_string_lossy().to_string();
                            // 只加载最近30天的归档数据
                            if Self::is_recent_archive(&date, 30) {
                                if let Ok(date_tasks) = Self::load_archived_data(&path) {
                                    info!("加载归档日期 {} 的任务数据，共 {} 个任务", date, date_tasks.len());
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

        TaskData {
            tasks,
            dirty_dates: Vec::new(),
            last_save_time: None,
        }
    }

    /// 增量保存：只保存修改的数据
    pub fn save_incremental(&mut self) {
        if self.dirty_dates.is_empty() {
            debug!("没有脏数据，跳过保存");
            return;
        }

        info!("开始增量保存，共 {} 个日期需要保存", self.dirty_dates.len());

        for date in self.dirty_dates.drain(..) {
            if let Some(tasks) = self.tasks.get(&date) {
                self.save_date(&date, tasks);
            }
        }

        self.last_save_time = Some(Local::now());
        info!("增量保存完成");
    }

    /// 全量保存
    pub fn save(&self) {
        for (date, tasks) in &self.tasks {
            self.save_date(date, tasks);
        }
        info!("任务数据保存成功，共 {} 个日期", self.tasks.len());
    }

    /// 保存指定日期的任务数据
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

    /// 标记数据为脏
    pub fn mark_dirty(&mut self, date: &str) {
        if !self.dirty_dates.contains(&date.to_string()) {
            self.dirty_dates.push(date.to_string());
        }
    }

    /// 归档旧数据
    pub fn archive_old_data(&mut self, config: &ArchiveConfig) {
        let now = Local::now();
        let threshold = now - Duration::days(config.archive_threshold_days);
        
        let dates_to_archive: Vec<String> = self.tasks.keys()
            .filter(|date| {
                if let Ok(task_date) = chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d") {
                    let datetime = chrono::DateTime::from_naive_utc_and_offset(
                        task_date.and_hms_opt(0, 0, 0).unwrap(),
                        *now.offset()
                    );
                    datetime < threshold
                } else {
                    false
                }
            })
            .cloned()
            .collect();

        if dates_to_archive.is_empty() {
            info!("没有需要归档的数据");
            return;
        }

        info!("开始归档 {} 个日期的数据", dates_to_archive.len());

        for date in dates_to_archive {
            if let Some(tasks) = self.tasks.get(&date) {
                if config.enable_compression {
                    self.archive_with_compression(&date, tasks, config);
                } else {
                    self.archive_without_compression(&date, tasks, config);
                }
                
                // 从内存中移除归档数据
                self.tasks.remove(&date);
            }
        }

        info!("归档完成");
    }

    /// 压缩归档
    fn archive_with_compression(&self, date: &str, tasks: &[Task], config: &ArchiveConfig) {
        let mut archive_path = config.archive_dir.clone();
        archive_path.push(format!("{}.json.gz", date));

        if let Some(parent) = archive_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        // 使用 gzip 压缩
        if let Ok(content) = serde_json::to_string(&tasks) {
            use std::io::Write;
            use flate2::write::GzEncoder;
            use flate2::Compression;

            let file = fs::File::create(&archive_path);
            if let Ok(file) = file {
                let mut encoder = GzEncoder::new(file, Compression::default());
                if let Err(e) = encoder.write_all(content.as_bytes()) {
                    error!("压缩归档失败: {}", e);
                } else {
                    info!("压缩归档成功: {:?}", archive_path);
                }
            }
        }
    }

    /// 不压缩归档
    fn archive_without_compression(&self, date: &str, tasks: &[Task], config: &ArchiveConfig) {
        let mut archive_path = config.archive_dir.clone();
        archive_path.push(format!("{}.json", date));

        if let Some(parent) = archive_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        if let Ok(content) = serde_json::to_string_pretty(&tasks) {
            if let Err(e) = fs::write(&archive_path, content) {
                error!("归档失败: {}", e);
            } else {
                info!("归档成功: {:?}", archive_path);
            }
        }
    }

    /// 加载归档数据
    fn load_archived_data(path: &PathBuf) -> Result<Vec<Task>, String> {
        let extension = path.extension().map(|s| s.to_string_lossy().to_string());
        
        match extension.as_deref() {
            Some("gz") => {
                // 解压并加载
                use std::io::Read;
                use flate2::read::GzDecoder;

                let file = fs::File::open(path).map_err(|e| e.to_string())?;
                let mut decoder = GzDecoder::new(file);
                let mut content = String::new();
                decoder.read_to_string(&mut content).map_err(|e| e.to_string())?;
                
                serde_json::from_str(&content).map_err(|e| e.to_string())
            }
            Some("json") => {
                let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
                serde_json::from_str(&content).map_err(|e| e.to_string())
            }
            _ => Err("不支持的文件格式".to_string())
        }
    }

    /// 检查是否是最近的归档
    fn is_recent_archive(date: &str, days: i64) -> bool {
        if let Ok(task_date) = chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d") {
            let now = Local::now();
            let datetime = chrono::DateTime::from_naive_utc_and_offset(
                task_date.and_hms_opt(0, 0, 0).unwrap(),
                *now.offset()
            );
            let threshold = now - Duration::days(days);
            datetime > threshold
        } else {
            false
        }
    }

    /// 获取日期文件路径
    fn get_date_path(date: &str) -> PathBuf {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");

        let mut path = exe_dir.to_path_buf();
        path.push("data");
        path.push("tasks");
        path.push(format!("{}.json", date));
        path
    }

    /// 获取存储统计信息
    pub fn get_storage_stats(&self) -> StorageStats {
        let exe_path = env::current_exe().expect("无法获取可执行文件路径");
        let exe_dir = exe_path.parent().expect("无法获取可执行文件所在目录");

        let mut tasks_dir = exe_dir.to_path_buf();
        tasks_dir.push("data");
        tasks_dir.push("tasks");

        let mut total_size = 0;
        let mut file_count = 0;

        if tasks_dir.exists() {
            if let Ok(entries) = fs::read_dir(&tasks_dir) {
                for entry in entries.flatten() {
                    if let Ok(metadata) = entry.metadata() {
                        total_size += metadata.len();
                        file_count += 1;
                    }
                }
            }
        }

        StorageStats {
            total_size_bytes: total_size,
            file_count,
            active_dates: self.tasks.len(),
            dirty_dates: self.dirty_dates.len(),
        }
    }
}

/// 存储统计信息
#[derive(Debug, Serialize)]
pub struct StorageStats {
    pub total_size_bytes: u64,
    pub file_count: usize,
    pub active_dates: usize,
    pub dirty_dates: usize,
}
