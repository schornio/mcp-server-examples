import { runKlimaaktivFoerderungen } from "./examples/klimaaktiv-foerderungen.ts";
import { runLinzInnoHpMCP } from "./examples/linz-inno-hp.ts";

const mcps = new Map([
  ["linz-inno-hp", runLinzInnoHpMCP],
  ["klimaaktiv-foerderungen", runKlimaaktivFoerderungen],
]);

async function main() {
  const [_bin, _file, ...args] = process.argv;

  for (const arg of args) {
    const runMCP = mcps.get(arg);
    if (runMCP) {
      await runMCP();
    } else {
      console.error(`MCP "${arg}" not found`);
    }
  }
}

main().catch(console.error);
