"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const colorMap: Record<string, { badge: string; border: string; glow: string; icon: string }> = {
  emerald: {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    icon: "text-emerald-400",
  },
  blue: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    icon: "text-blue-400",
  },
  amber: {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/10",
    icon: "text-amber-400",
  },
  cyan: {
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/10",
    icon: "text-cyan-400",
  },
  purple: {
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/10",
    icon: "text-purple-400",
  },
};

const statusConfig: Record<
  AgentStatus,
  { label: string; variant: string; icon: React.ReactNode }
> = {
  idle: { label: "Idle", variant: "secondary", icon: null },
  running: {
    label: "Running",
    variant: "default",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  error: {
    label: "Error",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

interface AgentCardProps {
  agent: AgentConfig;
  onRun: (agentId: string, input: string, extraFields?: Record<string, string>) => void;
  onStop: (agentId: string) => void;
  status: AgentStatus;
  currentPhase: number;
}

export function AgentCard({
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
  const colors = colorMap[agent.color];
  const statusInfo = statusConfig[status];
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
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isRunning ? `${colors.border} shadow-lg ${colors.glow}` : "border-border"
      }`}
    >
      {isRunning && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent animate-pulse" style={{ color: `var(--color-${agent.color}-500)` }} />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg bg-card border ${colors.border}`}
            >
              {Icon && <Icon className={`h-5 w-5 ${colors.icon}`} />}
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {agent.description}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${
              status === "running"
                ? colors.badge
                : status === "completed"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : status === "error"
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : ""
            }`}
          >
            <span className="flex items-center gap-1">
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Phase progress */}
        {(isRunning || status === "completed") && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {isRunning
                  ? agent.phases[currentPhase] || "Processing..."
                  : "All phases complete"}
              </span>
              <span>
                {status === "completed"
                  ? agent.phases.length
                  : currentPhase + 1}
                /{agent.phases.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500`}
                style={{
                  width: `${
                    status === "completed"
                      ? 100
                      : ((currentPhase + 1) / agent.phases.length) * 100
                  }%`,
                  backgroundColor:
                    status === "completed"
                      ? "rgb(16 185 129)"
                      : agent.color === "emerald"
                      ? "rgb(16 185 129)"
                      : agent.color === "blue"
                      ? "rgb(59 130 246)"
                      : agent.color === "amber"
                      ? "rgb(245 158 11)"
                      : agent.color === "cyan"
                      ? "rgb(6 182 212)"
                      : "rgb(168 85 247)",
                }}
              />
            </div>
          </div>
        )}

        {/* Input + Run */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={agent.inputPlaceholder}
            className="text-sm h-9"
            disabled={isRunning}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isRunning && (input.trim() || agent.inputOptional)) {
                handleRun();
              }
            }}
          />
          {isRunning ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-9 px-3"
              onClick={() => onStop(agent.id)}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-9 px-3"
              onClick={handleRun}
              disabled={!input.trim() && !agent.inputOptional}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Extra fields toggle */}
        {hasExtra && (
          <>
            <button
              type="button"
              onClick={() => setShowExtra(!showExtra)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              disabled={isRunning}
            >
              {showExtra ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              File Paths
              {Object.values(extraValues).some((v) => v.trim()) && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 ml-1">
                  configured
                </Badge>
              )}
            </button>

            {showExtra && (
              <div className="space-y-2 pl-1 border-l-2 border-border ml-1">
                {agent.extraFields!.map((field) => (
                  <div key={field.key} className="space-y-0.5 pl-3">
                    <label className="text-[11px] text-muted-foreground">
                      {field.label}
                    </label>
                    <Input
                      value={extraValues[field.key] || ""}
                      onChange={(e) =>
                        setExtraValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="text-xs h-7 font-mono"
                      disabled={isRunning}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
