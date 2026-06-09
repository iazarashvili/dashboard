"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FilePlus,
  FilePen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export interface FileChange {
  path: string;
  action: "created" | "modified";
  additions: number;
  deletions: number;
  diff?: string[];
}

interface FileChangesPanelProps {
  changes: FileChange[];
}

export function FileChangesPanel({ changes }: FileChangesPanelProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const totalAdded = changes.reduce((sum, c) => sum + c.additions, 0);
  const totalDeleted = changes.reduce((sum, c) => sum + c.deletions, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">File Changes</span>
          <Badge variant="outline" className="text-xs">
            {changes.length} files
          </Badge>
        </div>
        {changes.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">+{totalAdded}</span>
            <span className="text-red-400">-{totalDeleted}</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {changes.length === 0 ? (
          <div className="text-muted-foreground text-center py-12 text-xs">
            File changes will appear here...
          </div>
        ) : (
          <div className="divide-y divide-border">
            {changes.map((file) => {
              const isExpanded = expandedFile === file.path;
              return (
                <div key={file.path}>
                  {/* File header */}
                  <button
                    onClick={() =>
                      setExpandedFile(isExpanded ? null : file.path)
                    }
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-muted/50 transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}

                    {file.action === "created" ? (
                      <FilePlus className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <FilePen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    )}

                    <span className="text-xs font-mono truncate flex-1">
                      {file.path}
                    </span>

                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4 px-1.5 shrink-0 ${
                        file.action === "created"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {file.action}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-[10px] shrink-0 ml-2">
                      {file.additions > 0 && (
                        <span className="text-emerald-400">+{file.additions}</span>
                      )}
                      {file.deletions > 0 && (
                        <span className="text-red-400">-{file.deletions}</span>
                      )}
                    </div>
                  </button>

                  {/* Diff view */}
                  {isExpanded && file.diff && (
                    <div className="bg-zinc-950 border-t border-border px-4 py-2 font-mono text-[11px] leading-relaxed overflow-x-auto">
                      {file.diff.map((line, i) => (
                        <div
                          key={i}
                          className={
                            line.startsWith("+")
                              ? "text-emerald-400 bg-emerald-500/5"
                              : line.startsWith("-")
                              ? "text-red-400 bg-red-500/5"
                              : line.startsWith("@@")
                              ? "text-cyan-400"
                              : "text-zinc-500"
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
