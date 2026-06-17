import { addDays, isFriday, startOfDay } from "date-fns";

export type FlashHoliday = { name: string; emoji: string; date: Date };

/** Fixed-date flash occasions worth planning a flash drop around. */
const FIXED: { name: string; emoji: string; month: number; day: number }[] = [
  { name: "Valentine's Day", emoji: "💘", month: 2, day: 14 },
  { name: "St. Patrick's Day", emoji: "🍀", month: 3, day: 17 },
  { name: "Halloween", emoji: "🎃", month: 10, day: 31 },
  { name: "Christmas", emoji: "🎄", month: 12, day: 25 },
  { name: "New Year's", emoji: "✨", month: 1, day: 1 },
];

function nextFixed(
  name: string,
  emoji: string,
  month: number,
  day: number,
  from: Date,
) {
  let year = from.getFullYear();
  let d = new Date(year, month - 1, day);
  if (d < from) {
    year += 1;
    d = new Date(year, month - 1, day);
  }
  return { name, emoji, date: d };
}

function nextFridayThe13th(from: Date): FlashHoliday {
  let cursor = startOfDay(from);
  for (let i = 0; i < 800; i++) {
    if (cursor.getDate() === 13 && isFriday(cursor)) {
      return { name: "Friday the 13th", emoji: "🔮", date: cursor };
    }
    cursor = addDays(cursor, 1);
  }
  return { name: "Friday the 13th", emoji: "🔮", date: addDays(from, 800) };
}

/** Flash occasions in the next `withinDays`, soonest first. */
export function upcomingFlashHolidays(
  from: Date,
  withinDays = 75,
): FlashHoliday[] {
  const horizon = addDays(from, withinDays);
  const all: FlashHoliday[] = [
    ...FIXED.map((f) => nextFixed(f.name, f.emoji, f.month, f.day, from)),
    nextFridayThe13th(from),
  ];
  return all
    .filter((h) => h.date <= horizon)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
