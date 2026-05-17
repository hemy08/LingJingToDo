use log::{info, error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

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

// 打开文件
#[tauri::command]
pub fn open_file(file_path: String, file_type: String) -> Result<HashMap<String, Vec<Task>>, String> {
    info!("========== 打开文件 ==========");
    info!("文件路径: {}", file_path);
    info!("文件类型: {}", file_type);

    let result = match file_type.as_str() {
        "json" => {
            info!("使用JSON格式读取");
            open_json_file(&file_path)
        },
        "xml" => {
            info!("使用XML格式读取");
            open_xml_file(&file_path)
        },
        "excel" => {
            info!("使用Excel格式读取");
            open_excel_file(&file_path)
        },
        _ => {
            error!("不支持的文件类型: {}", file_type);
            Err(format!("不支持的文件类型: {}", file_type))
        },
    };

    match &result {
        Ok(data) => {
            info!("✓ 文件打开成功");
            info!("  日期数: {}", data.len());
            for (date, tasks) in data {
                info!("  日期 {}: {} 个任务", date, tasks.len());
            }
        },
        Err(e) => {
            error!("✗ 文件打开失败: {}", e);
        }
    }

    result
}

// 保存文件
#[tauri::command]
pub fn save_file(file_path: String, file_type: String, data: HashMap<String, Vec<Task>>) -> Result<(), String> {
    info!("========== 保存文件 ==========");
    info!("文件路径: {}", file_path);
    info!("文件类型: {}", file_type);
    info!("数据统计:");
    info!("  日期数: {}", data.len());
    for (date, tasks) in &data {
        info!("  日期 {}: {} 个任务", date, tasks.len());
    }

    let result = match file_type.as_str() {
        "json" => {
            info!("使用JSON格式保存");
            save_json_file(&file_path, &data)
        },
        "xml" => {
            info!("使用XML格式保存");
            save_xml_file(&file_path, &data)
        },
        "excel" => {
            info!("使用Excel格式保存");
            save_excel_file(&file_path, &data)
        },
        _ => {
            error!("不支持的文件类型: {}", file_type);
            Err(format!("不支持的文件类型: {}", file_type))
        },
    };

    match &result {
        Ok(_) => info!("✓ 文件保存成功: {}", file_path),
        Err(e) => error!("✗ 文件保存失败: {}", e),
    }

    result
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
fn open_excel_file(file_path: &str) -> Result<HashMap<String, Vec<Task>>, String> {
    use calamine::{Reader, Xlsx, open_workbook};

    // 打开 Excel 文件
    let mut workbook: Xlsx<_> = open_workbook(file_path)
        .map_err(|e| format!("打开Excel文件失败: {}", e))?;

    let mut data: HashMap<String, Vec<Task>> = HashMap::new();

    // 获取所有工作表名称
    let sheet_names = workbook.sheet_names();

    for sheet_name in sheet_names {
        // 读取工作表
        let range = workbook.worksheet_range(&sheet_name)
            .map_err(|e| format!("读取工作表 {} 失败: {}", sheet_name, e))?;

        // 使用 HashMap 存储所有任务（包括主任务和子任务）
        let mut all_tasks: HashMap<String, Task> = HashMap::new();
        // 使用 HashMap 存储子任务关系：子任务ID -> 主任务ID
        let mut subtask_relations: HashMap<String, String> = HashMap::new();

        // 遍历行（跳过标题行）
        for (row_idx, row) in range.rows().enumerate() {
            if row_idx == 0 {
                continue; // 跳过标题行
            }

            // 确保行有足够的列
            if row.len() < 6 {
                continue;
            }

            // 读取任务数据
            // 列顺序：任务ID、主任务ID、任务描述、任务类型、任务状态、任务优先级、创建日期、截止日期、备注
            let task_id = row[0].to_string();
            let parent_task_id = row[1].to_string();
            let title = row[2].to_string();
            let type_id = row[3].to_string();
            let status_id = row[4].to_string();
            let priority_id = row[5].to_string();

            // 读取可选字段
            let created_date = if row.len() > 6 {
                match &row[6] {
                    calamine::Data::Empty => None,
                    data => Some(data.to_string()),
                }
            } else {
                None
            };

            let due_date = if row.len() > 7 {
                match &row[7] {
                    calamine::Data::Empty => None,
                    data => Some(data.to_string()),
                }
            } else {
                None
            };

            let closed_date = if row.len() > 8 {
                match &row[8] {
                    calamine::Data::Empty => None,
                    data => Some(data.to_string()),
                }
            } else {
                None
            };

            let remark = if row.len() > 9 {
                match &row[9] {
                    calamine::Data::Empty => None,
                    data => Some(data.to_string()),
                }
            } else {
                None
            };

            let task = Task {
                id: task_id.clone(),
                title,
                status_id,
                type_id,
                priority_id,
                due_date,
                subtasks: None,
                remark,
                created_date,
                closed_date,
            };

            // 存储任务
            all_tasks.insert(task_id.clone(), task);

            // 如果有主任务ID，记录子任务关系
            if !parent_task_id.is_empty() {
                subtask_relations.insert(task_id, parent_task_id);
            }
        }

        // 构建任务树结构
        let mut main_tasks: Vec<Task> = Vec::new();

        // 首先处理所有子任务关系
        for (subtask_id, parent_id) in &subtask_relations {
            if let (Some(subtask), Some(parent_task)) =
                (all_tasks.remove(subtask_id), all_tasks.get_mut(parent_id)) {
                // 将子任务添加到主任务
                if parent_task.subtasks.is_none() {
                    parent_task.subtasks = Some(Vec::new());
                }
                if let Some(ref mut subtasks) = parent_task.subtasks {
                    subtasks.push(subtask);
                }
            }
        }

        // 剩余的任务都是主任务
        for (_, task) in all_tasks {
            main_tasks.push(task);
        }

        // 使用工作表名称作为日期
        data.insert(sheet_name, main_tasks);
    }

    if data.is_empty() {
        return Err("Excel文件中没有找到任务数据".to_string());
    }

    Ok(data)
}

fn save_excel_file(file_path: &str, data: &HashMap<String, Vec<Task>>) -> Result<(), String> {
    use rust_xlsxwriter::*;

    // 创建新的工作簿
    let mut workbook = Workbook::new();

    // 为每个日期创建一个工作表
    for (date, tasks) in data {
        // 创建工作表，使用日期作为工作表名称
        let worksheet = workbook
            .add_worksheet()
            .set_name(date)
            .map_err(|e| format!("创建工作表失败: {}", e))?;

        // 设置列标题
        // 新格式：任务ID、主任务ID、任务描述、任务类型、任务状态、任务优先级、创建日期、截止日期、关闭日期、备注
        let headers = ["任务ID", "主任务ID", "任务描述", "任务类型", "任务状态", "任务优先级", "创建日期", "截止日期", "关闭日期", "备注"];
        for (col, header) in headers.iter().enumerate() {
            worksheet
                .write_string(0, col as u16, *header)
                .map_err(|e| format!("写入标题失败: {}", e))?;
        }

        // 写入任务数据（平铺格式）
        let mut current_row = 1u32;

        for task in tasks.iter() {
            // 写入主任务
            // 任务ID
            worksheet
                .write_string(current_row, 0, &task.id)
                .map_err(|e| format!("写入任务ID失败: {}", e))?;

            // 主任务ID（主任务为空）
            worksheet
                .write_string(current_row, 1, "")
                .map_err(|e| format!("写入主任务ID失败: {}", e))?;

            // 任务描述
            worksheet
                .write_string(current_row, 2, &task.title)
                .map_err(|e| format!("写入任务描述失败: {}", e))?;

            // 任务类型
            worksheet
                .write_string(current_row, 3, &task.type_id)
                .map_err(|e| format!("写入任务类型失败: {}", e))?;

            // 任务状态
            worksheet
                .write_string(current_row, 4, &task.status_id)
                .map_err(|e| format!("写入任务状态失败: {}", e))?;

            // 任务优先级
            worksheet
                .write_string(current_row, 5, &task.priority_id)
                .map_err(|e| format!("写入任务优先级失败: {}", e))?;

            // 创建日期
            if let Some(created_date) = &task.created_date {
                worksheet
                    .write_string(current_row, 6, created_date)
                    .map_err(|e| format!("写入创建日期失败: {}", e))?;
            }

            // 截止日期
            if let Some(due_date) = &task.due_date {
                worksheet
                    .write_string(current_row, 7, due_date)
                    .map_err(|e| format!("写入截止日期失败: {}", e))?;
            }

            // 关闭日期
            if let Some(closed_date) = &task.closed_date {
                worksheet
                    .write_string(current_row, 8, closed_date)
                    .map_err(|e| format!("写入关闭日期失败: {}", e))?;
            }

            // 备注
            if let Some(remark) = &task.remark {
                worksheet
                    .write_string(current_row, 9, remark)
                    .map_err(|e| format!("写入备注失败: {}", e))?;
            }

            current_row += 1;

            // 写入子任务
            if let Some(subtasks) = &task.subtasks {
                for subtask in subtasks.iter() {
                    // 任务ID（子任务ID）
                    worksheet
                        .write_string(current_row, 0, &subtask.id)
                        .map_err(|e| format!("写入子任务ID失败: {}", e))?;

                    // 主任务ID
                    worksheet
                        .write_string(current_row, 1, &task.id)
                        .map_err(|e| format!("写入主任务ID失败: {}", e))?;

                    // 任务描述
                    worksheet
                        .write_string(current_row, 2, &subtask.title)
                        .map_err(|e| format!("写入子任务描述失败: {}", e))?;

                    // 任务类型
                    worksheet
                        .write_string(current_row, 3, &subtask.type_id)
                        .map_err(|e| format!("写入子任务类型失败: {}", e))?;

                    // 任务状态
                    worksheet
                        .write_string(current_row, 4, &subtask.status_id)
                        .map_err(|e| format!("写入子任务状态失败: {}", e))?;

                    // 任务优先级
                    worksheet
                        .write_string(current_row, 5, &subtask.priority_id)
                        .map_err(|e| format!("写入子任务优先级失败: {}", e))?;

                    // 创建日期
                    if let Some(created_date) = &subtask.created_date {
                        worksheet
                            .write_string(current_row, 6, created_date)
                            .map_err(|e| format!("写入子任务创建日期失败: {}", e))?;
                    }

                    // 截止日期
                    if let Some(due_date) = &subtask.due_date {
                        worksheet
                            .write_string(current_row, 7, due_date)
                            .map_err(|e| format!("写入子任务截止日期失败: {}", e))?;
                    }

                    // 关闭日期
                    if let Some(closed_date) = &subtask.closed_date {
                        worksheet
                            .write_string(current_row, 8, closed_date)
                            .map_err(|e| format!("写入子任务关闭日期失败: {}", e))?;
                    }

                    // 备注
                    if let Some(remark) = &subtask.remark {
                        worksheet
                            .write_string(current_row, 9, remark)
                            .map_err(|e| format!("写入子任务备注失败: {}", e))?;
                    }

                    current_row += 1;
                }
            }
        }

        // 自动调整列宽
        worksheet.set_column_width(0, 15).map_err(|e| format!("设置列宽失败: {}", e))?;  // 任务ID
        worksheet.set_column_width(1, 15).map_err(|e| format!("设置列宽失败: {}", e))?;  // 主任务ID
        worksheet.set_column_width(2, 40).map_err(|e| format!("设置列宽失败: {}", e))?;  // 任务描述
        worksheet.set_column_width(3, 15).map_err(|e| format!("设置列宽失败: {}", e))?;  // 任务类型
        worksheet.set_column_width(4, 15).map_err(|e| format!("设置列宽失败: {}", e))?;  // 任务状态
        worksheet.set_column_width(5, 12).map_err(|e| format!("设置列宽失败: {}", e))?;  // 任务优先级
        worksheet.set_column_width(6, 20).map_err(|e| format!("设置列宽失败: {}", e))?;  // 创建日期
        worksheet.set_column_width(7, 15).map_err(|e| format!("设置列宽失败: {}", e))?;  // 截止日期
        worksheet.set_column_width(8, 20).map_err(|e| format!("设置列宽失败: {}", e))?;  // 关闭日期
        worksheet.set_column_width(9, 30).map_err(|e| format!("设置列宽失败: {}", e))?;  // 备注
    }

    // 保存工作簿
    workbook
        .save(file_path)
        .map_err(|e| format!("保存Excel文件失败: {}", e))?;

    Ok(())
}

fn save_xml_file(file_path: &str, data: &HashMap<String, Vec<Task>>) -> Result<(), String> {
    let content = generate_xml(data);
    fs::write(file_path, content)
        .map_err(|e| format!("写入XML文件失败: {}", e))?;
    Ok(())
}

// XML 文件操作
fn open_xml_file(file_path: &str) -> Result<HashMap<String, Vec<Task>>, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("读取XML文件失败: {}", e))?;

    // 简单的XML解析
    let data = parse_xml(&content)?;
    Ok(data)
}

