import { NextRequest, NextResponse } from "next/server";
import { sessions, isSessionActive } from "@/lib/sessions";
import type { TradingSession } from "@/lib/sessions";

export const runtime = "edge";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

async function sendTelegram(text: string): Promise<boolean> {
  if (!TOKEN || !CHAT_ID) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

function getDuration(s: TradingSession): number {
  return s.utcEnd > s.utcStart
    ? s.utcEnd - s.utcStart
    : 24 - s.utcStart + s.utcEnd;
}

function findNextSession(closingSession: TradingSession, utcHour: number): TradingSession | null {
  const others = sessions.filter((s) => s.id !== closingSession.id);
  let nearest: TradingSession | null = null;
  let nearestDiff = Infinity;

  for (const s of others) {
    // Already active at close time
    if (isSessionActive(s, utcHour)) return s;

    let diff = s.utcStart - utcHour;
    if (diff <= 0) diff += 24;
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearest = s;
    }
  }
  return nearest;
}

export async function GET(req: NextRequest) {
  // Auth: allow cron secret or no secret configured (for testing)
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Only trigger at the start of each hour (minute 0-1)
  if (utcMinute > 1) {
    return NextResponse.json({ status: "skip", reason: "Not at hour boundary" });
  }

  const sent: string[] = [];

  for (const session of sessions) {
    const active = isSessionActive(session, utcHour);

    // Session just opened (current hour = start hour)
    if (active && utcHour === session.utcStart) {
      const duration = getDuration(session);
      const text =
        `🟢 <b>SESSION OPEN</b>\n\n` +
        `📍 <b>${session.name}</b>\n` +
        `🇬🇪 Georgia: ${session.georgianTime}\n` +
        `🇺🇸 New York: ${session.nyTime}\n` +
        `⏱ ხანგრძლივობა: ${duration}სთ\n\n` +
        `📝 ${session.description}`;

      const ok = await sendTelegram(text);
      if (ok) sent.push(`open:${session.id}`);
    }

    // Session just closed (current hour = end hour)
    if (!active && utcHour === session.utcEnd) {
      const next = findNextSession(session, utcHour);
      let text =
        `🔴 <b>SESSION CLOSED</b>\n\n` +
        `📍 <b>${session.name}</b> დაიხურა\n\n`;

      if (next) {
        text +=
          `⏭ შემდეგი: <b>${next.name}</b>\n` +
          `🇬🇪 Georgia: ${next.georgianTime}\n` +
          `🇺🇸 New York: ${next.nyTime}`;
      } else {
        text += `ყველა სესია დახურულია.`;
      }

      const ok = await sendTelegram(text);
      if (ok) sent.push(`close:${session.id}`);
    }
  }

  return NextResponse.json({
    status: "ok",
    utcHour,
    utcMinute,
    sent,
  });
}
