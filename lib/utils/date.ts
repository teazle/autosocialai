import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'PPP');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'PPp');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isDatePast(date: string | Date): boolean {
  return isPast(new Date(date));
}

export function isDateFuture(date: string | Date): boolean {
  return isFuture(new Date(date));
}

export function getUpcomingDates(baseDate: Date, count: number, daysOfWeek: number[]): Date[] {
  const dates: Date[] = [];
  const current = new Date(baseDate);
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (dates.length < count && iterations < maxIterations) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
    iterations++;
  }

  return dates;
}

export function getNextPostingDate(daysOfWeek: number[], postingTime: string, timezone?: string): Date {
  if (!daysOfWeek || daysOfWeek.length === 0) {
    daysOfWeek = [1, 3, 5]; // Default to Mon, Wed, Fri
  }

  // Get current time in the client's timezone or UTC
  let now: Date;
  if (timezone) {
    // Convert current UTC time to client timezone for accurate day calculation
    const utcNow = new Date();
    const tzOffset = getTimezoneOffset(timezone);
    now = new Date(utcNow.getTime() + (tzOffset * 60 * 1000));
  } else {
    now = new Date();
  }

  const [hours, minutes] = postingTime.split(':').map(Number);
  
  // Find the next available day (checking in local timezone context)
  for (let i = 0; i < 14; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    checkDate.setHours(hours, minutes || 0, 0, 0);
    checkDate.setSeconds(0, 0); // Reset seconds and milliseconds
    
    // Check if this day matches and is in the future
    if (daysOfWeek.includes(checkDate.getDay()) && checkDate > now) {
      // Convert back to UTC for storage (if timezone was specified)
      if (timezone) {
        const tzOffset = getTimezoneOffset(timezone);
        return new Date(checkDate.getTime() - (tzOffset * 60 * 1000));
      }
      return checkDate;
    }
  }
  
  // Fallback: return next day at posting time
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + 1);
  nextDate.setHours(hours, minutes || 0, 0, 0);
  nextDate.setSeconds(0, 0);
  
  if (timezone) {
    const tzOffset = getTimezoneOffset(timezone);
    return new Date(nextDate.getTime() - (tzOffset * 60 * 1000));
  }
  return nextDate;
}

/**
 * Get timezone offset in minutes for a given timezone string
 * This is a simplified helper - for production, consider using a library like date-fns-tz
 */
function getTimezoneOffset(timezone: string): number {
  // Common timezone offsets (in minutes from UTC)
  const offsets: Record<string, number> = {
    'Asia/Singapore': 8 * 60, // UTC+8
    'Asia/Hong_Kong': 8 * 60,
    'Asia/Tokyo': 9 * 60,
    'America/New_York': -5 * 60, // EST (varies with DST)
    'America/Los_Angeles': -8 * 60, // PST (varies with DST)
    'Europe/London': 0, // GMT (varies with DST)
    'Australia/Sydney': 10 * 60, // UTC+10 (varies with DST)
  };
  
  return offsets[timezone] || 0; // Default to UTC if unknown
}