// 简单的XML解析
fn parse_xml(content: &str) -> Result<HashMap<String, Vec<Task>>, String> {
    let mut data: HashMap<String, Vec<Task>> = HashMap::new();

    // 简单的XML解析（不使用外部库）
    // 查找所有 <date> 标签
    let date_pattern = r#"<date value="([^"]+)">"#;
    let date_regex = regex::Regex::new(date_pattern)
        .map_err(|e| format!("创建正则表达式失败: {}", e))?;

    // 分割内容为日期块
    let mut date_blocks: Vec<(String, String)> = Vec::new();

    for date_captures in date_regex.captures_iter(content) {
        let date_value = date_captures[1].to_string();

        // 找到对应的 </date> 标签
        let date_match = date_captures.get(0).unwrap();
        let start_pos = date_match.end();
        if let Some(end_match) = content[start_pos..].find("</date>") {
            let end_pos = start_pos + end_match;
            let date_content = content[start_pos..end_pos].to_string();
            date_blocks.push((date_value, date_content));
        }
    }

    // 解析每个日期块中的任务
    for (date, date_content) in date_blocks {
        let tasks = parse_tasks_from_xml(&date_content)?;
        data.insert(date, tasks);
    }

    if data.is_empty() {
        return Err("XML文件格式不正确或没有找到任务数据".to_string());
    }

    Ok(data)
}

