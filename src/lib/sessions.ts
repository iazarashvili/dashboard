/**
 * Trading session (killzone) definitions with Georgian (UTC+4) and NY (EST/UTC-5) times.
 */

export interface TradingSession {
  id: string;
  name: string;
  shortName: string;
  /** UTC hour range [start, end). Wraps around midnight if start > end. */
  utcStart: number;
  utcEnd: number;
  /** Georgian time string (UTC+4) */
  georgianTime: string;
  /** New York time string (UTC-5) */
  nyTime: string;
  /** Short description of what typically happens */
  description: string;
  color: string;
  /** Accent color for active state glow */
  glowColor: string;
}

export const sessions: TradingSession[] = [
  {
    id: "asian",
    name: "Asian Session (Tokyo)",
    shortName: "Asia",
    utcStart: 0,
    utcEnd: 9,
    georgianTime: "04:00 - 13:00",
    nyTime: "19:00 - 04:00",
    description:
      "დაბალი ვოლატილობა, რეინჯი მოძრაობა. ლიკვიდობის აკუმულაცია მომდევნო სესიისთვის. JPY წყვილები ყველაზე აქტიურია.",
    color: "#f472b6",
    glowColor: "rgba(244,114,182,0.4)",
  },
  {
    id: "asian-kz",
    name: "Asian Killzone",
    shortName: "Asia KZ",
    utcStart: 0,
    utcEnd: 4,
    georgianTime: "04:00 - 08:00",
    nyTime: "19:00 - 23:00",
    description:
      "აზიის ყველაზე აქტიური პერიოდი. რეინჯის ფორმირება და ლიკვიდობის შექმნა London-ისთვის. Sweep-ები Asia High/Low-ზე.",
    color: "#f9a8d4",
    glowColor: "rgba(249,168,212,0.3)",
  },
  {
    id: "london",
    name: "London Session",
    shortName: "London",
    utcStart: 7,
    utcEnd: 16,
    georgianTime: "11:00 - 20:00",
    nyTime: "02:00 - 11:00",
    description:
      "ყველაზე მაღალი ვოლატილობა. ტრენდის დაწყება, Asian რეინჯის breakout. ხშირად იჭერს Asia-ს ლიკვიდობას და იწყებს დღის მთავარ მოძრაობას.",
    color: "#60a5fa",
    glowColor: "rgba(96,165,250,0.4)",
  },
  {
    id: "london-kz",
    name: "London Killzone",
    shortName: "London KZ",
    utcStart: 7,
    utcEnd: 10,
    georgianTime: "11:00 - 14:00",
    nyTime: "02:00 - 05:00",
    description:
      "London Open — მთავარი მოძრაობის დასაწყისი. Asia High/Low-ს sweep, FVG-ების შევსება. ტრენდის განსაზღვრა მთელი დღისთვის.",
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.5)",
  },
  {
    id: "nyam",
    name: "New York AM Session",
    shortName: "NY AM",
    utcStart: 12,
    utcEnd: 17,
    georgianTime: "16:00 - 21:00",
    nyTime: "07:00 - 12:00",
    description:
      "London-თან overlap — დღის პიკი. მაღალი ვოლატილობა, ძლიერი მოძრაობები. Silver Bullet (10:00-11:00 NY). ინდექსებზე ძირითადი მოძრაობა აქ ხდება.",
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.4)",
  },
  {
    id: "nyam-kz",
    name: "New York AM Killzone",
    shortName: "NY AM KZ",
    utcStart: 12,
    utcEnd: 15,
    georgianTime: "16:00 - 19:00",
    nyTime: "07:00 - 10:00",
    description:
      "NY Open — London High/Low-ს sweep. ICT Silver Bullet zone. ინდექსები (NAS100, US30) აქ იძლევიან საუკეთესო სეტაპებს.",
    color: "#d97706",
    glowColor: "rgba(217,119,6,0.5)",
  },
  {
    id: "nypm-kz",
    name: "New York PM Killzone",
    shortName: "NY PM KZ",
    utcStart: 19,
    utcEnd: 21,
    georgianTime: "23:00 - 01:00",
    nyTime: "14:00 - 16:00",
    description:
      "დღის ბოლო მოძრაობა. Last Hour of NY — კონსოლიდაცია ან reversal. ხშირად დღის High/Low აქ ფორმირდება.",
    color: "#ef4444",
    glowColor: "rgba(239,68,68,0.4)",
  },
];

/**
 * Check if a session is currently active based on UTC hour.
 */
export function isSessionActive(session: TradingSession, utcHour: number): boolean {
  if (session.utcStart < session.utcEnd) {
    return utcHour >= session.utcStart && utcHour < session.utcEnd;
  }
  // Wraps around midnight
  return utcHour >= session.utcStart || utcHour < session.utcEnd;
}

/**
 * Get minutes until a session starts from the current UTC hour/minute.
 */
export function minutesUntilSession(
  session: TradingSession,
  utcHour: number,
  utcMinute: number
): number {
  const nowMinutes = utcHour * 60 + utcMinute;
  const startMinutes = session.utcStart * 60;

  if (isSessionActive(session, utcHour)) return 0;

  let diff = startMinutes - nowMinutes;
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

/**
 * Format minutes as "Xh Ym".
 */
export function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return "ACTIVE";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
