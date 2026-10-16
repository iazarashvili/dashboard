import { NextRequest, NextResponse } from "next/server";


const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const API = `https://api.telegram.org/bot${TOKEN}`;

async function sendTelegram(text: string): Promise<boolean> {
  if (!TOKEN || !CHAT_ID) return false;
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      sessionName, georgianTime, nyTime, description,
      type = "open",
      durationHours = 0,
      nextSessionName = "",
      nextSessionGeoTime = "",
      nextSessionNyTime = "",
    } = await req.json();

    let text: string;

    if (type === "open") {
      text =
        `🟢 <b>SESSION OPEN</b>\n\n` +
        `📍 <b>${sessionName}</b>\n` +
        `🇬🇪 Georgia: ${georgianTime}\n` +
        `🇺🇸 New York: ${nyTime}\n` +
        `⏱ ხანგრძლივობა: ${durationHours}სთ\n\n` +
        `📝 ${description}`;
    } else {
      text =
        `🔴 <b>SESSION CLOSED</b>\n\n` +
        `📍 <b>${sessionName}</b> დაიხურა\n\n`;

      if (nextSessionName) {
        text +=
          `⏭ შემდეგი: <b>${nextSessionName}</b>\n` +
          `🇬🇪 Georgia: ${nextSessionGeoTime}\n` +
          `🇺🇸 New York: ${nextSessionNyTime}`;
      } else {
        text += `ყველა სესია დახურულია.`;
      }
    }

    const ok = await sendTelegram(text);

    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 });
  }
}

export async function GET() {
  // Test endpoint
  const configured = !!(TOKEN && CHAT_ID);
  return NextResponse.json({ configured, token: TOKEN ? "set" : "missing", chatId: CHAT_ID ? "set" : "missing" });
}