// 从XML内容中解析任务列表
fn parse_tasks_from_xml(content: &str) -> Result<Vec<Task>, String> {
    let mut tasks: Vec<Task> = Vec::new();

    // 查找所有 <task> 标签（主任务）
    let task_pattern = r#"<task id="([^"]+)" title="([^"]*)" status="([^"]+)" type="([^"]+)" priority="([^"]+)">"#;
    let task_regex = regex::Regex::new(task_pattern)
        .map_err(|e| format!("创建任务正则表达式失败: {}", e))?;

    let mut current_pos = 0;
    while current_pos < content.len() {
        if let Some(task_captures) = task_regex.captures_at(content, current_pos) {
            let id = task_captures[1].to_string();
            let title = unescape_xml(&task_captures[2]); // 反转义标题
            let status_id = task_captures[3].to_string();
            let type_id = task_captures[4].to_string();
            let priority_id = task_captures[5].to_string();

            // 找到对应的 </task> 标签
            let task_match = task_captures.get(0).unwrap();
            let start_pos = task_match.end();
            if let Some(end_match) = content[start_pos..].find("</task>") {
                let end_pos = start_pos + end_match;
                let task_content = &content[start_pos..end_pos];

                // 解析任务的其他字段
                let due_date = extract_xml_value(task_content, "due_date");
                let remark = extract_xml_value(task_content, "remark");
                let created_date = extract_xml_value(task_content, "created_date");
                let closed_date = extract_xml_value(task_content, "closed_date");

                // 解析子任务
                let subtasks = parse_subtasks_from_xml(task_content)?;

                let task = Task {
                    id,
                    title,
                    status_id,
                    type_id,
                    priority_id,
                    due_date,
                    subtasks: if subtasks.is_empty() { None } else { Some(subtasks) },
                    remark,
                    created_date,
                    closed_date,
                };

                tasks.push(task);
                current_pos = end_pos + 7; // 7 是 </task> 的长度
            } else {
                break;
            }
        } else {
            break;
        }
    }

    Ok(tasks)
}

