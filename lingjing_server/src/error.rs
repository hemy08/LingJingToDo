use thiserror::Error;
use std::io;

/// 应用程序错误类型
#[derive(Error, Debug)]
pub enum AppError {
    /// 任务相关错误
    #[error("Task error: {0}")]
    Task(#[from] TaskError),
    
    /// 配置相关错误
    #[error("Config error: {0}")]
    Config(#[from] ConfigError),
    
    /// 文件操作错误
    #[error("File error: {0}")]
    File(#[from] FileError),
    
    /// IO 错误
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    
    /// JSON 解析错误
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    
    /// 通用错误
    #[error("{0}")]
    Generic(String),
}

/// 任务相关错误
#[derive(Error, Debug)]
pub enum TaskError {
    /// 任务未找到
    #[error("Task not found: {0}")]
    NotFound(String),
    
    /// 任务 ID 无效
    #[error("Invalid task ID: {0}")]
    InvalidId(String),
    
    /// 任务数据无效
    #[error("Invalid task data: {0}")]
    InvalidData(String),
    
    /// 任务已存在
    #[error("Task already exists: {0}")]
    AlreadyExists(String),
    
    /// 子任务错误
    #[error("Subtask error: {0}")]
    SubtaskError(String),
    
    /// 任务操作失败
    #[error("Task operation failed: {0}")]
    OperationFailed(String),
}

/// 配置相关错误
#[derive(Error, Debug)]
pub enum ConfigError {
    /// 配置未找到
    #[error("Config not found: {0}")]
    NotFound(String),
    
    /// 配置无效
    #[error("Invalid config: {0}")]
    Invalid(String),
    
    /// 配置保存失败
    #[error("Failed to save config: {0}")]
    SaveFailed(String),
    
    /// 配置加载失败
    #[error("Failed to load config: {0}")]
    LoadFailed(String),
    
    /// 状态配置错误
    #[error("Status config error: {0}")]
    StatusError(String),
    
    /// 类型配置错误
    #[error("Type config error: {0}")]
    TypeError(String),
    
    /// 优先级配置错误
    #[error("Priority config error: {0}")]
    PriorityError(String),
}

/// 文件操作错误
#[derive(Error, Debug)]
pub enum FileError {
    /// 文件未找到
    #[error("File not found: {0}")]
    NotFound(String),
    
    /// 文件读取失败
    #[error("Failed to read file: {0}")]
    ReadFailed(String),
    
    /// 文件写入失败
    #[error("Failed to write file: {0}")]
    WriteFailed(String),
    
    /// 文件格式不支持
    #[error("Unsupported file format: {0}")]
    UnsupportedFormat(String),
    
    /// 文件解析失败
    #[error("Failed to parse file: {0}")]
    ParseFailed(String),
    
    /// 文件路径无效
    #[error("Invalid file path: {0}")]
    InvalidPath(String),
    
    /// 文件大小超限
    #[error("File size exceeds limit: {0} bytes")]
    SizeExceeded(u64),
}

/// 错误响应结构（用于 Tauri 命令返回）
#[derive(Debug, serde::Serialize)]
pub struct ErrorResponse {
    pub error_type: String,
    pub message: String,
    pub details: Option<String>,
}

impl From<AppError> for ErrorResponse {
    fn from(error: AppError) -> Self {
        match error {
            AppError::Task(e) => ErrorResponse {
                error_type: "TaskError".to_string(),
                message: e.to_string(),
                details: None,
            },
            AppError::Config(e) => ErrorResponse {
                error_type: "ConfigError".to_string(),
                message: e.to_string(),
                details: None,
            },
            AppError::File(e) => ErrorResponse {
                error_type: "FileError".to_string(),
                message: e.to_string(),
                details: None,
            },
            AppError::Io(e) => ErrorResponse {
                error_type: "IoError".to_string(),
                message: e.to_string(),
                details: None,
            },
            AppError::Json(e) => ErrorResponse {
                error_type: "JsonError".to_string(),
                message: e.to_string(),
                details: None,
            },
            AppError::Generic(msg) => ErrorResponse {
                error_type: "GenericError".to_string(),
                message: msg,
                details: None,
            },
        }
    }
}

/// 结果类型别名
pub type AppResult<T> = Result<T, AppError>;

/// 辅助宏：将错误转换为字符串（用于 Tauri 命令）
#[macro_export]
macro_rules! error_to_string {
    ($result:expr) => {
        $result.map_err(|e| e.to_string())
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_error() {
        let error = TaskError::NotFound("task-123".to_string());
        assert_eq!(error.to_string(), "Task not found: task-123");
    }

    #[test]
    fn test_config_error() {
        let error = ConfigError::Invalid("Invalid status".to_string());
        assert_eq!(error.to_string(), "Invalid config: Invalid status");
    }

    #[test]
    fn test_file_error() {
        let error = FileError::UnsupportedFormat("pdf".to_string());
        assert_eq!(error.to_string(), "Unsupported file format: pdf");
    }

    #[test]
    fn test_error_response() {
        let error = AppError::Task(TaskError::NotFound("task-123".to_string()));
        let response = ErrorResponse::from(error);
        assert_eq!(response.error_type, "TaskError");
        assert_eq!(response.message, "Task not found: task-123");
    }
}
