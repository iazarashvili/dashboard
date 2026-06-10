export type AgentId = "manual" | "write-test" | "fix-test" | "full-flow" | "testbot";

export type AgentStatus = "idle" | "running" | "completed" | "error";

export interface ExtraField {
  key: string;
  label: string;
  placeholder: string;
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  color: string;
  promptFile: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputOptional?: boolean;
  extraFields?: ExtraField[];
  phases: string[];
  /** Folder name inside agents-data/ where generated files are saved */
  outputFolder?: string;
}

export const agents: AgentConfig[] = [
  {
    id: "manual",
    name: "Qase IO Agent",
    description:
      "Qase.io-dan ან JSON ფაილიდან ქეისების წამოღება. manual_output.json ის გენერირება",
    icon: "Search",
    color: "emerald",
    promptFile: ".claude/agents/manual.md",
    outputFolder: "qase-io-agent",
    inputLabel: "WSP ID / Suite ID",
    inputPlaceholder: "WSP-2314 or suite_id=123 (ცარიელი თუ JSON ფაილს იყენებ)",
    inputOptional: true,
    extraFields: [
      {
        key: "casesJsonFile",
        label: "Cases JSON File",
        placeholder: "C:\\path\\to\\cases.json",
      },
    ],
    phases: [
      "Read Cases Source",
      "Site Authorization",
      "Selector Discovery",
      "API Endpoint Discovery",
      "Georgian Text Capture",
      "Generate manual_output.json",
    ],
  },
  {
    id: "write-test",
    name: "Write Test Agent",
    description:
      "cases.json-ის მიხედვით Playwright ტესტის კოდის გენერაცია (ავტომატურად კითხულობს manual-qa-agent/cases.json-ს)",
    icon: "FileCode",
    color: "blue",
    promptFile: ".claude/agents/write-test.md",
    inputLabel: "WSP ID(s) or additional instructions",
    inputPlaceholder: "WSP-2314 or just press Run",
    inputOptional: true,
    extraFields: [
      {
        key: "casesJsonFile",
        label: "Cases JSON File (optional)",
        placeholder: "ცარიელი = manual-qa-agent/cases.json ავტომატურად",
      },
      {
        key: "projectPath",
        label: "Project Path",
        placeholder: "C:\\iLoOoo\\your-playwright-project",
      },
      {
        key: "testFile",
        label: "Test File",
        placeholder: "tests/pre-match/timeFilter.spec.ts",
      },
      {
        key: "locatorsFile",
        label: "Locators File",
        placeholder: "locators/pre-match/timeFilterLocators.ts",
      },
      {
        key: "pageFile",
        label: "Page Object File",
        placeholder: "pages/pre-match/timeFilterPage.ts",
      },
    ],
    phases: [
      "Read manual_output.json",
      "Check Existing Selectors",
      "Create Locators",
      "Create Page Methods",
      "Write Test Spec",
    ],
  },
  {
    id: "fix-test",
    name: "Fix Test Agent",
    description:
      "წარუმატებელი ტესტების ანალიზი და გასწორება - სელექტორები, გვერდები, ტესტები",
    icon: "Wrench",
    color: "amber",
    promptFile: ".claude/agents/fix-test.md",
    inputLabel: "WSP ID / Spec File / Error Output",
    inputPlaceholder: "WSP-2314 or tests/pre-match/games.spec.ts",
    phases: [
      "Parse Failures",
      "Read & Understand",
      "Diagnose",
      "Fix",
      "Verify",
    ],
  },
  {
    id: "full-flow",
    name: "Full Flow Agent",
    description:
      "სრული ფლოუ - Qase.io ქეისის გენერირება Playwright ტესტის კოდის გენერაცია",
    icon: "Workflow",
    color: "purple",
    promptFile: ".claude/agents/full-flow.md",
    outputFolder: "full-flow-agent",
    inputLabel: "WSP ID(s)",
    inputPlaceholder: "WSP-2314, WSP-2315",
    extraFields: [
      {
        key: "projectPath",
        label: "Project Path",
        placeholder: "C:\\iLoOoo\\your-playwright-project",
      },
    ],
    phases: [
      "Stage 1: Manual Recon",
      "Fetch Qase Case",
      "Selector Discovery",
      "Generate manual_output.json",
      "Stage 2: Write Test",
      "Create Locators & Pages",
      "Write Test Spec",
    ],
  },
  {
    id: "testbot",
    name: "Manual QA",
    description:
      "გვერდის ანალიზი (Screenshot + HTML + URL) — ოპტიმიზირებული ტესტ ქეისების გენერაცია (EP, BVA, State, Error Guessing)",
    icon: "ClipboardCheck",
    color: "cyan",
    promptFile: ".claude/agents/testbot.md",
    outputFolder: "manual-qa-agent",
    inputLabel: "Feature Name",
    inputPlaceholder: "Registration Page, Login Modal...",
    inputOptional: false,
    extraFields: [
      {
        key: "pageUrl",
        label: "Page URL",
        placeholder: "https://pre-prod.crocobet.com/registration",
      },
      {
        key: "screenshotPath",
        label: "Screenshot Path",
        placeholder: "C:\\Screenshots\\registration.png",
      },
      {
        key: "htmlPath",
        label: "HTML File Path",
        placeholder: "C:\\Screenshots\\registration.html",
      },
    ],
    phases: [
      "Analyze & Classify Page",
      "Identify Content Type",
      "Apply Test Design Techniques",
      "Generate Happy Paths",
      "Generate Functional & Edge Cases",
      "Generate UI/UX & Responsive Cases",
      "Generate Security & Localization Cases",
      "Optimize & Merge Cases",
      "Create cases.json",
    ],
  },
];
