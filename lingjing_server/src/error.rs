use thiserror::Error;
use std::io;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum ErrorCategory {
    NetworkError,
    DataError,
    PermissionError,
    SystemError,
    BusinessError,
    ConfigError,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum ErrorLevel {
    Fatal,
    Critical,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ErrorCode {
    E1001,
    E1002,
    E1003,
    E1004,
    E2001,
    E2002,
    E2003,
    E2004,
    E3001,
    E3002,
    E3003,
    E4001,
    E4002,
    E4003,
    E4004,
    E5001,
    E5002,
    E5003,
    E6001,
    E6002,
    E6003,
}

impl ErrorCode {
    pub fn as_str(&self) -> &'static str {
        match self {
            ErrorCode::E1001 => "E1001",
            ErrorCode::E1002 => "E1002",
            ErrorCode::E1003 => "E1003",
            ErrorCode::E1004 => "E1004",
            ErrorCode::E2001 => "E2001",
            ErrorCode::E2002 => "E2002",
            ErrorCode::E2003 => "E2003",
            ErrorCode::E2004 => "E2004",
            ErrorCode::E3001 => "E3001",
            ErrorCode::E3002 => "E3002",
            ErrorCode::E3003 => "E3003",
            ErrorCode::E4001 => "E4001",
            ErrorCode::E4002 => "E4002",
            ErrorCode::E4003 => "E4003",
            ErrorCode::E4004 => "E4004",
            ErrorCode::E5001 => "E5001",
            ErrorCode::E5002 => "E5002",
            ErrorCode::E5003 => "E5003",
            ErrorCode::E6001 => "E6001",
            ErrorCode::E6002 => "E6002",
            ErrorCode::E6003 => "E6003",
        }
    }
    
    pub fn category(&self) -> ErrorCategory {
        match self {
            ErrorCode::E1001 | ErrorCode::E1002 | ErrorCode::E1003 | ErrorCode::E1004 => {
                ErrorCategory::NetworkError
            }
            ErrorCode::E2001 | ErrorCode::E2002 | ErrorCode::E2003 | ErrorCode::E2004 => {
                ErrorCategory::DataError
            }
            ErrorCode::E3001 | ErrorCode::E3002 | ErrorCode::E3003 => {
                ErrorCategory::PermissionError
            }
            ErrorCode::E4001 | ErrorCode::E4002 | ErrorCode::E4003 | ErrorCode::E4004 => {
                ErrorCategory::SystemError
            }
            ErrorCode::E5001 | ErrorCode::E5002 | ErrorCode::E5003 => {
                ErrorCategory::BusinessError
            }
            ErrorCode::E6001 | ErrorCode::E6002 | ErrorCode::E6003 => {
                ErrorCategory::ConfigError
            }
        }
    }
    
    pub fn message(&self) -> &'static str {
        match self {
            ErrorCode::E1001 => "无法连接到服务器,请检查网络连接",
            ErrorCode::E1002 => "请求超时,请稍后重试",
            ErrorCode::E1003 => "无法解析服务器响应",
            ErrorCode::E1004 => "网络连接已断开",
            ErrorCode::E2001 => "数据格式不符合要求",
            ErrorCode::E2002 => "必需数据字段缺失",
            ErrorCode::E2003 => "数据解析错误",
            ErrorCode::E2004 => "数据已损坏,无法读取",
            ErrorCode::E3001 => "您没有执行此操作的权限",
            ErrorCode::E3002 => "请先登录",
            ErrorCode::E3003 => "无法访问文件,请检查权限",
            ErrorCode::E4001 => "应用运行时发生错误",
            ErrorCode::E4002 => "内存不足,请重启应用",
            ErrorCode::E4003 => "磁盘空间不足",
            ErrorCode::E4004 => "页面渲染失败",
            ErrorCode::E5001 => "任务状态转换不合法",
            ErrorCode::E5002 => "操作冲突,请刷新后重试",
            ErrorCode::E5003 => "该操作已在进行中",
            ErrorCode::E6001 => "配置文件不存在或已损坏",
            ErrorCode::E6002 => "配置项格式错误",
            ErrorCode::E6003 => "无法保存配置",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub url: Option<String>,
    pub route: Option<String>,
    pub user_agent: Option<String>,
    pub app_version: Option<String>,
    pub platform: Option<String>,
    pub component: Option<String>,
    pub operation: Option<String>,
    pub method: Option<String>,
    pub api_endpoint: Option<String>,
    pub custom: Option<serde_json::Value>,
}

impl Default for ErrorContext {
    fn default() -> Self {
        ErrorContext {
            url: None,
            route: None,
            user_agent: None,
            app_version: None,
            platform: None,
            component: None,
            operation: None,
            method: None,
            api_endpoint: None,
            custom: None,
        }
    }
}

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Task error: {0}")]
    Task(#[from] TaskError),
    
    #[error("Config error: {0}")]
    Config(#[from] ConfigError),
    
    #[error("File error: {0}")]
    File(#[from] FileError),
    
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    
    #[error("{0}")]
    Generic(String),
    
    #[error("Network error: {0}")]
    Network(String),
    
    #[error("Recovery error: {0}")]
    Recovery(String),
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error_id: String,
    pub error_code: String,
    pub error_type: ErrorCategory,
    pub error_level: ErrorLevel,
    pub message: String,
    pub stack: Option<String>,
    pub context: ErrorContext,
    pub details: Option<String>,
    pub recovery_hint: Option<String>,
}

impl AppError {
    pub fn category(&self) -> ErrorCategory {
        match self {
            AppError::Task(_) => ErrorCategory::BusinessError,
            AppError::Config(_) => ErrorCategory::ConfigError,
            AppError::File(_) => ErrorCategory::DataError,
            AppError::Io(_) => ErrorCategory::SystemError,
            AppError::Json(_) => ErrorCategory::DataError,
            AppError::Generic(_) => ErrorCategory::SystemError,
            AppError::Network(_) => ErrorCategory::NetworkError,
            AppError::Recovery(_) => ErrorCategory::SystemError,
        }
    }
    
    pub fn level(&self) -> ErrorLevel {
        match self {
            AppError::Task(TaskError::NotFound(_)) => ErrorLevel::Warning,
            AppError::Task(TaskError::InvalidId(_)) => ErrorLevel::Warning,
            AppError::Task(TaskError::InvalidData(_)) => ErrorLevel::Warning,
            AppError::Task(TaskError::AlreadyExists(_)) => ErrorLevel::Warning,
            AppError::Task(TaskError::SubtaskError(_)) => ErrorLevel::Warning,
            AppError::Task(TaskError::OperationFailed(_)) => ErrorLevel::Critical,
            AppError::Config(ConfigError::NotFound(_)) => ErrorLevel::Warning,
            AppError::Config(ConfigError::Invalid(_)) => ErrorLevel::Warning,
            AppError::Config(ConfigError::SaveFailed(_)) => ErrorLevel::Critical,
            AppError::Config(ConfigError::LoadFailed(_)) => ErrorLevel::Critical,
            AppError::Config(ConfigError::StatusError(_)) => ErrorLevel::Warning,
            AppError::Config(ConfigError::TypeError(_)) => ErrorLevel::Warning,
            AppError::Config(ConfigError::PriorityError(_)) => ErrorLevel::Warning,
            AppError::File(FileError::NotFound(_)) => ErrorLevel::Warning,
            AppError::File(FileError::ReadFailed(_)) => ErrorLevel::Critical,
            AppError::File(FileError::WriteFailed(_)) => ErrorLevel::Critical,
            AppError::File(FileError::UnsupportedFormat(_)) => ErrorLevel::Warning,
            AppError::File(FileError::ParseFailed(_)) => ErrorLevel::Warning,
            AppError::File(FileError::InvalidPath(_)) => ErrorLevel::Warning,
            AppError::File(FileError::SizeExceeded(_)) => ErrorLevel::Warning,
            AppError::Io(_) => ErrorLevel::Critical,
            AppError::Json(_) => ErrorLevel::Warning,
            AppError::Generic(_) => ErrorLevel::Warning,
            AppError::Network(_) => ErrorLevel::Critical,
            AppError::Recovery(_) => ErrorLevel::Critical,
        }
    }
    
    pub fn error_code(&self) -> ErrorCode {
        match self {
            AppError::Network(_) => ErrorCode::E1001,
            AppError::Json(_) => ErrorCode::E2003,
            AppError::Task(TaskError::InvalidData(_)) => ErrorCode::E2001,
            AppError::Task(TaskError::NotFound(_)) => ErrorCode::E2002,
            AppError::File(FileError::ParseFailed(_)) => ErrorCode::E2003,
            AppError::File(FileError::ReadFailed(_)) => ErrorCode::E2004,
            AppError::Config(ConfigError::LoadFailed(_)) => ErrorCode::E6001,
            AppError::Config(ConfigError::Invalid(_)) => ErrorCode::E6002,
            AppError::Config(ConfigError::SaveFailed(_)) => ErrorCode::E6003,
            AppError::Task(TaskError::OperationFailed(_)) => ErrorCode::E5001,
            AppError::Task(TaskError::AlreadyExists(_)) => ErrorCode::E5003,
            AppError::Io(_) => ErrorCode::E4001,
            _ => ErrorCode::E4001,
        }
    }
}

impl From<AppError> for ErrorResponse {
    fn from(error: AppError) -> Self {
        use uuid::Uuid;
        
        let error_code = error.error_code();
        let error_id = Uuid::new_v4().to_string();
        
        ErrorResponse {
            error_id,
            error_code: error_code.as_str().to_string(),
            error_type: error.category(),
            error_level: error.level(),
            message: error.to_string(),
            stack: None,
            context: ErrorContext::default(),
            details: None,
            recovery_hint: None,
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
        assert_eq!(response.error_type, ErrorCategory::BusinessError);
        assert_eq!(response.error_level, ErrorLevel::Warning);
    }
    
    #[test]
    fn test_error_code_category() {
        assert_eq!(ErrorCode::E1001.category(), ErrorCategory::NetworkError);
        assert_eq!(ErrorCode::E2001.category(), ErrorCategory::DataError);
        assert_eq!(ErrorCode::E6001.category(), ErrorCategory::ConfigError);
    }
    
    #[test]
    fn test_app_error_classification() {
        let error = AppError::Network("Connection failed".to_string());
        assert_eq!(error.category(), ErrorCategory::NetworkError);
        assert_eq!(error.level(), ErrorLevel::Critical);
    }
}
