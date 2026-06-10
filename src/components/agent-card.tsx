"use client";

import { useState, memo } from "react";
import {
  Search,
  FileCode,
  Wrench,
  Workflow,
  ClipboardCheck,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AgentConfig, AgentStatus } from "@/lib/agents";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  FileCode,
  Wrench,
  Workflow,
  ClipboardCheck,
};

const agentColorMap: Record<string, { hex: string; rgb: string }> = {
  emerald: { hex: "#10b981", rgb: "16,185,129" },
  blue: { hex: "#3b82f6", rgb: "59,130,246" },
  amber: { hex: "#f59e0b", rgb: "245,158,11" },
  cyan: { hex: "#06b6d4", rgb: "6,182,212" },
  purple: { hex: "#a855f7", rgb: "168,85,247" },
};

interface AgentCardProps {
  agent: AgentConfig;
  onRun: (agentId: string, input: string, extraFields?: Record<string, string>) => void;
  onStop: (agentId: string) => void;
  status: AgentStatus;
  currentPhase: number;
}

export const AgentCard = memo(function AgentCard({
  agent,
  onRun,
  onStop,
  status,
  currentPhase,
}: AgentCardProps) {
  const [input, setInput] = useState("");
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [showExtra, setShowExtra] = useState(false);
  const Icon = iconMap[agent.icon];
  const color = agentColorMap[agent.color] || agentColorMap.blue;
  const isRunning = status === "running";
  const hasExtra = agent.extraFields && agent.extraFields.length > 0;

  const handleRun = () => {
    onRun(
      agent.id,
      input || (agent.inputOptional ? "use manual_output.json from project directory" : ""),
      hasExtra ? extraValues : undefined
    );
  };

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 animate-fade-in"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: isRunning
          ? `1px solid ${color.hex}`
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isRunning
          ? `0 0 20px color-mix(in srgb, ${color.hex} 25%, transparent)`
          : 'none',
        ['--agent-color' as string]: color.hex,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base" style={{ color: color.hex }}>{Icon && <Icon className="h-4 w-4" />}</span>
          <span className="text-[13px] font-semibold text-[#f1f5f9]">{agent.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: status === "completed" ? "#10b981"
                : status === "error" ? "#ef4444"
                : status === "running" ? color.hex
                : "#374151",
              boxShadow: isRunning ? `0 0 8px ${color.hex}` : 'none',
              animation: isRunning ? 'pulse-dot 1.2s infinite' : 'none',
            }}
          />
          <span className="text-[11px] text-[#94a3b8] uppercase tracking-[0.5px]">
            {status === "idle" ? "Idle" : status === "running" ? "Running" : status === "completed" ? "Done" : "Error"}
          </span>
          {isRunning && (
            <span className="inline-flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[5px] h-[5px] rounded-full inline-block"
                  style={{
                    background: color.hex,
                    animation: `pulse-dot 1.2s infinite ${i * 0.2}s`,
                  }}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Role / Description */}
      <p className="text-[9px] uppercase text-[#64748b] tracking-[1px] mb-3">
        {agent.description}
      </p>

      {/* Phase progress */}
      {(isRunning || status === "completed") && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-[#94a3b8] mb-1.5">
            <span>
              {isRunning
                ? agent.phases[currentPhase] || "Processing..."
                : "All phases complete"}
            </span>
            <span>
              {status === "completed" ? agent.phases.length : currentPhase + 1}
              /{agent.phases.length}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  status === "completed"
                    ? 100
                    : ((currentPhase + 1) / agent.phases.length) * 100
                }%`,
                backgroundColor: status === "completed" ? "#10b981" : color.hex,
              }}
            />
          </div>
        </div>
      )}

      {/* Input + Run */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={agent.inputPlaceholder}
          className="flex-1 text-[13px] bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-[#f1f5f9] placeholder:text-[#374151] outline-none focus:border-[#f59e0b] transition-colors"
          disabled={isRunning}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isRunning && (input.trim() || agent.inputOptional)) {
              handleRun();
            }
          }}
        />
        {isRunning ? (
          <button
            className="px-3 py-2 rounded-lg bg-[#ef4444] text-[#0a0f1a] font-bold text-[13px] transition-opacity hover:opacity-90"
            onClick={() => onStop(agent.id)}
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded-lg bg-[#f59e0b] text-[#0a0f1a] font-bold text-[13px] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleRun}
            disabled={!input.trim() && !agent.inputOptional}
          >
            <Play className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Extra fields toggle */}
      {hasExtra && (
        <>
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-1 text-[10px] text-[#64748b] hover:text-[#94a3b8] transition-colors mt-3 uppercase tracking-[0.5px]"
            disabled={isRunning}
          >
            {showExtra ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            File Paths
            {Object.values(extraValues).some((v) => v.trim()) && (
              <span className="text-[9px] px-1.5 py-px rounded-full bg-white/[0.08] text-[#94a3b8] ml-1">
                set
              </span>
            )}
          </button>

          {showExtra && (
            <div className="space-y-2 mt-2 pl-2 border-l border-white/[0.08] ml-1">
              {agent.extraFields!.map((field) => (
                <div key={field.key} className="pl-3">
                  <label className="text-[10px] text-[#64748b] uppercase tracking-[1px] block mb-1">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={extraValues[field.key] || ""}
                      onChange={(e) =>
                        setExtraValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full text-[11px] bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[#f1f5f9] placeholder:text-[#374151] outline-none focus:border-[#f59e0b] transition-colors resize-y min-h-[36px]"
                      disabled={isRunning}
                    />
                  ) : (
                    <input
                      value={extraValues[field.key] || ""}
                      onChange={(e) =>
                        setExtraValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full text-[11px] bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[#f1f5f9] placeholder:text-[#374151] outline-none focus:border-[#f59e0b] transition-colors"
                      disabled={isRunning}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});
