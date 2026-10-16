import { NextResponse } from "next/server";


interface FFEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ events: [], error: "Failed to fetch" }, { status: 502 });
    }

    const all: FFEvent[] = await res.json();
    const high = all
      .filter((e) => e.impact === "High")
      .map((e) => ({
        title: e.title,
        country: e.country,
        date: e.date,
        forecast: e.forecast,
        previous: e.previous,
      }));

    return NextResponse.json({ events: high });
  } catch {
    return NextResponse.json({ events: [], error: "Fetch failed" }, { status: 500 });
  }
}
