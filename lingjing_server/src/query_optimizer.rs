use crate::query_cache::{QueryCache, generate_cache_key};
use log::debug;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
pub struct Pagination {
    pub page: usize,
    pub page_size: usize,
}

impl Default for Pagination {
    fn default() -> Self {
        Pagination {
            page: 1,
            page_size: 50,
        }
    }
}

impl Pagination {
    pub fn new(page: usize, page_size: usize) -> Self {
        Pagination {
            page: page.max(1),
            page_size: page_size.clamp(10, 100),
        }
    }

    pub fn offset(&self) -> usize {
        (self.page - 1) * self.page_size
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub total_pages: usize,
}

impl<T> PaginatedResult<T> {
    pub fn new(items: Vec<T>, total: usize, page: usize, page_size: usize) -> Self {
        let total_pages = if page_size > 0 {
            (total + page_size - 1) / page_size
        } else {
            0
        };

        PaginatedResult {
            items,
            total,
            page,
            page_size,
            total_pages,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskSummary {
    pub id: String,
    pub title: String,
    pub status_id: String,
    pub type_id: String,
    pub priority_id: String,
    pub due_date: Option<String>,
}

impl From<Task> for TaskSummary {
    fn from(task: Task) -> Self {
        TaskSummary {
            id: task.id,
            title: task.title,
            status_id: task.status_id,
            type_id: task.type_id,
            priority_id: task.priority_id,
            due_date: task.due_date,
        }
    }
}

impl From<&Task> for TaskSummary {
    fn from(task: &Task) -> Self {
        TaskSummary {
            id: task.id.clone(),
            title: task.title.clone(),
            status_id: task.status_id.clone(),
            type_id: task.type_id.clone(),
            priority_id: task.priority_id.clone(),
            due_date: task.due_date.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryFilters {
    pub status_id: Option<String>,
    pub type_id: Option<String>,
    pub priority_id: Option<String>,
    pub include_completed: bool,
}

impl Default for QueryFilters {
    fn default() -> Self {
        QueryFilters {
            status_id: None,
            type_id: None,
            priority_id: None,
            include_completed: false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct QueryOptimizer {
    cache: QueryCache<Vec<TaskSummary>>,
}

impl QueryOptimizer {
    pub fn new() -> Self {
        QueryOptimizer {
            cache: QueryCache::new(50, 300),
        }
    }

    pub fn query_tasks_paginated(
        &mut self,
        tasks: &[Task],
        pagination: Pagination,
        filters: QueryFilters,
    ) -> PaginatedResult<TaskSummary> {
        let cache_key = generate_cache_key("paginated", &[
            &format!("page_{}", pagination.page),
            &format!("size_{}", pagination.page_size),
            filters.status_id.as_deref().unwrap_or("all"),
            filters.type_id.as_deref().unwrap_or("all"),
            filters.priority_id.as_deref().unwrap_or("all"),
            &filters.include_completed.to_string(),
        ]);

        if let Some(cached) = self.cache.get(&cache_key) {
            debug!("使用缓存的分页结果");
            return PaginatedResult::new(
                cached,
                self.calculate_total(tasks, &filters),
                pagination.page,
                pagination.page_size,
            );
        }

        let filtered = self.apply_filters(tasks, &filters);
        let total = filtered.len();
        
        let offset = pagination.offset();
        let end = std::cmp::min(offset + pagination.page_size, total);
        
        let page_items: Vec<TaskSummary> = if offset < total {
            filtered[offset..end].iter().map(|t| t.into()).collect()
        } else {
            Vec::new()
        };

        self.cache.set(cache_key, page_items.clone());

        PaginatedResult::new(page_items, total, pagination.page, pagination.page_size)
    }

    pub fn query_tasks_by_date_range(
        &mut self,
        tasks_by_date: &HashMap<String, Vec<Task>>,
        start_date: &str,
        end_date: &str,
    ) -> Vec<TaskSummary> {
        let cache_key = generate_cache_key("date_range", &[start_date, end_date]);

        if let Some(cached) = self.cache.get(&cache_key) {
            debug!("使用缓存的日期范围结果");
            return cached;
        }

        let mut result = Vec::new();

        for (date, tasks) in tasks_by_date {
            if date.as_str() >= start_date && date.as_str() <= end_date {
                for task in tasks {
                    result.push(task.into());
                }
            }
        }

        result.sort_by(|a: &TaskSummary, b: &TaskSummary| b.priority_id.cmp(&a.priority_id));

        self.cache.set(cache_key, result.clone());
        result
    }

    pub fn get_task_summaries(
        &mut self,
        tasks: &[Task],
        filters: Option<QueryFilters>,
    ) -> Vec<TaskSummary> {
        let filters = filters.unwrap_or_default();
        
        let cache_key = generate_cache_key("summaries", &[
            filters.status_id.as_deref().unwrap_or("all"),
            filters.type_id.as_deref().unwrap_or("all"),
            filters.priority_id.as_deref().unwrap_or("all"),
            &filters.include_completed.to_string(),
        ]);

        if let Some(cached) = self.cache.get(&cache_key) {
            return cached;
        }

        let filtered = self.apply_filters(tasks, &filters);
        let summaries: Vec<TaskSummary> = filtered.iter().map(|t| t.into()).collect();

        self.cache.set(cache_key, summaries.clone());
        summaries
    }

    fn apply_filters(&self, tasks: &[Task], filters: &QueryFilters) -> Vec<Task> {
        tasks.iter()
            .filter(|task| {
                if !filters.include_completed {
                    if task.status_id == "st_done" || task.status_id == "st_closed" {
                        return false;
                    }
                }

                if let Some(ref status_id) = filters.status_id {
                    if task.status_id != *status_id {
                        return false;
                    }
                }

                if let Some(ref type_id) = filters.type_id {
                    if task.type_id != *type_id {
                        return false;
                    }
                }

                if let Some(ref priority_id) = filters.priority_id {
                    if task.priority_id != *priority_id {
                        return false;
                    }
                }

                true
            })
            .cloned()
            .collect()
    }

    fn calculate_total(&self, tasks: &[Task], filters: &QueryFilters) -> usize {
        self.apply_filters(tasks, filters).len()
    }

    pub fn invalidate_cache(&mut self, pattern: &str) {
        self.cache.invalidate_pattern(pattern);
    }

    pub fn clear_cache(&mut self) {
        self.cache.clear();
    }

    pub fn get_cache_stats(&self) -> crate::query_cache::CacheStats {
        self.cache.get_stats()
    }
}

impl Default for QueryOptimizer {
    fn default() -> Self {
        Self::new()
    }
}

pub fn sort_tasks_by_priority(tasks: &mut [Task]) {
    tasks.sort_by(|a, b| {
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
}
