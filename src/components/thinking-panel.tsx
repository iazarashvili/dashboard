"use client";

import { useEffect, useRef } from "react";
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
  { icon: React.ReactNode; color: string; label: string }
> = {
  read: { icon: <FileText className="h-3.5 w-3.5" />, color: "#3b82f6", label: "READ" },
  write: { icon: <Pencil className="h-3.5 w-3.5" />, color: "#10b981", label: "CREATE" },
  edit: { icon: <Pencil className="h-3.5 w-3.5" />, color: "#f59e0b", label: "EDIT" },
  search: { icon: <Search className="h-3.5 w-3.5" />, color: "#a855f7", label: "SEARCH" },
  navigate: { icon: <Globe className="h-3.5 w-3.5" />, color: "#06b6d4", label: "NAVIGATE" },
  command: { icon: <Terminal className="h-3.5 w-3.5" />, color: "#64748b", label: "RUN" },
  decide: { icon: <Brain className="h-3.5 w-3.5" />, color: "#ec4899", label: "THINK" },
  error: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "#ef4444", label: "ERROR" },
  done: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "#10b981", label: "DONE" },
};

export function ThinkingPanel({ steps, isActive }: ThinkingPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const counts: Record<string, number> = {};
  steps.forEach((s) => {
    counts[s.action] = (counts[s.action] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#64748b]" />
          <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748b]">Thinking</span>
          {isActive && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                background: 'rgba(236,72,153,0.1)',
                border: '1px solid rgba(236,72,153,0.2)',
                color: '#ec4899',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" style={{ animation: 'pulse-dot 1.2s infinite' }} />
              ACTIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {Object.entries(counts).slice(0, 4).map(([action, count]) => {
            const cfg = actionConfig[action as ThinkingStep["action"]];
            if (!cfg) return null;
            return (
              <span
                key={action}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] opacity-60"
                style={{ color: cfg.color }}
              >
                {cfg.icon}
                <span>{count}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#374151] gap-3">
            <Brain className="h-10 w-10 opacity-15" />
            <span className="text-[11px]">Agent reasoning will appear here</span>
          </div>
        ) : (
          <div className="p-4">
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-[17px] top-4 bottom-4 w-px"
                style={{ background: 'linear-gradient(to bottom, rgba(236,72,153,0.3), rgba(255,255,255,0.08), transparent)' }}
              />

              <div className="space-y-1">
                {steps.map((step, i) => {
                  const config = actionConfig[step.action];
                  const isLast = i === steps.length - 1;
                  const isLatest = isLast && isActive;

                  return (
                    <div
                      key={i}
                      className="group flex gap-3 relative rounded-lg px-1 py-2 transition-all duration-300 animate-fade-in"
                      style={{
                        background: isLatest ? 'rgba(236,72,153,0.05)' : undefined,
                      }}
                    >
                      {/* Node */}
                      <div className="relative z-10 shrink-0">
                        {isLatest ? (
                          <div
                            className="flex items-center justify-center w-[35px] h-[35px] rounded-full text-white"
                            style={{
                              background: config.color,
                              boxShadow: `0 0 15px color-mix(in srgb, ${config.color} 40%, transparent), 0 0 0 4px color-mix(in srgb, ${config.color} 20%, transparent)`,
                            }}
                          >
                            {config.icon}
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center w-[35px] h-[35px] rounded-full"
                            style={{
                              background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${config.color} 20%, transparent)`,
                              color: config.color,
                            }}
                          >
                            {config.icon}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-bold tracking-wider"
                            style={{ color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-[#374151]">
                            <Clock className="h-2.5 w-2.5" />
                            {step.timestamp}
                          </span>
                          {isLatest && (
                            <Zap className="h-3 w-3 text-[#ec4899]" style={{ animation: 'pulse-dot 1.2s infinite' }} />
                          )}
                        </div>

                        <div
                          className="mt-1 text-[11px] truncate"
                          style={{ color: isLatest ? '#f1f5f9' : 'rgba(241,245,249,0.7)' }}
                        >
                          {step.target}
                        </div>

                        {step.detail && (
                          <div className="mt-1 flex items-start gap-1.5 text-[10px] text-[#64748b]">
                            <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 opacity-40" />
                            <span className="line-clamp-2 leading-relaxed">{step.detail}</span>
                          </div>
                        )}
                      </div>

                      {/* Step number */}
                      <span className="text-[10px] text-[#374151] pt-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
    </div>
  );
}
