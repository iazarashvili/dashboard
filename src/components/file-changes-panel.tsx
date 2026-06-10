"use client";

import { useState, memo } from "react";
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

export const FileChangesPanel = memo(function FileChangesPanel({ changes }: FileChangesPanelProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const totalAdded = changes.reduce((sum, c) => sum + c.additions, 0);
  const totalDeleted = changes.reduce((sum, c) => sum + c.deletions, 0);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#64748b]" />
          <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748b]">File Changes</span>
          <span
            className="text-[10px] px-1.5 py-px rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
          >
            {changes.length}
          </span>
        </div>
        {changes.length > 0 && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-[#10b981]">+{totalAdded}</span>
            <span className="text-[#ef4444]">-{totalDeleted}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {changes.length === 0 ? (
          <div className="text-[#374151] text-center py-12 text-[11px]">
            File changes will appear here...
          </div>
        ) : (
          <div>
            {changes.map((file) => {
              const isExpanded = expandedFile === file.path;
              return (
                <div key={file.path} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() =>
                      setExpandedFile(isExpanded ? null : file.path)
                    }
                    className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
                    )}

                    {file.action === "created" ? (
                      <FilePlus className="h-3.5 w-3.5 text-[#10b981] shrink-0" />
                    ) : (
                      <FilePen className="h-3.5 w-3.5 text-[#f59e0b] shrink-0" />
                    )}

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[11px] truncate text-[#f1f5f9]">
                        {file.path.split(/[/\\]/).pop()}
                      </span>
                      <span className="text-[9px] truncate text-[#475569]">
                        {file.path}
                      </span>
                    </div>

                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        background: file.action === "created"
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(245,158,11,0.15)',
                        color: file.action === "created" ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {file.action}
                    </span>

                    <div className="flex items-center gap-1.5 text-[10px] shrink-0 ml-2">
                      {file.additions > 0 && (
                        <span className="text-[#10b981]">+{file.additions}</span>
                      )}
                      {file.deletions > 0 && (
                        <span className="text-[#ef4444]">-{file.deletions}</span>
                      )}
                    </div>
                  </button>

                  {isExpanded && file.diff && (
                    <div
                      className="px-4 py-2 text-[11px] leading-relaxed overflow-x-auto"
                      style={{ background: '#060a12', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {file.diff.map((line, i) => (
                        <div
                          key={i}
                          style={{
                            color: line.startsWith("+")
                              ? '#10b981'
                              : line.startsWith("-")
                              ? '#ef4444'
                              : line.startsWith("@@")
                              ? '#06b6d4'
                              : '#374151',
                            background: line.startsWith("+")
                              ? 'rgba(16,185,129,0.05)'
                              : line.startsWith("-")
                              ? 'rgba(239,68,68,0.05)'
                              : undefined,
                          }}
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
      </div>
    </div>
  );
});
