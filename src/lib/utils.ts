import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将 UTC 时间字符串转换为指定时区的格式化时间
 * @param utcString - 数据库中的 UTC 时间字符串（如 "2026-05-06T08:30:00Z"）
 * @param timeZone - 目标时区，默认使用浏览器本地时区（如 "Asia/Shanghai"）
 * @returns 格式化后的本地时间字符串
 */
export function formatUTCToLocal(
  utcString: string | null | undefined,
  timeZone?: string,
): string {
  if (!utcString) return '-'

  const date = new Date(utcString)
  if (isNaN(date.getTime())) return '-'

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }

  return new Intl.DateTimeFormat('zh-CN', options).format(date)
}

/**
 * 将 UTC 时间字符串转换为指定时区的日期
 * @param utcString - 数据库中的 UTC 时间字符串
 * @param timeZone - 目标时区，默认使用浏览器本地时区
 */
export function formatUTCDate(
  utcString: string | null | undefined,
  timeZone?: string,
): string {
  if (!utcString) return '-'

  const date = new Date(utcString)
  if (isNaN(date.getTime())) return '-'

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }

  return new Intl.DateTimeFormat('zh-CN', options).format(date)
}

/**
 * 将 UTC 时间字符串转换为指定时区的时间（仅时分秒）
 * @param utcString - 数据库中的 UTC 时间字符串
 * @param timeZone - 目标时区，默认使用浏览器本地时区
 */
export function formatUTCTime(
  utcString: string | null | undefined,
  timeZone?: string,
): string {
  if (!utcString) return '-'

  const date = new Date(utcString)
  if (isNaN(date.getTime())) return '-'

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }

  return new Intl.DateTimeFormat('zh-CN', options).format(date)
}

/**
 * 获取浏览器本地时区
 * @returns 时区字符串，如 "Asia/Shanghai"
 */
export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