// 从XML内容中解析子任务列表
fn parse_subtasks_from_xml(content: &str) -> Result<Vec<Task>, String> {
    let mut subtasks: Vec<Task> = Vec::new();

    // 查找 <subtasks> 标签
    if let Some(subtasks_start) = content.find("<subtasks>") {
        if let Some(subtasks_end) = content.find("</subtasks>") {
            let subtasks_content = &content[subtasks_start + 10..subtasks_end];

            // 查找所有子任务（自闭合标签）
            let subtask_pattern = r#"<task id="([^"]+)" title="([^"]*)" status="([^"]+)" type="([^"]+)" priority="([^"]+)"/>"#;
            let subtask_regex = regex::Regex::new(subtask_pattern)
                .map_err(|e| format!("创建子任务正则表达式失败: {}", e))?;

            for subtask_captures in subtask_regex.captures_iter(subtasks_content) {
                let subtask = Task {
                    id: subtask_captures[1].to_string(),
                    title: unescape_xml(&subtask_captures[2]), // 反转义标题
                    status_id: subtask_captures[3].to_string(),
                    type_id: subtask_captures[4].to_string(),
                    priority_id: subtask_captures[5].to_string(),
                    due_date: None,
                    subtasks: None,
                    remark: None,
                    created_date: None,
                    closed_date: None,
                };
                subtasks.push(subtask);
            }
        }
    }

    Ok(subtasks)
}

