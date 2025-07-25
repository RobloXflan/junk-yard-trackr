import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  
  // Extract date part from ISO string or date string
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'N/A';
  
  // Return just the date part in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}
