/**
 * 截止日期校验器
 * 验证截止日期不能早于创建日期
 */

export interface ValidationResult {
  isValid: boolean
  correctedValue?: string
  message?: string
}

/**
 * 校验截止日期
 * @param dueDate 截止日期 (YYYY-MM-DD格式)
 * @param createdDate 创建日期 (YYYY-MM-DD或ISO格式)
 * @returns 校验结果
 */
export function validateDueDate(dueDate: string, createdDate?: string): ValidationResult {
  if (!dueDate) {
    return { isValid: true }
  }

  if (!createdDate) {
    return { isValid: true }
  }

  const dueDateObj = new Date(dueDate)
  let createdDateObj: Date

  if (createdDate.includes('T')) {
    createdDateObj = new Date(createdDate)
  } else {
    createdDateObj = new Date(createdDate + 'T00:00:00')
  }

  if (isNaN(dueDateObj.getTime()) || isNaN(createdDateObj.getTime())) {
    return {
      isValid: false,
      correctedValue: formatDate(new Date()),
      message: '日期格式无效，已自动修正为当前日期'
    }
  }

  dueDateObj.setHours(0, 0, 0, 0)
  createdDateObj.setHours(0, 0, 0, 0)

  if (dueDateObj < createdDateObj) {
    const currentDate = formatDate(new Date())
    return {
      isValid: false,
      correctedValue: currentDate,
      message: `截止日期(${dueDate})不能早于创建日期(${formatDate(createdDateObj)})，已自动修正为当前日期(${currentDate})`
    }
  }

  const maxDate = new Date(createdDateObj)
  maxDate.setFullYear(maxDate.getFullYear() + 10)
  
  if (dueDateObj > maxDate) {
    const correctedDate = formatDate(maxDate)
    return {
      isValid: false,
      correctedValue: correctedDate,
      message: `截止日期超出合理范围(创建日期+10年)，已自动修正为${correctedDate}`
    }
  }

  return { isValid: true }
}

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param date 日期对象
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 自动修正截止日期
 * @param dueDate 截止日期
 * @param createdDate 创建日期
 * @returns 修正后的截止日期
 */
export function autoCorrectDueDate(dueDate: string, createdDate: string): string {
  const result = validateDueDate(dueDate, createdDate)
  return result.correctedValue || dueDate
}

/**
 * 批量校验任务截止日期
 * @param tasks 任务列表
 * @returns 校验结果列表
 */
export function batchValidateDueDates(tasks: Array<{ id: string; due_date?: string; created_date: string }>): Array<{ id: string; result: ValidationResult }> {
  return tasks.map(task => ({
    id: task.id,
    result: validateDueDate(task.due_date || '', task.created_date)
  }))
}