// 从XML内容中提取指定标签的值
fn extract_xml_value(content: &str, tag: &str) -> Option<String> {
    let open_tag = format!("<{}>", tag);
    let close_tag = format!("</{}>", tag);

    if let Some(start) = content.find(&open_tag) {
        let value_start = start + open_tag.len();
        if let Some(end) = content[value_start..].find(&close_tag) {
            let value = &content[value_start..value_start + end];
            // 反转义XML实体
            return Some(unescape_xml(value));
        }
    }
    None
}

// 反转义XML实体
fn unescape_xml(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
}

// 生成XML内容
fn generate_xml(data: &HashMap<String, Vec<Task>>) -> String {
    let mut xml = String::from(r#"<?xml version="1.0" encoding="UTF-8"?>
<tasks>
"#);

    for (date, tasks) in data {
        xml.push_str(&format!("  <date value=\"{}\">\n", date));
        for task in tasks {
            // 转义XML特殊字符
            let title = escape_xml(&task.title);
            xml.push_str(&format!(
                "    <task id=\"{}\" title=\"{}\" status=\"{}\" type=\"{}\" priority=\"{}\">\n",
                task.id, title, task.status_id, task.type_id, task.priority_id
            ));
            if let Some(due_date) = &task.due_date {
                xml.push_str(&format!("      <due_date>{}</due_date>\n", due_date));
            }
            if let Some(remark) = &task.remark {
                let escaped_remark = escape_xml(remark);
                xml.push_str(&format!("      <remark>{}</remark>\n", escaped_remark));
            }
            if let Some(created_date) = &task.created_date {
                xml.push_str(&format!("      <created_date>{}</created_date>\n", created_date));
            }
            if let Some(closed_date) = &task.closed_date {
                xml.push_str(&format!("      <closed_date>{}</closed_date>\n", closed_date));
            }
            if let Some(subtasks) = &task.subtasks {
                xml.push_str("      <subtasks>\n");
                for subtask in subtasks {
                    let subtask_title = escape_xml(&subtask.title);
                    xml.push_str(&format!(
                        "        <task id=\"{}\" title=\"{}\" status=\"{}\" type=\"{}\" priority=\"{}\"/>\n",
                        subtask.id, subtask_title, subtask.status_id, subtask.type_id, subtask.priority_id
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

// 转义XML特殊字符
fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

// 历史文件操作
use crate::config::ConfigState;

#[tauri::command]
pub fn get_recent_files(state: tauri::State<ConfigState>) -> Vec<String> {
    let config = state.config.lock().unwrap();
    config.recent_files.clone()
}

#[tauri::command]
pub fn add_recent_file(state: tauri::State<ConfigState>, file_path: String) -> Vec<String> {
    let mut config = state.config.lock().unwrap();
    config.recent_files.retain(|f| f != &file_path);
    config.recent_files.insert(0, file_path);
    if config.recent_files.len() > 10 {
        config.recent_files.truncate(10);
    }
    let result = config.recent_files.clone();
    drop(config);
    state.save();
    result
}
