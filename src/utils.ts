function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isSameDate(dateA: string, dateB: string): boolean {
  const a = new Date(dateA);

  return toLocalDateKey(a) === dateB;
}

export function isWithinDateRange(date: string, startDate: string | null, endDate: string | null): boolean {
  const key = toLocalDateKey(new Date(date));

  if (startDate && key < startDate) return false;
  if (endDate && key > endDate) return false;

  return true;
}