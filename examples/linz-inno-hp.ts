import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export const MCP_SERVER_NAME = "Innovationshauptplatz Linz";
export const MCP_SERVER_VERSION = "1.0.0";

export async function runLinzInnoHpMCP() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  const STATUS = new Map([
    ["submitted", "c4b79ddc-99e4-4643-8c7e-d77a68b78863"],
    ["threshold_reached", "27a5c84b-44c3-4382-af89-ec60ae2576ab"],
    ["expired", "9d2bb2e7-d51d-4134-9832-afdb66104b77"],
    ["answered", "2f0fc4b0-5ce6-4f79-aaac-908dd87ae9da"],
    ["inadmissible", "31db10fb-c128-4e7c-a44a-c2a1e5f58bd4"],
  ]);

  const SORT = new Map([
    ["most_reactions", "popular"],
    ["most_discussed", "comments_count"],
    ["popular", "trending"],
    ["random", "random"],
    ["newest", "new"],
    ["oldest", "-new"],
  ]);

  server.tool(
    "find_proposal",
    {
      page: z.number().describe("First page is number 1").optional(),
      status: z
        .string()
        .optional()
        .describe(`Possible values: ${Array.from(STATUS.keys()).join(", ")}`),
      sort: z
        .string()
        .optional()
        .describe(`Possible values: ${Array.from(SORT.keys()).join(", ")}`),
    },
    async ({ page: pageInput, status: statusInput, sort: sortInput }) => {
      const page =
        pageInput && Number.isInteger(pageInput) && pageInput > 0
          ? pageInput
          : 1;
      const status = statusInput ? STATUS.get(statusInput) : undefined;
      const sort = sortInput ? SORT.get(sortInput) : undefined;

      const url = new URL("https://partizipation.linz.at/web_api/v1/ideas");

      url.searchParams.set("page[number]", page.toString());
      url.searchParams.set("page[size]", "10");

      if (status) {
        url.searchParams.set("idea_status", status);
      }

      if (sort) {
        url.searchParams.set("sort", sort);
      }

      // Damit der Output der selbe ist wie online, muss ich noch verstehen
      url.searchParams.set("phase", "060ee331-38c9-4683-a493-6cd00093e617");

      const request = await fetch(url);
      const { data } = await request.json();

      const simplifiedData = data.map((idea: any) => ({
        id: idea.id,
        title: idea.attributes.title_multiloc["de-DE"],
        description: idea.attributes.body_multiloc["de-DE"],
        likes_count: idea.attributes.likes_count,
        dislikes_count: idea.attributes.dislikes_count,
        comments_count: idea.attributes.comments_count,
        official_feedbacks_count: idea.attributes.official_feedbacks_count,
        followers_count: idea.attributes.followers_count,
        location_point_geojson: idea.attributes.location_point_geojson,
        location_description: idea.attributes.location_description,
        created_at: idea.attributes.created_at,
        updated_at: idea.attributes.updated_at,
        submitted_at: idea.attributes.submitted_at,
        published_at: idea.attributes.published_at,
        budget: idea.attributes.budget,
        proposed_budget: idea.attributes.proposed_budget,
        author_name: idea.attributes.author_name,
      }));

      return {
        content: [
          {
            text: JSON.stringify(simplifiedData),
            type: "text",
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
