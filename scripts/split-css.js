#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const cssFile = fs.readFileSync('E:/github.com/hemy08/LingJingToDo/lingjing_uiux/assets/todo.css', 'utf-8');
const lines = cssFile.split('\n');

// 定义拆分规则
const splits = {
  'main.css': {
    start: 0,
    end: 220,
    description: '基础样式、CSS变量、全局样式'
  },
  'themes.css': {
    start: 220,
    end: 350,
    description: '主题相关样式'
  },
  'tasks.css': {
    start: 350,
    end: 800,
    description: '任务相关样式'
  },
  'config.css': {
    start: 800,
    end: 1000,
    description: '配置相关样式'
  },
  'components.css': {
    start: 1000,
    end: 2000,
    description: '组件样式'
  },
  'dialogs.css': {
    start: 2000,
    end: 2700,
    description: '对话框和模态框样式'
  },
  'welcome.css': {
    start: 2700,
    end: 3259,
    description: '欢迎界面和其他样式'
  }
};

console.log('CSS文件拆分计划：');
console.log(`总行数: ${lines.length}\n`);

for (const [filename, range] of Object.entries(splits)) {
  console.log(`${filename}:`);
  console.log(`  行数: ${range.start} - ${range.end} (${range.end - range.start} 行)`);
  console.log(`  说明: ${range.description}\n`);
}
