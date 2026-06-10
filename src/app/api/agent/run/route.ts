import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { agents } from "@/lib/agents";
import path from "path";

export const maxDuration = 300;

// Pre-compiled regex patterns (avoid re-creating on every line)
const PATH_SRC = String.raw`["']?((?:[A-Za-z]:\\|\/)?[^\s"']*\.\w+)["']?`;
const RE_READ = new RegExp(`(?:Read|Reading|read)\\s+(?:file\\s+)?${PATH_SRC}`);
const RE_WRITE = new RegExp(`(?:Writ(?:e|ing|ten)|Creat(?:e|ing|ed))\\s+(?:file\\s+|to\\s+)?${PATH_SRC}`);
const RE_EDIT = new RegExp(`(?:Edit|Editing|Updated|Modif(?:y|ied))\\s+(?:file\\s+)?${PATH_SRC}`);
const RE_SEARCH = /(?:Search|Grep|Glob|Finding|Looking)\s+(?:for\s+|in\s+)?["']?(.+?)["']?$/i;
const RE_NAV = /(?:browser_navigate|Navigat(?:e|ing|ed))\s+(?:to\s+)?["']?(https?:\/\/[^\s"']+)["']?/i;
const RE_CMD = /(?:Running|Executing|Run)\s+(?:command:?\s+)?[`"'](.+?)[`"']/i;

export async function POST(req: NextRequest) {
  const { agentId, input, extraFields } = await req.json();

  const agent = agents.find((a) => a.id === agentId);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  // Agent prompt files: inside dashboard/.claude/agents/
  const agentsRoot = process.env.AGENTS_ROOT || path.resolve(process.cwd(), "..");
  const promptFile = path.join(process.cwd(), agent.promptFile);

  // Working directory: from agent's extraFields.projectPath, then DEFAULT_PROJECT_PATH, then agentsRoot
  const agentProjectPath = (extraFields as Record<string, string>)?.projectPath;
  const workDir = agentProjectPath
    ? path.resolve(agentProjectPath)
    : process.env.DEFAULT_PROJECT_PATH || agentsRoot;

  // Build the claude command — inject context based on agent type
  let extraContext = "";

  // agents-data output directory for this agent
  const agentsDataRoot = path.join(agentsRoot, "agents-data");
  const agentOutputDir = agent.outputFolder
    ? path.join(agentsDataRoot, agent.outputFolder)
    : null;

  const manualOutputPath = agentOutputDir
    ? path.join(agentOutputDir, "manual_output.json")
    : path.join(workDir, "manual_output.json");

  if (agentId === "manual") {
    const fields = extraFields as Record<string, string> | undefined;
    const manualQaCasesPath = path.join(agentsDataRoot, "manual-qa-agent", "cases.json");
    if (fields?.casesJsonFile) {
      extraContext += `\n\nIMPORTANT: A cases JSON file has been provided instead of Qase.io. Read test cases from this file: "${fields.casesJsonFile}"\nDo NOT call Qase.io API. Extract case_id, title, steps, and expected results from the JSON file and use them as input for your recon work.`;
    } else {
      extraContext += `\n\nAuto-detect: If no WSP ID or suite_id was provided, check if Manual QA agent's cases.json exists at: ${manualQaCasesPath}\nIf it exists, read test cases from it (same as Cases JSON File input). Do NOT call Qase.io API in that case.`;
    }
    const helpScreensDir = path.join(agentsRoot, "agents-help-data", "screenshots");
    extraContext += `\n\nWhen working with cases from Manual QA's cases.json, also check for page screenshots in: ${helpScreensDir}\nIf screenshot files exist there (.png, .jpg, .webp), VIEW them — they show the actual page elements that the test cases refer to and will help you find the correct selectors.`;
    extraContext += `\n\nSave the generated manual_output.json file at: ${manualOutputPath}\nCreate the directory "${agentOutputDir}" if it does not exist.`;
  } else if (agentId === "write-test" || agentId === "full-flow") {
    const manualQaCasesPath = path.join(agentsDataRoot, "manual-qa-agent", "cases.json");

    // Default source: manual-qa-agent/cases.json
    // Only use qase-io-agent/manual_output.json if user explicitly provides a different JSON path
    const fields = extraFields as Record<string, string> | undefined;
    const hasCustomJson = fields?.casesJsonFile?.trim();

    if (hasCustomJson) {
      extraContext += `\n\nRead test cases from the provided JSON file: ${fields!.casesJsonFile}`;
    } else {
      extraContext += `\n\nRead test cases from: ${manualQaCasesPath}`;
      extraContext += `\nThis is the PRIMARY and ONLY source for test cases. Do NOT look for other JSON files.`;
    }

    if (agentId === "full-flow" && agentOutputDir) {
      extraContext += `\nSave the generated manual_output.json at: ${manualOutputPath}\nCreate the directory "${agentOutputDir}" if it does not exist.`;
    }

    // Add file path instructions from extra fields
    if (fields) {
      const filePaths: string[] = [];
      if (fields.testFile) filePaths.push(`- Test spec file (EXISTING): ${path.join(workDir, fields.testFile)} — ADD the new test code to this file`);
      if (fields.locatorsFile) filePaths.push(`- Locators file (EXISTING): ${path.join(workDir, fields.locatorsFile)} — ADD new selectors/locators to this file`);
      if (fields.pageFile) filePaths.push(`- Page object file (EXISTING): ${path.join(workDir, fields.pageFile)} — ADD new methods to this file`);
      if (filePaths.length > 0) {
        extraContext += `\n\nIMPORTANT — These files ALREADY EXIST. First READ each file to understand the existing code, then ADD your new code to them. Do NOT overwrite existing content:\n${filePaths.join("\n")}`;
      }
    }
  } else if (agentId === "fix-test") {
    const qaseOutputDir = path.join(agentsDataRoot, "qase-io-agent");
    extraContext += `\n\nIf manual_output.json is needed, it is located at: ${path.join(qaseOutputDir, "manual_output.json")}`;
  } else if (agentId === "testbot") {
    const fields = extraFields as Record<string, string> | undefined;
    if (fields) {
      if (fields.pageUrl) extraContext += `\n\nPage URL to analyze: ${fields.pageUrl}`;
      if (fields.screenshotPath) extraContext += `\nScreenshot file to view: ${fields.screenshotPath}`;
      if (fields.htmlPath) extraContext += `\nHTML file to read: ${fields.htmlPath}`;
    }
    const helpDataDir = path.join(agentsRoot, "agents-help-data");
    extraContext += `\n\nAuto-detect helper data directory: ${helpDataDir}`;
    extraContext += `\nScreenshots folder: ${path.join(helpDataDir, "screenshots")}`;
    extraContext += `\nHTML sources folder: ${path.join(helpDataDir, "html-sources")}`;
    extraContext += `\nCheck these folders for pre-loaded screenshots and HTML files. Use ALL files found as additional input context.`;
    extraContext += `\n\nSave the generated cases.json file at: ${path.join(agentOutputDir!, "cases.json")}\nCreate the directory "${agentOutputDir}" if it does not exist.`;
  }

  const prompt = `Read the agent instructions from "${promptFile}" and execute the task with this input: ${input}

CRITICAL PROJECT CONTEXT:
- The test project root is: "${workDir}"
- ALL files (tests, locators, pages, data, config) MUST be created/edited inside "${workDir}"
- NEVER create files outside of "${workDir}"
- Use ABSOLUTE paths based on "${workDir}" when reading/writing files
- Example: "${path.join(workDir, "tests", "example.spec.ts")}"
${extraContext}`;

  const encoder = new TextEncoder();
  let phaseIndex = 0;

  const stream = new ReadableStream({
    start(controller) {
      function send(data: object) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      send({
        type: "phase",
        phase: 0,
        message: `Initializing ${agent.name}...`,
      });

      // Spawn claude CLI process — pipe prompt via stdin
      // --allowedTools grants permissions, --mcp-config enables Playwright MCP
      const mcpConfigPath = path.join(process.cwd(), "mcp-config.json");
      const normalizedWorkDir = path.normalize(workDir);
      const proc = spawn("claude", [
        "-p",
        "--verbose",
        "--allowedTools",
        "Bash,Read,Write,Edit,Glob,Grep,WebFetch,Agent,mcp__playwright__*",
        "--mcp-config",
        `"${mcpConfigPath}"`,
      ], {
        cwd: normalizedWorkDir,
        shell: true,
        env: {
          ...process.env,
          QASE_TOKEN: process.env.QASE_TOKEN || "",
          SPORT_USERNAME: process.env.SPORT_USERNAME || "",
          SPORT_USER_PASSWORD: process.env.SPORT_USER_PASSWORD || "",
          SPORT_USERNAME_1: process.env.SPORT_USERNAME_1 || "",
          SPORT_PASSWORD_1: process.env.SPORT_PASSWORD_1 || "",
          SPORT_NEW_PASSWORD: process.env.SPORT_NEW_PASSWORD || "",
          SPORT_NEW_USERNAME: process.env.SPORT_NEW_USERNAME || "",
        },
      });

      // Write prompt to stdin and close it
      proc.stdin.write(prompt);
      proc.stdin.end();

      let outputBuffer = "";

      proc.stdout.on("data", (data: Buffer) => {
        const text = data.toString();
        outputBuffer += text;

        // Split by lines and send each
        const lines = text.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          send({ type: "output", message: trimmed });

          // Detect thinking steps using pre-compiled regex patterns
          const readMatch = trimmed.match(RE_READ);
          if (readMatch) {
            send({ type: "thinking", action: "read", target: readMatch[1] });
          }
          const writeMatch = trimmed.match(RE_WRITE);
          if (writeMatch) {
            send({ type: "thinking", action: "write", target: writeMatch[1] });
            send({ type: "file_change", path: writeMatch[1], action: "created" });
          }
          const editMatch = trimmed.match(RE_EDIT);
          if (editMatch) {
            send({ type: "thinking", action: "edit", target: editMatch[1] });
            send({ type: "file_change", path: editMatch[1], action: "modified" });
          }
          const searchMatch = trimmed.match(RE_SEARCH);
          if (searchMatch) {
            send({ type: "thinking", action: "search", target: searchMatch[1] });
          }
          const navMatch = trimmed.match(RE_NAV);
          if (navMatch) {
            send({ type: "thinking", action: "navigate", target: navMatch[1] });
          }
          const cmdMatch = trimmed.match(RE_CMD);
          if (cmdMatch) {
            send({ type: "thinking", action: "command", target: cmdMatch[1] });
          }

          // Try to detect phase transitions based on output keywords
          const phaseKeywords = agent.phases.map((p) => p.toLowerCase());
          for (let i = phaseIndex + 1; i < phaseKeywords.length; i++) {
            const keywords = phaseKeywords[i].split(/\s+/);
            const matchCount = keywords.filter((kw) =>
              trimmed.toLowerCase().includes(kw)
            ).length;
            if (matchCount >= Math.ceil(keywords.length * 0.5)) {
              phaseIndex = i;
              send({
                type: "phase",
                phase: i,
                message: agent.phases[i],
              });
              break;
            }
          }
        }
      });

      proc.stderr.on("data", (data: Buffer) => {
        const text = data.toString().trim();
        if (text) {
          send({ type: "output", message: text });
        }
      });

      proc.on("close", (code) => {
        if (code === 0) {
          send({ type: "complete", message: "Agent finished" });
        } else {
          send({
            type: "error",
            message: `Agent process exited with code ${code}`,
          });
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      proc.on("error", (err) => {
        send({ type: "error", message: `Failed to start: ${err.message}` });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        proc.kill("SIGTERM");
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
