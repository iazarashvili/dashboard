"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  FileText,
  Pencil,
  Search,
  Globe,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react";

export interface ThinkingStep {
  timestamp: string;
  action: "read" | "write" | "edit" | "search" | "navigate" | "command" | "decide" | "error" | "done";
  target: string;
  detail?: string;
}

interface ThinkingPanelProps {
  steps: ThinkingStep[];
  isActive: boolean;
}

const actionConfig: Record<
  ThinkingStep["action"],
  { icon: React.ReactNode; bg: string; ring: string; text: string; label: string; glow: string }
> = {
  read: {
    icon: <FileText className="h-3.5 w-3.5" />,
    bg: "bg-blue-500",
    ring: "ring-blue-500/30",
    text: "text-blue-400",
    label: "READ",
    glow: "shadow-blue-500/20",
  },
  write: {
    icon: <Pencil className="h-3.5 w-3.5" />,
    bg: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
    label: "CREATE",
    glow: "shadow-emerald-500/20",
  },
  edit: {
    icon: <Pencil className="h-3.5 w-3.5" />,
    bg: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-amber-400",
    label: "EDIT",
    glow: "shadow-amber-500/20",
  },
  search: {
    icon: <Search className="h-3.5 w-3.5" />,
    bg: "bg-purple-500",
    ring: "ring-purple-500/30",
    text: "text-purple-400",
    label: "SEARCH",
    glow: "shadow-purple-500/20",
  },
  navigate: {
    icon: <Globe className="h-3.5 w-3.5" />,
    bg: "bg-cyan-500",
    ring: "ring-cyan-500/30",
    text: "text-cyan-400",
    label: "NAVIGATE",
    glow: "shadow-cyan-500/20",
  },
  command: {
    icon: <Terminal className="h-3.5 w-3.5" />,
    bg: "bg-zinc-500",
    ring: "ring-zinc-500/30",
    text: "text-zinc-400",
    label: "RUN",
    glow: "shadow-zinc-500/20",
  },
  decide: {
    icon: <Brain className="h-3.5 w-3.5" />,
    bg: "bg-pink-500",
    ring: "ring-pink-500/30",
    text: "text-pink-400",
    label: "THINK",
    glow: "shadow-pink-500/20",
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    bg: "bg-red-500",
    ring: "ring-red-500/30",
    text: "text-red-400",
    label: "ERROR",
    glow: "shadow-red-500/20",
  },
  done: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    bg: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
    label: "DONE",
    glow: "shadow-emerald-500/20",
  },
};

export function ThinkingPanel({ steps, isActive }: ThinkingPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  // Count actions by type
  const counts: Record<string, number> = {};
  steps.forEach((s) => {
    counts[s.action] = (counts[s.action] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Thinking Process</span>
          {isActive && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-[10px] text-pink-400 font-medium">THINKING</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {Object.entries(counts).slice(0, 4).map(([action, count]) => {
            const cfg = actionConfig[action as ThinkingStep["action"]];
            if (!cfg) return null;
            return (
              <div
                key={action}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${cfg.text} opacity-60`}
              >
                {cfg.icon}
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
            <Brain className="h-10 w-10 opacity-15" />
            <span className="text-xs">Agent reasoning will appear here</span>
          </div>
        ) : (
          <div className="p-4">
            <div className="relative">
              {/* Gradient timeline line */}
              <div className="absolute left-[17px] top-4 bottom-4 w-px bg-gradient-to-b from-pink-500/30 via-border to-transparent" />

              <div className="space-y-1">
                {steps.map((step, i) => {
                  const config = actionConfig[step.action];
                  const isLast = i === steps.length - 1;
                  const isLatest = isLast && isActive;

                  return (
                    <div
                      key={i}
                      className={`group flex gap-3 relative rounded-lg px-1 py-2 transition-all duration-300 ${
                        isLatest ? "bg-pink-500/5" : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Node */}
                      <div className="relative z-10 shrink-0">
                        {isLatest ? (
                          <div
                            className={`flex items-center justify-center w-[35px] h-[35px] rounded-full ${config.bg} shadow-lg ${config.glow} ring-4 ${config.ring}`}
                          >
                            <div className="text-white">{config.icon}</div>
                            <div
                              className={`absolute inset-0 rounded-full ${config.bg} opacity-25 animate-ping`}
                            />
                          </div>
                        ) : (
                          <div
                            className={`flex items-center justify-center w-[35px] h-[35px] rounded-full ${config.bg}/15 border border-current/10 ${config.text}`}
                          >
                            {config.icon}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold tracking-wider ${config.text}`}
                          >
                            {config.label}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <Clock className="h-2.5 w-2.5" />
                            {step.timestamp}
                          </div>
                          {isLatest && (
                            <Zap className="h-3 w-3 text-pink-400 animate-pulse" />
                          )}
                        </div>

                        <div
                          className={`mt-1 text-xs font-mono truncate ${
                            isLatest ? "text-foreground" : "text-foreground/70"
                          }`}
                        >
                          {step.target}
                        </div>

                        {step.detail && (
                          <div className="mt-1 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 opacity-40" />
                            <span className="line-clamp-2 leading-relaxed">{step.detail}</span>
                          </div>
                        )}
                      </div>

                      {/* Step number */}
                      <span className="text-[10px] font-mono text-zinc-700 pt-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        #{i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
