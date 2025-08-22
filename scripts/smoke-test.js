import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const tempDir = path.join(os.tmpdir(), "fiexpress-test-project");

function cleanup() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function run() {
  cleanup();
  fs.mkdirSync(tempDir, { recursive: true });

  const cliPath = path.resolve(process.cwd(), "bin", "create-fiexpress.js");

  const flags = [
    "--name",
    tempDir,
    "--db",
    "postgres",
    "--orm",
    "sequelize",
    "--dotenv",
    "yes",
    "--jwt",
    "yes",
    "--casl",
    "yes",
    "--user",
    "yes",
    "--roles",
    "yes",
    "--ts",
    "yes",
  ];

  const child = spawn("node", [cliPath, ...flags], {
    stdio: "inherit",
    cwd: path.dirname(tempDir), // Run from parent of tempDir
  });

  child.on("close", (code) => {
    if (code !== 0) {
      console.error("Smoke test failed: CLI process exited with code", code);
      cleanup();
      process.exit(1);
    }

    console.log("CLI process finished. Verifying generated project...");

    const pkgPath = path.join(tempDir, "package.json");
    if (!fs.existsSync(pkgPath)) {
      console.error("Smoke test failed: package.json not found");
      cleanup();
      process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg.bin || (pkg.dependencies && pkg.dependencies.degit)) {
      console.error("Smoke test failed: package.json not sanitized");
      cleanup();
      process.exit(1);
    }

    const tsconfigPath = path.join(tempDir, "tsconfig.json");
    if (!fs.existsSync(tsconfigPath)) {
      console.error("Smoke test failed: tsconfig.json not found");
      cleanup();
      process.exit(1);
    }

    console.log("Smoke test passed!");
    cleanup();
  });
}

run();
