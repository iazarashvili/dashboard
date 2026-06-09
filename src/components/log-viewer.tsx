"use client";

import { useEffect, useRef } from "react";
import { Terminal, X, Download } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  agentId: string;
  agentName: string;
  type: "info" | "error" | "success" | "output" | "phase";
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  onClear: () => void;
}

const typeColors: Record<string, string> = {
  info: "#3b82f6",
  error: "#ef4444",
  success: "#10b981",
  output: "#94a3b8",
  phase: "#f59e0b",
};

const agentColors: Record<string, string> = {
  manual: "#10b981",
  "write-test": "#3b82f6",
  "fix-test": "#f59e0b",
  "full-flow": "#a855f7",
  testbot: "#06b6d4",
};

function DownloadButton({ filePath }: { filePath: string }) {
  const handleDownload = async () => {
    const res = await fetch(`/api/download?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cases.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-90"
      style={{
        background: 'rgba(6,182,212,0.2)',
        color: '#06b6d4',
        border: '1px solid rgba(6,182,212,0.3)',
      }}
    >
      <Download className="h-3.5 w-3.5" />
      Download cases.json
    </button>
  );
}

export function LogViewer({ logs, onClear }: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#64748b]" />
          <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748b]">Pipeline Log</span>
          <span
            className="text-[10px] px-1.5 py-px rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
          >
            {logs.length}
          </span>
        </div>
        <button
          className="text-[#64748b] hover:text-[#94a3b8] transition-colors p-1"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        <div className="text-[11px] space-y-0.5">
          {logs.length === 0 ? (
            <div className="text-[#374151] text-center py-12">
              Agent output will appear here...
            </div>
          ) : (
            logs.map((log, i) => {
              if (log.message.startsWith("DOWNLOAD:")) {
                const filePath = log.message.replace("DOWNLOAD:", "");
                return (
                  <div key={i} className="flex gap-2 items-start leading-relaxed animate-fade-in">
                    <span className="text-[#374151] shrink-0 select-none">
                      {log.timestamp}
                    </span>
                    <span className="shrink-0" style={{ color: agentColors[log.agentId] || '#94a3b8' }}>
                      [{log.agentName}]
                    </span>
                    <DownloadButton filePath={filePath} />
                  </div>
                );
              }

              return (
                <div key={i} className="flex gap-2 leading-[1.5] animate-fade-in">
                  <span className="text-[#374151] shrink-0 select-none">
                    {log.timestamp}
                  </span>
                  <span className="shrink-0" style={{ color: agentColors[log.agentId] || '#94a3b8' }}>
                    [{log.agentName}]
                  </span>
                  <span style={{ color: typeColors[log.type] || '#94a3b8' }}>
                    {log.type === "phase" ? `>> ${log.message}` : log.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
