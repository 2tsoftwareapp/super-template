import { spawn } from "node:child_process";

const [, , envVarName, defaultPort, command, ...args] = process.argv;

if (!envVarName || !defaultPort || !command) {
  console.error(
    "Usage: node scripts/run-with-port.mjs <ENV_VAR> <DEFAULT_PORT> <command> [args...]",
  );
  process.exit(1);
}

const port = process.env[envVarName] || defaultPort;

const child = spawn(command, [...args, "--port", port], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
