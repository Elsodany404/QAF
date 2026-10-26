/** The shop works on Egypt time; servers usually run in UTC. */
export const SHOP_TIME_ZONE = "Africa/Cairo";

/** Today's date in Egypt as YYYY-MM-DD. */
export function todayInEgypt(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Day of the week of a YYYY-MM-DD date: 0 is Sunday, 5 is Friday. */
export function weekdayOfISODate(value: string): number | null {
  const date = parseISODate(value);
  if (!date) return null;
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * "Mon, 26 Oct" for a YYYY-MM-DD date, the same on the server and in any
 * browser (Intl's punctuation varies between versions).
 */
export function formatISODate(value: string): string {
  const date = parseISODate(value);
  const weekday = weekdayOfISODate(value);
  if (!date || weekday === null) return value;
  return `${WEEKDAYS[weekday]}, ${date.day} ${MONTHS[date.month - 1]}`;
}

/** Parses a real calendar date in YYYY-MM-DD form; null otherwise. */
export function parseISODate(
  value: string,
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}
