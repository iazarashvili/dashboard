"use client";

import { useState } from "react";
import { Globe, Maximize2, Minimize2, Monitor } from "lucide-react";

interface LiveBrowserProps {
  screenshots: string[];
  currentUrl: string;
  isActive: boolean;
}

export function LiveBrowser({ screenshots, currentUrl, isActive }: LiveBrowserProps) {
  const [expanded, setExpanded] = useState(false);
  const latestScreenshot = screenshots[screenshots.length - 1];

  return (
    <div className="flex flex-col h-full">
      {/* Browser chrome */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-[#64748b]" />
          <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748b]">Live Browser</span>
          {isActive && (
            <span
              className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(16,185,129,0.2)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                animation: 'glow-pulse 1.5s infinite',
              }}
            >
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#64748b] hover:text-[#94a3b8] transition-colors"
        >
          {expanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* URL bar */}
      {currentUrl && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-b shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
        >
          <Globe className="h-3 w-3 text-[#64748b] shrink-0" />
          <span className="text-[11px] text-[#64748b] truncate">
            {currentUrl}
          </span>
        </div>
      )}

      {/* Screenshot viewport */}
      <div className="flex-1 overflow-hidden relative" style={{ background: '#060a12' }}>
        {latestScreenshot ? (
          <img
            src={latestScreenshot}
            alt="Browser screenshot"
            className="w-full h-full object-contain object-top"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#374151] gap-2">
            <Monitor className="h-8 w-8 opacity-30" />
            <span className="text-[11px]">
              {isActive
                ? "Waiting for browser activity..."
                : "Browser preview will appear when agent navigates"}
            </span>
          </div>
        )}

        {/* Screenshot counter */}
        {screenshots.length > 1 && (
          <div className="absolute bottom-2 right-2">
            <span
              className="text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm"
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
              }}
            >
              {screenshots.length} captures
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
