use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub status_id: String,
    pub type_id: String,
    pub priority_id: String,
    pub due_date: Option<String>,
    pub subtasks: Option<Vec<Task>>,
}

// 打开文件
#[tauri::command]
pub fn open_file(
    file_path: String,
    file_type: String,
) -> Result<HashMap<String, Vec<Task>>, String> {
    info!("打开文件: {} (类型: {})", file_path, file_type);

    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    match file_type.as_str() {
        "json" => open_json_file(&file_path),
        "excel" => open_excel_file(&file_path),
        "xml" => open_xml_file(&file_path),
        _ => Err("不支持的文件类型".to_string()),
    }
}

// 保存文件
#[tauri::command]
pub fn save_file(
    file_path: String,
    file_type: String,
    data: HashMap<String, Vec<Task>>,
) -> Result<(), String> {
    info!("保存文件: {} (类型: {})", file_path, file_type);

    match file_type.as_str() {
        "json" => save_json_file(&file_path, &data),
        "excel" => save_excel_file(&file_path, &data),
        "xml" => save_xml_file(&file_path, &data),
        _ => Err("不支持的文件类型".to_string()),
    }
}

// JSON 文件操作
fn open_json_file(file_path: &str) -> Result<HashMap<String, Vec<Task>>, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("读取JSON文件失败: {}", e))?;

    let data: HashMap<String, Vec<Task>> = serde_json::from_str(&content)
        .map_err(|e| format!("解析JSON文件失败: {}", e))?;

    Ok(data)
}

fn save_json_file(file_path: &str, data: &HashMap<String, Vec<Task>>) -> Result<(), String> {
    let content = serde_json::to_string_pretty(data)
        .map_err(|e| format!("序列化JSON失败: {}", e))?;

    fs::write(file_path, content)
        .map_err(|e| format!("写入JSON文件失败: {}", e))?;

    Ok(())
}

// Excel 文件操作
fn open_excel_file(_file_path: &str) -> Result<HashMap<String, Vec<Task>>, String> {
    // TODO: 实现 Excel 文件读取
    // 需要添加依赖: calamine 或 umya-spreadsheet
    Err("Excel文件读取功能尚未实现".to_string())
}

fn save_excel_file(_file_path: &str, _data: &HashMap<String, Vec<Task>>) -> Result<(), String> {
    // TODO: 实现 Excel 文件写入
    // 需要添加依赖: rust_xlsxwriter 或 umya-spreadsheet
    Err("Excel文件写入功能尚未实现".to_string())
}

// XML 文件操作
fn open_xml_file(file_path: &str) -> Result<HashMap<String, Vec<Task>>, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("读取XML文件失败: {}", e))?;

    // 简单的XML解析
    let data = parse_xml(&content)?;
    Ok(data)
}

fn save_xml_file(file_path: &str, data: &HashMap<String, Vec<Task>>) -> Result<(), String> {
    let content = generate_xml(data);
    fs::write(file_path, content)
        .map_err(|e| format!("写入XML文件失败: {}", e))?;
    Ok(())
}

// 简单的XML解析
fn parse_xml(_content: &str) -> Result<HashMap<String, Vec<Task>>, String> {
    // TODO: 实现更完善的XML解析
    // 这里提供一个简单的实现框架
    Err("XML文件解析功能尚未完善".to_string())
}

// 生成XML内容
fn generate_xml(data: &HashMap<String, Vec<Task>>) -> String {
    let mut xml = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>
<tasks>
"#);

    for (date, tasks) in data {
        xml.push_str(&format!("  <date value=\"{}\">\n", date));
        for task in tasks {
            xml.push_str(&format!(
                "    <task id=\"{}\" title=\"{}\" status=\"{}\" type=\"{}\" priority=\"{}\">\n",
                task.id, task.title, task.status_id, task.type_id, task.priority_id
            ));
            if let Some(due_date) = &task.due_date {
                xml.push_str(&format!("      <due_date>{}</due_date>\n", due_date));
            }
            if let Some(subtasks) = &task.subtasks {
                xml.push_str("      <subtasks>\n");
                for subtask in subtasks {
                    xml.push_str(&format!(
                        "        <task id=\"{}\" title=\"{}\" status=\"{}\" type=\"{}\" priority=\"{}\"/>\n",
                        subtask.id, subtask.title, subtask.status_id, subtask.type_id, subtask.priority_id
                    ));
                }
                xml.push_str("      </subtasks>\n");
            }
            xml.push_str("    </task>\n");
        }
        xml.push_str("  </date>\n");
    }

    xml.push_str("</tasks>");
    xml
}
