"use client";

import {
  Workflow,
  CheckCircle2,
  Circle,
  Loader2,
  Zap,
} from "lucide-react";

interface AgentFlowProps {
  phases: string[];
  currentPhase: number;
  status: "idle" | "running" | "completed" | "error";
  agentName: string;
  agentColor: string;
}

const colorHex: Record<string, string> = {
  emerald: "#10b981",
  blue: "#3b82f6",
  amber: "#f59e0b",
  purple: "#a855f7",
  cyan: "#06b6d4",
};

export function AgentFlow({
  phases,
  currentPhase,
  status,
  agentName,
  agentColor,
}: AgentFlowProps) {
  const hex = colorHex[agentColor] || "#3b82f6";
  const progress =
    status === "completed"
      ? 100
      : status === "running"
      ? Math.round(((currentPhase + 1) / phases.length) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-[#64748b]" />
          <span className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748b]">Agent Flow</span>
        </div>
        {status !== "idle" && (
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
            >
              {agentName}
            </span>
            <span className="text-[11px] text-[#64748b]">{progress}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === "idle" ? (
          <div className="flex flex-col items-center justify-center h-full text-[#374151] gap-3">
            <Workflow className="h-10 w-10 opacity-20" />
            <span className="text-[11px]">Run an agent to see its flow</span>
          </div>
        ) : (
          <div className="p-6">
            {/* Progress summary */}
            <div className="mb-6 px-2">
              <div className="flex items-center justify-between text-[10px] text-[#94a3b8] mb-2">
                <span>
                  Step {status === "completed" ? phases.length : currentPhase + 1} of{" "}
                  {phases.length}
                </span>
                <span style={{ color: status === "completed" ? "#10b981" : hex }}>
                  {status === "completed" ? "Completed" : phases[currentPhase]}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: status === "completed" ? "#10b981" : hex,
                  }}
                />
              </div>
            </div>

            {/* Flow nodes */}
            <div className="relative flex flex-col items-center">
              {/* Vertical line */}
              <div
                className="absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.04), transparent)' }}
              />

              {phases.map((phase, i) => {
                const isCompleted = status === "completed" || i < currentPhase;
                const isCurrent = status === "running" && i === currentPhase;
                const isPending = !isCompleted && !isCurrent;

                return (
                  <div
                    key={i}
                    className="relative flex items-center w-full max-w-sm mb-2 last:mb-0 animate-fade-in"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {/* Circle indicator */}
                      <div className="relative z-10 flex items-center justify-center">
                        {isCurrent ? (
                          <div
                            className="relative flex items-center justify-center w-9 h-9 rounded-full"
                            style={{
                              background: hex,
                              boxShadow: `0 0 20px color-mix(in srgb, ${hex} 40%, transparent), 0 0 0 4px color-mix(in srgb, ${hex} 20%, transparent)`,
                            }}
                          >
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          </div>
                        ) : isCompleted ? (
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-full"
                            style={{
                              background: 'rgba(16,185,129,0.15)',
                              border: '2px solid rgba(16,185,129,0.4)',
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-full"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            <Circle className="h-3.5 w-3.5 text-[#374151]" />
                          </div>
                        )}
                      </div>

                      {/* Phase label */}
                      <div
                        className="flex-1 rounded-lg px-4 py-2.5 transition-all duration-500"
                        style={{
                          background: isCurrent
                            ? `color-mix(in srgb, ${hex} 8%, transparent)`
                            : isCompleted
                            ? 'rgba(16,185,129,0.05)'
                            : 'rgba(255,255,255,0.02)',
                          border: isCurrent
                            ? `1px solid color-mix(in srgb, ${hex} 30%, transparent)`
                            : isCompleted
                            ? '1px solid rgba(16,185,129,0.15)'
                            : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isCurrent
                            ? `0 0 15px color-mix(in srgb, ${hex} 15%, transparent)`
                            : 'none',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[11px] font-medium"
                            style={{
                              color: isCurrent
                                ? hex
                                : isCompleted
                                ? 'rgba(16,185,129,0.8)'
                                : '#374151',
                            }}
                          >
                            {phase}
                          </span>
                          {isCurrent && (
                            <Zap className="h-3 w-3" style={{ color: hex, animation: 'pulse-dot 1.2s infinite' }} />
                          )}
                        </div>
                        {isCurrent && (
                          <div className="mt-1 flex gap-1">
                            {[0, 1, 2].map((j) => (
                              <div
                                key={j}
                                className="h-0.5 w-3 rounded-full"
                                style={{
                                  background: hex,
                                  opacity: 0.4,
                                  animation: `pulse-dot 1.5s ease-in-out ${j * 0.3}s infinite`,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Step number */}
                      <span
                        className="text-[10px] w-5 text-right"
                        style={{ color: isPending ? '#1e293b' : '#374151' }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion badge */}
            {status === "completed" && (
              <div className="flex justify-center mt-6 animate-fade-in">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10b981',
                    boxShadow: '0 0 20px rgba(16,185,129,0.15)',
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[11px] font-semibold">All phases completed</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
