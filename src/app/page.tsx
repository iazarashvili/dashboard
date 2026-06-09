"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AgentCard } from "@/components/agent-card";
import { LogViewer, type LogEntry } from "@/components/log-viewer";
import { LiveBrowser } from "@/components/live-browser";
import { ThinkingPanel, type ThinkingStep } from "@/components/thinking-panel";
import { FileChangesPanel, type FileChange } from "@/components/file-changes-panel";
import { AgentFlow } from "@/components/agent-flow";
import { agents, type AgentStatus } from "@/lib/agents";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Activity,
  FolderOpen,
  Check,
  Terminal,
  Monitor,
  Brain,
  FileText,
  Workflow,
} from "lucide-react";

type RightTab = "logs" | "browser" | "thinking" | "files" | "flow";

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
  const [projectPath, setProjectPath] = useState("");
  const [pathSaved, setPathSaved] = useState(false);
  const [browserScreenshots, setBrowserScreenshots] = useState<string[]>([]);
  const [browserUrl, setBrowserUrl] = useState("");
  const [browserActive, setBrowserActive] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [activeTab, setActiveTab] = useState<RightTab>("logs");
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const abortControllers = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    const saved = localStorage.getItem("agent-project-path");
    if (saved) setProjectPath(saved);
  }, []);

  const handlePathChange = useCallback((value: string) => {
    setProjectPath(value);
    setPathSaved(false);
  }, []);

  const handlePathSave = useCallback(() => {
    localStorage.setItem("agent-project-path", projectPath);
    setPathSaved(true);
    setTimeout(() => setPathSaved(false), 2000);
  }, [projectPath]);

  const getTimestamp = () =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const addLog = useCallback(
    (agentId: string, agentName: string, type: LogEntry["type"], message: string) => {
      setLogs((prev) => [
        ...prev,
        { timestamp: getTimestamp(), agentId, agentName, type, message },
      ]);
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
      setThinkingSteps((prev) => [
        ...prev,
        { timestamp: getTimestamp(), action, target, detail },
      ]);
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
      setBrowserActive(true);
      setBrowserScreenshots([]);
      setBrowserUrl("");
      setThinkingSteps([]);
      setFileChanges([]);
      addLog(agentId, agent.name, "info", `Starting with input: ${input}`);
      addThinkingStep("decide", `Starting ${agent.name}`, `Input: ${input}`);

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, input, projectPath, extraFields }),
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
              } else if (event.type === "screenshot") {
                setBrowserScreenshots((prev) => [...prev, event.data]);
              } else if (event.type === "screenshot_path") {
                fetch(`/api/screenshot?path=${encodeURIComponent(event.path)}`)
                  .then((r) => r.json())
                  .then((r) => {
                    if (r.data) setBrowserScreenshots((prev) => [...prev, r.data]);
                  })
                  .catch(() => {});
              } else if (event.type === "browser_url") {
                setBrowserUrl(event.url);
              } else if (event.type === "complete") {
                updateAgent(agentId, { status: "completed" });
                setBrowserActive(false);
                addLog(agentId, agent.name, "success", "Agent completed successfully");
                addThinkingStep("done", "Agent completed successfully");
                if (agentId === "testbot") {
                  const casesPath = `${projectPath || ""}/cases.json`;
                  addLog(agentId, agent.name, "success", `DOWNLOAD:${casesPath}`);
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
        setBrowserActive(false);
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
    [addLog, updateAgent, addThinkingStep, addFileChange, projectPath]
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

  // Get active agent info for flow diagram
  const activeAgent = activeAgentId ? agents.find((a) => a.id === activeAgentId) : null;
  const activeState = activeAgentId ? agentStates[activeAgentId] : null;

  const tabs: { id: RightTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "logs", label: "Logs", icon: <Terminal className="h-3.5 w-3.5" />, badge: logs.length },
    { id: "browser", label: "Browser", icon: <Monitor className="h-3.5 w-3.5" />, badge: browserScreenshots.length },
    { id: "thinking", label: "Thinking", icon: <Brain className="h-3.5 w-3.5" />, badge: thinkingSteps.length },
    { id: "files", label: "Files", icon: <FileText className="h-3.5 w-3.5" />, badge: fileChanges.length },
    { id: "flow", label: "Flow", icon: <Workflow className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Agent Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                QA Automation Agents — Playwright Test Suite
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={projectPath}
                onChange={(e) => handlePathChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePathSave();
                }}
                onBlur={handlePathSave}
                placeholder="C:\path\to\test-project"
                className="h-8 w-80 text-xs font-mono"
              />
              {pathSaved && (
                <Check className="h-4 w-4 text-emerald-400 shrink-0 animate-in fade-in" />
              )}
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <Activity
                className={`h-4 w-4 ${
                  runningCount > 0 ? "text-emerald-400 animate-pulse" : "text-muted-foreground"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {runningCount > 0
                  ? `${runningCount} agent${runningCount > 1 ? "s" : ""} running`
                  : "All idle"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Agent cards */}
        <div className="w-[480px] shrink-0 border-r border-border overflow-y-auto p-4 space-y-3">
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
          <div className="flex items-center border-b border-border bg-card/30 px-2 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 rounded-full ${
                      activeTab === tab.id
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
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
            {activeTab === "browser" && (
              <LiveBrowser
                screenshots={browserScreenshots}
                currentUrl={browserUrl}
                isActive={browserActive}
              />
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
