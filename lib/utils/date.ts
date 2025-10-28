import { addDays, format } from 'date-fns';

/**
 * Get posting dates for the next week based on posts per week
 */
export function getPostingSchedule(
  postsPerWeek: number,
  daysOfWeek: number[] = [1, 3, 5] // Monday, Wednesday, Friday default
): Date[] {
  const today = new Date();
  const schedules: Date[] = [];
  
  // Get dates for the next 7 days
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (daysOfWeek.includes(dayOfWeek)) {
      // Set to 9 AM local time
      date.setHours(9, 0, 0, 0);
      schedules.push(date);
      
      if (schedules.length >= postsPerWeek) break;
    }
  }
  
  return schedules;
}

/**
 * Format date to ISO string in Singapore timezone
 */
export function formatSingaporeDate(date: Date): string {
  // Convert to Singapore time (UTC+8)
  const singaporeDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  return format(singaporeDate, 'yyyy-MM-dd');
}

