import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createDocument } from "domino";
import TurndownService from "turndown";

export const MCP_SERVER_NAME = "klimaaktiv Förderdungen";
export const MCP_SERVER_VERSION = "1.0.0";

const TYPE_OF_FUNDING = new Map([
  ["buildings_and_building_technology", 41],
  ["energy_savings_and_energy_efficiency", 33],
  ["energy_production_and_distribution", 44],
  ["mobility", 35],
  ["concepts_and_consulting", 40],
]);

const TARGET_AUDIENCE = new Map([
  ["private", 19],
  ["company", 20],
  ["municipality", 28],
  ["clubs_and_associations", 30],
]);

const STATE = new Map([
  ["austria", 46],
  ["burgenland", 21],
  ["carinthia", 17],
  ["lower_austria", 22],
  ["upper_austria", 23],
  ["salzburg", 24],
  ["styria", 25],
  ["tyrol", 26],
  ["vorarlberg", 27],
  ["vienna", 16],
]);

async function fetchFundings(
  fundingType?: number,
  targetAudience?: number,
  state?: number,
  pageNumber = 1,
  pageSize = 5
) {
  const url = new URL("https://www.klimaaktiv.at/foerderungen");

  if (fundingType) {
    url.searchParams.set("fundingType", fundingType.toString());
  }

  if (targetAudience) {
    url.searchParams.set("stakeholder", targetAudience.toString());
  }

  if (state) {
    url.searchParams.set("federalstate", state.toString());
  }

  const response = await fetch(url);
  const html = await response.text();
  const document = createDocument(html);

  const items = document.querySelectorAll(
    "#accordion-fundings .accordion-item"
  );

  const turndownService = new TurndownService();

  const resultItems: string[] = [];

  for (const element of items) {
    let resultItem = "# Förderung: ";

    const heading = element.querySelector("h2 button");
    resultItem += heading?.innerHTML.trim();

    const body = element.querySelector(".accordion-body")?.innerHTML;
    if (body) {
      const markdown = turndownService.turndown(body);
      resultItem += "\n\n";
      resultItem += markdown;
    }
    resultItems.push(resultItem);
  }

  const result = resultItems.join("\n\n---\n\n");
  return result;
}

export async function runKlimaaktivFoerderungen() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  server.tool(
    "find_funding",
    {
      page: z.number().describe("First page is number 1").optional(),
      fundingType: z
        .string()
        .optional()
        .describe(
          `Possible values: ${Array.from(TYPE_OF_FUNDING.keys()).join(", ")}`
        ),
      targetAudience: z
        .string()
        .optional()
        .describe(
          `Possible values: ${Array.from(TARGET_AUDIENCE.keys()).join(", ")}`
        ),
      state: z
        .string()
        .optional()
        .describe(`Possible values: ${Array.from(STATE.keys()).join(", ")}`),
    },
    async ({
      page: pageInput,
      fundingType: fundingTypeInput,
      targetAudience: targetAudienceInput,
      state: stateInput,
    }) => {
      const page =
        pageInput && Number.isInteger(pageInput) && pageInput > 0
          ? pageInput
          : 1;
      const fundingType = fundingTypeInput
        ? TYPE_OF_FUNDING.get(fundingTypeInput)
        : undefined;
      const targetAudience = targetAudienceInput
        ? TARGET_AUDIENCE.get(targetAudienceInput)
        : undefined;
      const state = stateInput ? STATE.get(stateInput) : undefined;

      const text = await fetchFundings(
        fundingType,
        targetAudience,
        state,
        page
      );

      return {
        content: [
          {
            text,
            type: "text",
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
