/**
 * 获取当前北京时间的日期对象
 * @returns 北京时间的Date对象
 */
export function getCurrentBeijingDateObject(): Date {
  const now = new Date();
  // 转换为北京时间 (UTC+8)
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime;
}
/**
 * 将日期字符串转换为北京时间的Date对象
 * @param dateString 日期字符串 (YYYY-MM-DD)
 * @param hour 小时 (默认6)
 * @returns 北京时间的Date对象
 */
export function createBeijingDate(dateString: string, hour: number = 6): Date {
  const beijingDate = new Date(
    dateString + `T${hour.toString().padStart(2, "0")}:00:00`
  );
  return beijingDate;
}
export function addDaysToBeijingDate(beijingDate: Date, days: number): Date {
  const newDate = new Date(beijingDate.getTime() + days * 24 * 60 * 60 * 1000);
  return newDate;
}

export function toBeijingDateTime(dateString: string, hour: number = 6): Date {
  // 创建北京时间的日期对象
  return new Date(
    dateString + `T${hour.toString().padStart(2, "0")}:00:00+08:00`
  );
}
export function formatDateForAPI(date: Date): string {
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
