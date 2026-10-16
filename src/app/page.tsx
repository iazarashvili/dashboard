"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  sessions,
  isSessionActive,
  minutesUntilSession,
  formatCountdown,
  type TradingSession,
} from "@/lib/sessions";
import { Clock, Bell, BellOff, Globe, MapPin, Zap, Timer } from "lucide-react";

export default function Dashboard() {
  const [now, setNow] = useState(() => new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [telegramStatus, setTelegramStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const sentNotifications = useRef<Set<string>>(new Set());

  // Update clock every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Check telegram config on mount
  useEffect(() => {
    fetch("/api/telegram/notify")
      .then((r) => r.json())
      .then((d) => setTelegramStatus(d.configured ? "ok" : "error"))
      .catch(() => setTelegramStatus("error"));
  }, []);

  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Georgian time (UTC+4)
  const geoTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const geoStr = geoTime.toISOString().slice(11, 19);

  // NY time (UTC-5)
  const nyTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const nyStr = nyTime.toISOString().slice(11, 19);

  // UTC time
  const utcStr = now.toISOString().slice(11, 19);

  // Send telegram notification
  const sendNotification = useCallback(async (session: TradingSession) => {
    try {
      await fetch("/api/telegram/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: session.name,
          georgianTime: session.georgianTime,
          nyTime: session.nyTime,
          description: session.description,
        }),
      });
    } catch {
      // silent fail
    }
  }, []);

  // Check for session opens and send notifications
  useEffect(() => {
    if (!notificationsEnabled) return;

    sessions.forEach((session) => {
      const active = isSessionActive(session, utcHour);
      const key = `${session.id}-${utcHour}`;

      if (active && !sentNotifications.current.has(key)) {
        // Only notify at the exact start hour
        if (utcHour === session.utcStart && utcMinute < 2) {
          sentNotifications.current.add(key);
          sendNotification(session);
        }
      }
    });
  }, [utcHour, utcMinute, notificationsEnabled, sendNotification]);

  const activeSessions = sessions.filter((s) => isSessionActive(s, utcHour));
  const upcomingSessions = sessions
    .filter((s) => !isSessionActive(s, utcHour))
    .sort(
      (a, b) =>
        minutesUntilSession(a, utcHour, utcMinute) -
        minutesUntilSession(b, utcHour, utcMinute)
    );

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0a0f1a" }}>
      {/* Header */}
      <header className="border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-[2px]">
              <span className="text-[#f1f5f9]">TRADING </span>
              <span className="text-[#f59e0b]">SESSIONS </span>
              <span className="text-[#6366f1]">KILLZONES</span>
            </h1>
            <p className="text-[11px] text-[#64748b] tracking-[0.5px] mt-1">
              Forex & Index Session Monitor — Telegram Alerts
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Telegram Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  telegramStatus === "ok"
                    ? "bg-[#10b981] shadow-[0_0_8px_#10b981]"
                    : telegramStatus === "error"
                    ? "bg-[#ef4444]"
                    : "bg-[#374151]"
                }`}
              />
              <span className="text-[11px] text-[#94a3b8] uppercase tracking-[0.5px]">
                TG {telegramStatus === "ok" ? "Connected" : telegramStatus === "error" ? "Not Set" : "..."}
              </span>
            </div>

            {/* Notification Toggle */}
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-[0.5px] transition-colors ${
                notificationsEnabled
                  ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                  : "bg-white/[0.05] text-[#64748b] border border-white/[0.08]"
              }`}
            >
              {notificationsEnabled ? (
                <Bell className="h-3.5 w-3.5" />
              ) : (
                <BellOff className="h-3.5 w-3.5" />
              )}
              Alerts {notificationsEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </header>

      {/* Time Bar */}
      <div className="border-b border-white/[0.08] px-6 py-3 flex items-center gap-8 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[#ef4444]" />
          <span className="text-[11px] text-[#64748b] uppercase tracking-[0.5px]">GEO (UTC+4)</span>
          <span className="text-[15px] font-bold text-[#f1f5f9] font-mono">{geoStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-[#60a5fa]" />
          <span className="text-[11px] text-[#64748b] uppercase tracking-[0.5px]">UTC</span>
          <span className="text-[15px] font-bold text-[#94a3b8] font-mono">{utcStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-[#f59e0b]" />
          <span className="text-[11px] text-[#64748b] uppercase tracking-[0.5px]">NY (UTC-5)</span>
          <span className="text-[15px] font-bold text-[#94a3b8] font-mono">{nyStr}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Zap
            className={`h-3.5 w-3.5 ${
              activeSessions.length > 0 ? "text-[#10b981]" : "text-[#374151]"
            }`}
          />
          <span className="text-[11px] text-[#94a3b8] uppercase tracking-[0.5px]">
            {activeSessions.length} Active Session{activeSessions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-2 h-2 rounded-full bg-[#10b981]"
                style={{ animation: "pulse-dot 1.2s infinite" }}
              />
              <h2 className="text-[13px] font-bold text-[#10b981] uppercase tracking-[1px]">
                Active Now
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeSessions.map((session) => (
                <SessionCard key={session.id} session={session} active utcHour={utcHour} utcMinute={utcMinute} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Timer className="h-3.5 w-3.5 text-[#64748b]" />
              <h2 className="text-[13px] font-bold text-[#64748b] uppercase tracking-[1px]">
                Upcoming
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {upcomingSessions.map((session) => (
                <SessionCard key={session.id} session={session} active={false} utcHour={utcHour} utcMinute={utcMinute} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 15px var(--glow-color); }
          50% { box-shadow: 0 0 30px var(--glow-color), 0 0 60px var(--glow-color); }
        }
      `}</style>
    </div>
  );
}

function SessionCard({
  session,
  active,
  utcHour,
  utcMinute,
}: {
  session: TradingSession;
  active: boolean;
  utcHour: number;
  utcMinute: number;
}) {
  const countdown = minutesUntilSession(session, utcHour, utcMinute);
  const isKillzone = session.id.includes("-kz");

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        active
          ? "border-white/[0.15] bg-white/[0.05]"
          : "border-white/[0.06] bg-white/[0.02] opacity-60 hover:opacity-80"
      }`}
      style={
        active
          ? ({
              "--glow-color": session.glowColor,
              animation: "glow-pulse 3s ease-in-out infinite",
              boxShadow: `0 0 20px ${session.glowColor}`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: session.color,
              boxShadow: active ? `0 0 10px ${session.color}` : "none",
              animation: active ? "pulse-dot 1.2s infinite" : "none",
            }}
          />
          <span
            className="text-[13px] font-bold uppercase tracking-[0.5px]"
            style={{ color: active ? session.color : "#94a3b8" }}
          >
            {session.shortName}
          </span>
          {isKillzone && (
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${session.color}20`,
                color: session.color,
              }}
            >
              Killzone
            </span>
          )}
        </div>
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.5px] px-2 py-0.5 rounded ${
            active
              ? "bg-[#10b981]/20 text-[#10b981]"
              : "bg-white/[0.05] text-[#64748b]"
          }`}
        >
          {active ? "LIVE" : formatCountdown(countdown)}
        </span>
      </div>

      {/* Session Name */}
      <h3 className="text-[14px] font-semibold text-[#f1f5f9] mb-2">
        {session.name}
      </h3>

      {/* Times */}
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#64748b] uppercase">GEO:</span>
          <span className="text-[12px] font-mono font-semibold text-[#f1f5f9]">
            {session.georgianTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#64748b] uppercase">NY:</span>
          <span className="text-[12px] font-mono font-semibold text-[#94a3b8]">
            {session.nyTime}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#94a3b8] leading-relaxed">
        {session.description}
      </p>

      {/* Progress bar for active sessions */}
      {active && <SessionProgress session={session} utcHour={utcHour} utcMinute={utcMinute} />}
    </div>
  );
}

function SessionProgress({
  session,
  utcHour,
  utcMinute,
}: {
  session: TradingSession;
  utcHour: number;
  utcMinute: number;
}) {
  const nowMinutes = utcHour * 60 + utcMinute;
  const startMinutes = session.utcStart * 60;
  let endMinutes = session.utcEnd * 60;

  if (session.utcStart >= session.utcEnd) {
    endMinutes += 24 * 60;
  }

  let current = nowMinutes - startMinutes;
  if (current < 0) current += 24 * 60;

  const total = endMinutes - startMinutes;
  const pct = Math.min(100, Math.max(0, (current / total) * 100));

  const remaining = total - current;
  const remH = Math.floor(remaining / 60);
  const remM = remaining % 60;

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#64748b] uppercase">Progress</span>
        <span className="text-[10px] text-[#64748b]">
          {remH > 0 ? `${remH}h ${remM}m` : `${remM}m`} remaining
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            backgroundColor: session.color,
            boxShadow: `0 0 8px ${session.color}`,
          }}
        />
      </div>
    </div>
  );
}
