use log::{info, debug};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry<T> {
    pub data: T,
    pub timestamp: u64,
    pub expires_at: u64,
    pub size_bytes: usize,
}

impl<T> CacheEntry<T> {
    pub fn new(data: T, ttl_seconds: u64) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let size_bytes = std::mem::size_of::<T>();
        
        CacheEntry {
            data,
            timestamp: now,
            expires_at: now + ttl_seconds,
            size_bytes,
        }
    }

    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        now > self.expires_at
    }
}

#[derive(Debug, Clone)]
pub struct QueryCache<T> {
    cache: HashMap<String, CacheEntry<T>>,
    max_size_bytes: usize,
    current_size_bytes: usize,
    ttl_seconds: u64,
    hit_count: usize,
    miss_count: usize,
}

impl<T: Clone> QueryCache<T> {
    pub fn new(max_size_mb: usize, ttl_seconds: u64) -> Self {
        QueryCache {
            cache: HashMap::new(),
            max_size_bytes: max_size_mb * 1024 * 1024,
            current_size_bytes: 0,
            ttl_seconds,
            hit_count: 0,
            miss_count: 0,
        }
    }

    pub fn get(&mut self, key: &str) -> Option<T> {
        if let Some(entry) = self.cache.get(key) {
            if !entry.is_expired() {
                self.hit_count += 1;
                debug!("缓存命中: {}", key);
                return Some(entry.data.clone());
            } else {
                debug!("缓存过期: {}", key);
                self.remove(key);
            }
        }
        
        self.miss_count += 1;
        None
    }

    pub fn set(&mut self, key: String, data: T) {
        let entry = CacheEntry::new(data.clone(), self.ttl_seconds);
        let entry_size = entry.size_bytes;
        
        while self.current_size_bytes + entry_size > self.max_size_bytes && !self.cache.is_empty() {
            self.evict_oldest();
        }
        
        if let Some(old_entry) = self.cache.insert(key.clone(), entry) {
            self.current_size_bytes -= old_entry.size_bytes;
        }
        
        self.current_size_bytes += entry_size;
        debug!("缓存设置: {} (大小: {} 字节)", key, entry_size);
    }

    pub fn remove(&mut self, key: &str) {
        if let Some(entry) = self.cache.remove(key) {
            self.current_size_bytes -= entry.size_bytes;
            debug!("缓存移除: {}", key);
        }
    }

    pub fn clear(&mut self) {
        self.cache.clear();
        self.current_size_bytes = 0;
        info!("缓存已清空");
    }

    fn evict_oldest(&mut self) {
        if let Some((oldest_key, _)) = self.cache.iter().min_by_key(|(_, e)| e.timestamp) {
            let key = oldest_key.clone();
            self.remove(&key);
        }
    }

    pub fn invalidate_pattern(&mut self, pattern: &str) {
        let keys_to_remove: Vec<String> = self.cache.keys()
            .filter(|k| k.starts_with(pattern))
            .cloned()
            .collect();
        
        let count = keys_to_remove.len();
        
        for key in keys_to_remove {
            self.remove(&key);
        }
        
        if count > 0 {
            info!("缓存失效: {} 个条目 (模式: {})", count, pattern);
        }
    }

    pub fn get_stats(&self) -> CacheStats {
        let hit_rate = if self.hit_count + self.miss_count > 0 {
            self.hit_count as f64 / (self.hit_count + self.miss_count) as f64
        } else {
            0.0
        };

        CacheStats {
            entry_count: self.cache.len(),
            size_bytes: self.current_size_bytes,
            max_size_bytes: self.max_size_bytes,
            hit_count: self.hit_count,
            miss_count: self.miss_count,
            hit_rate,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CacheStats {
    pub entry_count: usize,
    pub size_bytes: usize,
    pub max_size_bytes: usize,
    pub hit_count: usize,
    pub miss_count: usize,
    pub hit_rate: f64,
}

pub fn generate_cache_key(prefix: &str, parts: &[&str]) -> String {
    format!("{}:{}", prefix, parts.join(":"))
}
