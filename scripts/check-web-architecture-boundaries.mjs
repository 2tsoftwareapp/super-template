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
    file: "src/app/[locale]/verify-email/page.tsx",
    source: 'import "@/features/identity-web/verify-email/screens/verify-email-view";',
  },
  {
    name: "route cannot deep-import feature internals relatively",
    file: "src/app/[locale]/verify-email/page.tsx",
    source: 'import "../../../features/identity-web/verify-email/screens/verify-email-view";',
  },
  {
    name: "config cannot import core by alias",
    file: "src/features/identity-web/verify-email/config/verify-email-config.ts",
    source: 'import "@/core/config/server-env";',
  },
  {
    name: "config cannot import core relatively",
    file: "src/features/identity-web/verify-email/config/verify-email-config.ts",
    source: 'import "../../../../core/config/server-env";',
  },
  {
    name: "ui cannot import controllers",
    file: "src/features/identity-web/verify-email/ui/verify-email-content.tsx",
    source: 'import "../controllers/use-verify-email-controller";',
  },
  {
    name: "screens cannot import api",
    file: "src/features/identity-web/verify-email/screens/verify-email-view.tsx",
    source: 'import "../api/verify-email.api";',
  },
  {
    name: "controllers cannot import ui",
    file: "src/features/identity-web/verify-email/controllers/use-verify-email-controller.ts",
    source: 'import "../ui/verify-email-content";',
  },
  {
    name: "state cannot import screens",
    file: "src/features/identity-web/verify-email/contracts/verify-email-view-model.ts",
    source: 'import "../screens/verify-email-view";',
  },
  {
    name: "model cannot import core infrastructure",
    file: "src/features/identity-web/verify-email/contracts/verify-email-view-model.ts",
    source: 'import "@/core/http/client";',
  },
  {
    name: "contracts cannot import api",
    file: "src/features/identity-web/verify-email/contracts/verify-email-view-model.ts",
    source: 'import "../api/verify-email.api";',
  },
  {
    name: "api cannot import controllers",
    file: "src/features/identity-web/verify-email/api/verify-email.api.ts",
    source: 'import "../controllers/use-verify-email-controller";',
  },
  {
    name: "core cannot import features",
    file: "src/core/http/client.ts",
    source: 'import "@/features/identity-web";',
  },
  {
    name: "shared cannot import features",
    file: "src/shared/utils/index.ts",
    source: 'import "@/features/identity-web";',
  },
  {
    name: "specific feature layer still preserves feature-to-app ban",
    file: "src/features/identity-web/verify-email/controllers/use-verify-email-controller.ts",
    source: 'import "@/app/[locale]/verify-email/page";',
  },
  {
    name: "feature internals cannot use deep feature aliases",
    file: "src/features/identity-web/verify-email/controllers/use-verify-email-controller.ts",
    source: 'import "@/features/identity-web/verify-email/api/verify-email.api";',
  },
];

const allowedCases = [
  {
    name: "route may consume feature public contract",
    file: "src/app/[locale]/verify-email/page.tsx",
    source: 'import "@/features/identity-web";',
  },
  {
    name: "screen may compose controller and ui",
    file: "src/features/identity-web/verify-email/screens/verify-email-view.tsx",
    source: 'import "../controllers/use-verify-email-controller";\nimport "../ui/verify-email-content";',
  },
  {
    name: "controller may call api relatively",
    file: "src/features/identity-web/verify-email/controllers/use-verify-email-controller.ts",
    source: 'import "../api/verify-email.api";',
  },
  {
    name: "ui may depend on neutral contracts",
    file: "src/features/identity-web/verify-email/ui/verify-email-content.tsx",
    source: 'import type { VerifyEmailViewModel } from "../contracts/verify-email-view-model";',
  },
  {
    name: "api may depend on configured core HTTP client",
    file: "src/features/identity-web/verify-email/api/verify-email.api.ts",
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
