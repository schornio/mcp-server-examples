import { runFirmenbuch } from "./examples/firmenbuch.js";
import { runKlimaaktivFoerderungen } from "./examples/klimaaktiv-foerderungen.js";
import { runLinzInnoHpMCP } from "./examples/linz-inno-hp.js";
import { runPhilipsHue } from "./examples/philips-hue/mcp.js";

const mcps = new Map([
  ["linz-inno-hp", runLinzInnoHpMCP],
  ["klimaaktiv-foerderungen", runKlimaaktivFoerderungen],
  ["firmenbuch", runFirmenbuch],
  ["philips-hue", runPhilipsHue],
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
