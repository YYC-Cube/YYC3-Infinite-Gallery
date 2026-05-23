/**
 * @file 工具函数库
 * @description 提供实用的工具函数，包括CSS类名合并和处理
 * @author YYC³
 * @version 1.0.0
 * @created 2025-09-15
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
