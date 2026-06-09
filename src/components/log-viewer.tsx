"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const typeStyles: Record<string, string> = {
  info: "text-blue-400",
  error: "text-red-400",
  success: "text-emerald-400",
  output: "text-zinc-300",
  phase: "text-amber-400",
};

const agentColors: Record<string, string> = {
  manual: "text-emerald-400",
  "write-test": "text-blue-400",
  "fix-test": "text-amber-400",
  "full-flow": "text-purple-400",
  testbot: "text-cyan-400",
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-xs font-medium"
    >
      <Download className="h-3.5 w-3.5" />
      Download cases.json
    </button>
  );
}

export function LogViewer({ logs, onClear }: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Agent Output</span>
          <Badge variant="outline" className="text-xs">
            {logs.length} lines
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="font-mono text-xs space-y-0.5">
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-12">
              Agent output will appear here...
            </div>
          ) : (
            logs.map((log, i) => {
              // Check if this is a download link
              if (log.message.startsWith("DOWNLOAD:")) {
                const filePath = log.message.replace("DOWNLOAD:", "");
                return (
                  <div key={i} className="flex gap-2 items-start leading-relaxed">
                    <span className="text-zinc-600 shrink-0 select-none">
                      {log.timestamp}
                    </span>
                    <span className={`shrink-0 ${agentColors[log.agentId] || "text-zinc-400"}`}>
                      [{log.agentName}]
                    </span>
                    <DownloadButton filePath={filePath} />
                  </div>
                );
              }

              return (
                <div key={i} className="flex gap-2 leading-relaxed">
                  <span className="text-zinc-600 shrink-0 select-none">
                    {log.timestamp}
                  </span>
                  <span
                    className={`shrink-0 ${
                      agentColors[log.agentId] || "text-zinc-400"
                    }`}
                  >
                    [{log.agentName}]
                  </span>
                  <span className={typeStyles[log.type] || "text-zinc-300"}>
                    {log.type === "phase" ? `>> ${log.message}` : log.message}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
