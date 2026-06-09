"use client";

import { useState } from "react";
import { Globe, Maximize2, Minimize2, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveBrowserProps {
  screenshots: string[];
  currentUrl: string;
  isActive: boolean;
}

export function LiveBrowser({ screenshots, currentUrl, isActive }: LiveBrowserProps) {
  const [expanded, setExpanded] = useState(false);
  const latestScreenshot = screenshots[screenshots.length - 1];

  return (
    <div
      className="flex flex-col h-full"
    >
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Live Browser</span>
          {isActive && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse"
            >
              LIVE
            </Badge>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
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
        <div className="flex items-center gap-2 px-3 py-1 border-b border-border bg-muted/30 shrink-0">
          <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] font-mono text-muted-foreground truncate">
            {currentUrl}
          </span>
        </div>
      )}

      {/* Screenshot viewport */}
      <div className="flex-1 overflow-hidden bg-zinc-950 relative">
        {latestScreenshot ? (
          <img
            src={latestScreenshot}
            alt="Browser screenshot"
            className="w-full h-full object-contain object-top"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Monitor className="h-8 w-8 opacity-30" />
            <span className="text-xs">
              {isActive
                ? "Waiting for browser activity..."
                : "Browser preview will appear when agent navigates"}
            </span>
          </div>
        )}

        {/* Screenshot counter */}
        {screenshots.length > 1 && (
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="outline"
              className="text-[10px] bg-black/60 border-zinc-700 text-zinc-300 backdrop-blur-sm"
            >
              {screenshots.length} captures
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
