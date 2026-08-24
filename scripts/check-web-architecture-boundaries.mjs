import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(repoRoot, "apps/web");

const eslint = new ESLint({
  cwd: webRoot,
  overrideConfigFile: path.join(webRoot, "eslint.config.mjs"),
});

const blockedCases = [
  {
    name: "route cannot deep-import feature internals by alias",
    file: "src/app/example/page.tsx",
    source: 'import "@/features/verify-email/screens/verify-email-view";',
  },
  {
    name: "route cannot deep-import feature internals relatively",
    file: "src/app/example/page.tsx",
    source: 'import "../../features/verify-email/screens/verify-email-view";',
  },
  {
    name: "config cannot import core by alias",
    file: "src/features/example/config/example-config.ts",
    source: 'import "@/core/config/server-env";',
  },
  {
    name: "config cannot import core relatively",
    file: "src/features/example/config/example-config.ts",
    source: 'import "../../../core/config/server-env";',
  },
  {
    name: "ui cannot import controllers",
    file: "src/features/example/ui/example-view.tsx",
    source: 'import "../controllers/use-example-controller";',
  },
  {
    name: "screens cannot import api",
    file: "src/features/example/screens/example-screen.tsx",
    source: 'import "../api/example.api";',
  },
  {
    name: "controllers cannot import ui",
    file: "src/features/example/controllers/use-example-controller.ts",
    source: 'import "../ui/example-view";',
  },
  {
    name: "state cannot import screens",
    file: "src/features/example/state/example-store.ts",
    source: 'import "../screens/example-screen";',
  },
  {
    name: "model cannot import core infrastructure",
    file: "src/features/example/model/example-rule.ts",
    source: 'import "@/core/http/client";',
  },
  {
    name: "contracts cannot import api",
    file: "src/features/example/contracts/example-contract.ts",
    source: 'import "../api/example.api";',
  },
  {
    name: "api cannot import controllers",
    file: "src/features/example/api/example.api.ts",
    source: 'import "../controllers/use-example-controller";',
  },
  {
    name: "core cannot import features",
    file: "src/core/example/example.ts",
    source: 'import "@/features/verify-email";',
  },
  {
    name: "shared cannot import features",
    file: "src/shared/example/example.ts",
    source: 'import "@/features/verify-email";',
  },
  {
    name: "specific feature layer still preserves feature-to-app ban",
    file: "src/features/example/controllers/use-example-controller.ts",
    source: 'import "@/app/example/page";',
  },
  {
    name: "feature internals cannot use deep feature aliases",
    file: "src/features/example/controllers/use-example-controller.ts",
    source: 'import "@/features/example/api/example.api";',
  },
];

const allowedCases = [
  {
    name: "route may consume feature public contract",
    file: "src/app/example/page.tsx",
    source: 'import "@/features/verify-email";',
  },
  {
    name: "screen may compose controller and ui",
    file: "src/features/example/screens/example-screen.tsx",
    source: 'import "../controllers/use-example-controller";\nimport "../ui/example-view";',
  },
  {
    name: "controller may call api relatively",
    file: "src/features/example/controllers/use-example-controller.ts",
    source: 'import "../api/example.api";',
  },
  {
    name: "ui may depend on neutral contracts",
    file: "src/features/example/ui/example-view.tsx",
    source: 'import type { ExampleViewModel } from "../contracts/example-contract";',
  },
  {
    name: "api may depend on configured core HTTP client",
    file: "src/features/example/api/example.api.ts",
    source: 'import "@/core/http/client";',
  },
];

async function restrictedImportMessages(testCase) {
  const [result] = await eslint.lintText(`${testCase.source}\nexport const fixture = true;\n`, {
    filePath: path.join(webRoot, testCase.file),
  });

  return result.messages.filter((message) => message.ruleId === "no-restricted-imports");
}

const failures = [];

for (const testCase of blockedCases) {
  const messages = await restrictedImportMessages(testCase);
  if (messages.length === 0) {
    failures.push(`BLOCKED case was accepted: ${testCase.name}`);
  }
}

for (const testCase of allowedCases) {
  const messages = await restrictedImportMessages(testCase);
  if (messages.length > 0) {
    failures.push(
      `ALLOWED case was rejected: ${testCase.name}\n${messages
        .map((message) => `  - ${message.message}`)
        .join("\n")}`,
    );
  }
}

if (failures.length > 0) {
  console.error("Web architecture boundary regression check failed:\n");
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(
  `Web architecture boundary regression check passed (${blockedCases.length} blocked, ${allowedCases.length} allowed).`,
);
