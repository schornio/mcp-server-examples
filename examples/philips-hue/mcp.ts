import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Color from "colorjs.io";
import { z } from "zod";
import { fetchHUE } from "./fetchHUE.js";

type LightCommand = {
  color?: {
    xy: {
      x: number;
      y: number;
    };
  };
  dimming?: {
    // 1 - 100
    brightness: number;
  };
  on: { on: boolean };
};

export const MCP_SERVER_NAME = "Philips HUE";
export const MCP_SERVER_VERSION = "1.0.0";

function safeParseColor(colorName: string) {
  try {
    const color = new Color(colorName);
    const [xAbs, yAbs, zAbs] = color.xyz;
    const sum = xAbs + yAbs + zAbs;
    const x = xAbs / sum;
    const y = yAbs / sum;
    return { xy: { x, y } };
  } catch {
    return undefined;
  }
}

function createResponse(text: string) {
  return {
    content: [
      {
        text,
        type: "text" as const,
      },
    ],
  };
}

export async function runPhilipsHue() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  const hueBridgeAddress = process.env.PHILIPS_HUE_BRIDGE_ADDRESS ?? "";
  const apiKey = process.env.FIRMENBUCH_API_KEY ?? "";
  const lightIds = process.env.PHILIPS_HUE_LIGHT_IDS?.split(",") ?? [];

  server.tool(
    "set_light",
    {
      brightness: z.number().describe("0 means off, 100 means full brightness"),
      color: z
        .string()
        .describe(
          'Name of the color. Either a web color like "hotpink," "yellow," or "navy," or a HEX color like "#FF0A13."'
        ),
      number: z.number().describe("Number of the lightbulb. Starting at 1"),
    },
    async ({ color: colorName, brightness, number }) => {
      const color = safeParseColor(colorName);
      if (!color) {
        return createResponse(`Color "${colorName}" is not a valid color`);
      }

      const lightbulbId = lightIds[number - 1];
      if (!lightbulbId) {
        return createResponse(`Light number ${number} not found`);
      }

      try {
        await fetchHUE(
          hueBridgeAddress,
          `/clip/v2/resource/light/${lightbulbId}`,
          {
            apiKey,
            body: {
              color,
              dimming: { brightness: Math.max(1, Math.min(100, brightness)) },
              on: { on: brightness !== 0 },
            } satisfies LightCommand,
            method: "PUT",
          }
        );
        return createResponse("Success");
      } catch {
        return createResponse("Error talking to Philips HUE Bridge");
      }
    }
  );

  server.tool(
    "turn_off",
    {
      number: z.number().describe("Number of the lightbulb. Starting at 1"),
    },
    async ({ number }) => {
      const lightbulbId = lightIds[number - 1];
      if (!lightbulbId) {
        return createResponse(`Light number ${number} not found`);
      }

      try {
        await fetchHUE(
          hueBridgeAddress,
          `/clip/v2/resource/light/${lightbulbId}`,
          {
            apiKey,
            body: {
              on: { on: false },
            } satisfies LightCommand,
            method: "PUT",
          }
        );
        return createResponse("Success");
      } catch {
        return createResponse("Error talking to Philips HUE Bridge");
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
