import { NextRequest } from "next/server";
import { getRunningProcesses } from "../run/route";

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();

  if (!agentId) {
    return Response.json({ error: "agentId is required" }, { status: 400 });
  }

  const runningProcesses = getRunningProcesses();
  const proc = runningProcesses.get(agentId);

  if (!proc) {
    return Response.json({ error: "No running process found", stopped: false });
  }

  try {
    // On Windows, SIGTERM doesn't work well with shell:true spawned processes.
    // Use taskkill to kill the entire process tree.
    if (process.platform === "win32" && proc.pid) {
      const { execSync } = require("child_process");
      try {
        execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: "ignore" });
      } catch {
        // Process may have already exited
        proc.kill();
      }
    } else {
      proc.kill("SIGTERM");
    }
    runningProcesses.delete(agentId);
    return Response.json({ stopped: true });
  } catch {
    return Response.json({ error: "Failed to stop process", stopped: false });
  }
}
