"use client";

import { Badge } from "@/components/ui/badge";
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

const glowColors: Record<string, string> = {
  emerald: "shadow-emerald-500/40",
  blue: "shadow-blue-500/40",
  amber: "shadow-amber-500/40",
  purple: "shadow-purple-500/40",
  cyan: "shadow-cyan-500/40",
};

const ringColors: Record<string, string> = {
  emerald: "ring-emerald-500/50",
  blue: "ring-blue-500/50",
  amber: "ring-amber-500/50",
  purple: "ring-purple-500/50",
  cyan: "ring-cyan-500/50",
};

const bgActive: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  purple: "bg-purple-500",
  cyan: "bg-cyan-500",
};

const textActive: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  amber: "text-amber-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
};

export function AgentFlow({
  phases,
  currentPhase,
  status,
  agentName,
  agentColor,
}: AgentFlowProps) {
  const progress =
    status === "completed"
      ? 100
      : status === "running"
      ? Math.round(((currentPhase + 1) / phases.length) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Agent Flow</span>
        </div>
        {status !== "idle" && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {agentName}
            </Badge>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === "idle" ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Workflow className="h-10 w-10 opacity-20" />
            <span className="text-xs">Run an agent to see its flow</span>
          </div>
        ) : (
          <div className="p-6">
            {/* Progress summary */}
            <div className="mb-6 px-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>
                  Step {status === "completed" ? phases.length : currentPhase + 1} of{" "}
                  {phases.length}
                </span>
                <span className={status === "completed" ? "text-emerald-400" : textActive[agentColor]}>
                  {status === "completed" ? "Completed" : phases[currentPhase]}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundColor:
                      status === "completed"
                        ? "rgb(16 185 129)"
                        : agentColor === "emerald"
                        ? "rgb(16 185 129)"
                        : agentColor === "blue"
                        ? "rgb(59 130 246)"
                        : agentColor === "amber"
                        ? "rgb(245 158 11)"
                        : agentColor === "cyan"
                        ? "rgb(6 182 212)"
                        : "rgb(168 85 247)",
                  }}
                />
              </div>
            </div>

            {/* Flow nodes */}
            <div className="relative flex flex-col items-center">
              {/* Vertical line */}
              <div className="absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2 bg-gradient-to-b from-border via-border to-transparent" />

              {phases.map((phase, i) => {
                const isCompleted = status === "completed" || i < currentPhase;
                const isCurrent = status === "running" && i === currentPhase;
                const isPending = !isCompleted && !isCurrent;

                return (
                  <div
                    key={i}
                    className="relative flex items-center w-full max-w-sm mb-2 last:mb-0"
                  >
                    {/* Node */}
                    <div className="flex items-center gap-3 w-full">
                      {/* Circle indicator */}
                      <div className="relative z-10 flex items-center justify-center">
                        {isCurrent ? (
                          <div
                            className={`relative flex items-center justify-center w-9 h-9 rounded-full ${bgActive[agentColor]} shadow-lg ${glowColors[agentColor]} ring-4 ${ringColors[agentColor]}`}
                          >
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                            {/* Pulse ring */}
                            <div
                              className={`absolute inset-0 rounded-full ${bgActive[agentColor]} opacity-30 animate-ping`}
                            />
                          </div>
                        ) : isCompleted ? (
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 border border-border">
                            <Circle className="h-3.5 w-3.5 text-zinc-600" />
                          </div>
                        )}
                      </div>

                      {/* Phase label */}
                      <div
                        className={`flex-1 rounded-lg px-4 py-2.5 transition-all duration-500 ${
                          isCurrent
                            ? `bg-${agentColor}-500/10 border border-${agentColor}-500/30 shadow-lg ${glowColors[agentColor]}`
                            : isCompleted
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-card/50 border border-border/50"
                        }`}
                        style={
                          isCurrent
                            ? {
                                backgroundColor: `color-mix(in srgb, ${
                                  agentColor === "emerald"
                                    ? "rgb(16 185 129)"
                                    : agentColor === "blue"
                                    ? "rgb(59 130 246)"
                                    : agentColor === "amber"
                                    ? "rgb(245 158 11)"
                                    : agentColor === "cyan"
                                    ? "rgb(6 182 212)"
                                    : "rgb(168 85 247)"
                                } 8%, transparent)`,
                                borderColor: `color-mix(in srgb, ${
                                  agentColor === "emerald"
                                    ? "rgb(16 185 129)"
                                    : agentColor === "blue"
                                    ? "rgb(59 130 246)"
                                    : agentColor === "amber"
                                    ? "rgb(245 158 11)"
                                    : agentColor === "cyan"
                                    ? "rgb(6 182 212)"
                                    : "rgb(168 85 247)"
                                } 30%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-medium ${
                              isCurrent
                                ? textActive[agentColor]
                                : isCompleted
                                ? "text-emerald-400/80"
                                : "text-muted-foreground/50"
                            }`}
                          >
                            {phase}
                          </span>
                          {isCurrent && (
                            <Zap
                              className={`h-3 w-3 ${textActive[agentColor]} animate-pulse`}
                            />
                          )}
                        </div>
                        {isCurrent && (
                          <div className="mt-1">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((j) => (
                                <div
                                  key={j}
                                  className={`h-0.5 w-3 rounded-full ${bgActive[agentColor]}`}
                                  style={{
                                    opacity: 0.4,
                                    animation: `pulse 1.5s ease-in-out ${j * 0.3}s infinite`,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step number */}
                      <span
                        className={`text-[10px] font-mono w-5 text-right ${
                          isPending ? "text-zinc-700" : "text-zinc-500"
                        }`}
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
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">All phases completed</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
