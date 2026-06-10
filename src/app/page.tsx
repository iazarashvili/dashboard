"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AgentCard } from "@/components/agent-card";
import { LogViewer, type LogEntry } from "@/components/log-viewer";
import { ThinkingPanel, type ThinkingStep } from "@/components/thinking-panel";
import { FileChangesPanel, type FileChange } from "@/components/file-changes-panel";
import { AgentFlow } from "@/components/agent-flow";
import { agents, type AgentStatus } from "@/lib/agents";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Terminal,
  Brain,
  FileText,
  Workflow,
} from "lucide-react";

type RightTab = "logs" | "thinking" | "files" | "flow";

interface AgentState {
  status: AgentStatus;
  currentPhase: number;
}

export default function Dashboard() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>(
    () =>
      Object.fromEntries(
        agents.map((a) => [a.id, { status: "idle" as AgentStatus, currentPhase: 0 }])
      )
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [activeTab, setActiveTab] = useState<RightTab>("logs");
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const abortControllers = useRef<Record<string, AbortController>>({});

  const getTimestamp = () =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const MAX_LOGS = 500;
  const MAX_THINKING = 300;

  const addLog = useCallback(
    (agentId: string, agentName: string, type: LogEntry["type"], message: string) => {
      setLogs((prev) => {
        const next = [...prev, { timestamp: getTimestamp(), agentId, agentName, type, message }];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    },
    []
  );

  const updateAgent = useCallback(
    (agentId: string, update: Partial<AgentState>) => {
      setAgentStates((prev) => ({
        ...prev,
        [agentId]: { ...prev[agentId], ...update },
      }));
    },
    []
  );

  const addThinkingStep = useCallback(
    (action: ThinkingStep["action"], target: string, detail?: string) => {
      setThinkingSteps((prev) => {
        const next = [...prev, { timestamp: getTimestamp(), action, target, detail }];
        return next.length > MAX_THINKING ? next.slice(-MAX_THINKING) : next;
      });
    },
    []
  );

  const addFileChange = useCallback(
    (path: string, action: "created" | "modified") => {
      setFileChanges((prev) => {
        const existing = prev.find((f) => f.path === path);
        if (existing) {
          return prev.map((f) =>
            f.path === path
              ? { ...f, action, additions: f.additions + 1 }
              : f
          );
        }
        return [...prev, { path, action, additions: 1, deletions: 0 }];
      });
    },
    []
  );

  const handleRun = useCallback(
    async (agentId: string, input: string, extraFields?: Record<string, string>) => {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      const controller = new AbortController();
      abortControllers.current[agentId] = controller;

      updateAgent(agentId, { status: "running", currentPhase: 0 });
      setActiveAgentId(agentId);
      setThinkingSteps([]);
      setFileChanges([]);
      addLog(agentId, agent.name, "info", `Starting with input: ${input}`);
      addThinkingStep("decide", `Starting ${agent.name}`, `Input: ${input}`);

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, input, extraFields }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to start agent");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              if (event.type === "phase") {
                updateAgent(agentId, { currentPhase: event.phase });
                addLog(agentId, agent.name, "phase", event.message);
                addThinkingStep("decide", event.message, `Phase ${event.phase + 1}/${agent.phases.length}`);
              } else if (event.type === "output") {
                addLog(agentId, agent.name, "output", event.message);
              } else if (event.type === "error") {
                addLog(agentId, agent.name, "error", event.message);
                addThinkingStep("error", event.message);
              } else if (event.type === "thinking") {
                addThinkingStep(event.action, event.target, event.detail);
              } else if (event.type === "file_change") {
                addFileChange(event.path, event.action);
              } else if (event.type === "complete") {
                updateAgent(agentId, { status: "completed" });
                addLog(agentId, agent.name, "success", "Agent completed successfully");
                addThinkingStep("done", "Agent completed successfully");
                if (agentId === "testbot") {
                  addLog(agentId, agent.name, "success", `DOWNLOAD:agents-data/manual-qa-agent/cases.json`);
                }
              }
            } catch {
              // skip malformed JSON
            }
          }
        }

        setAgentStates((prev) => {
          if (prev[agentId].status === "running") {
            return {
              ...prev,
              [agentId]: { ...prev[agentId], status: "completed" },
            };
          }
          return prev;
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          updateAgent(agentId, { status: "idle" });
          addLog(agentId, agent.name, "info", "Agent stopped by user");
        } else {
          updateAgent(agentId, { status: "error" });
          addLog(
            agentId,
            agent.name,
            "error",
            err instanceof Error ? err.message : "Unknown error"
          );
        }
      } finally {
        delete abortControllers.current[agentId];
      }
    },
    [addLog, updateAgent, addThinkingStep, addFileChange]
  );

  const handleStop = useCallback(
    (agentId: string) => {
      const controller = abortControllers.current[agentId];
      if (controller) {
        controller.abort();
      }
      const agent = agents.find((a) => a.id === agentId);
      if (agent) {
        addLog(agentId, agent.name, "info", "Stopping agent...");
      }
    },
    [addLog]
  );

  const runningCount = Object.values(agentStates).filter(
    (s) => s.status === "running"
  ).length;

  const activeAgent = activeAgentId ? agents.find((a) => a.id === activeAgentId) : null;
  const activeState = activeAgentId ? agentStates[activeAgentId] : null;

  const tabs: { id: RightTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "logs", label: "Logs", icon: <Terminal className="h-3.5 w-3.5" />, badge: logs.length },
    { id: "thinking", label: "Thinking", icon: <Brain className="h-3.5 w-3.5" />, badge: thinkingSteps.length },
    { id: "files", label: "Files", icon: <FileText className="h-3.5 w-3.5" />, badge: fileChanges.length },
    { id: "flow", label: "Flow", icon: <Workflow className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0f1a' }}>
      {/* Header */}
      <header className="border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-[2px]">
              <span className="text-[#f1f5f9]">QA </span>
              <span className="text-[#f59e0b]">AGENT </span>
              <span className="text-[#6366f1]">SYSTEM</span>
            </h1>
            <p className="text-[11px] text-[#64748b] tracking-[0.5px] mt-1">
              Automated QA Pipeline — Playwright Test Suite
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  runningCount > 0 ? "bg-[#10b981] shadow-[0_0_8px_#10b981]" : "bg-[#374151]"
                }`}
                style={runningCount > 0 ? { animation: 'pulse-dot 1.2s infinite' } : undefined}
              />
              <span className="text-[11px] text-[#94a3b8] uppercase tracking-[0.5px]">
                {runningCount > 0
                  ? `${runningCount} running`
                  : "Idle"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Agent cards */}
        <div className="w-[440px] shrink-0 border-r border-white/[0.08] overflow-y-auto p-4 space-y-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              status={agentStates[agent.id].status}
              currentPhase={agentStates[agent.id].currentPhase}
              onRun={handleRun}
              onStop={handleStop}
            />
          ))}
        </div>

        {/* Right: Tabbed panels */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center border-b border-white/[0.08] bg-white/[0.02] px-2 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.5px] border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#f59e0b] text-[#f1f5f9]"
                    : "border-transparent text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-px rounded-full ${
                      activeTab === tab.id
                        ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                        : "bg-white/[0.08] text-[#94a3b8]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "logs" && (
              <LogViewer logs={logs} onClear={() => setLogs([])} />
            )}
            {activeTab === "thinking" && (
              <ThinkingPanel steps={thinkingSteps} isActive={runningCount > 0} />
            )}
            {activeTab === "files" && (
              <FileChangesPanel changes={fileChanges} />
            )}
            {activeTab === "flow" && (
              <AgentFlow
                phases={activeAgent?.phases || []}
                currentPhase={activeState?.currentPhase || 0}
                status={activeState?.status || "idle"}
                agentName={activeAgent?.name || ""}
                agentColor={activeAgent?.color || "blue"}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
