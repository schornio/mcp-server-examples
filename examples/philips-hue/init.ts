import { z } from "zod";
import { fetchHUE } from "./fetchHUE.ts";
import Color from "colorjs.io";

const discoverySchema = z.tuple([
  z.object({
    internalipaddress: z.string().ip(),
  }),
]);

const authorizeSchema = z.tuple([
  z.union([
    z.object({
      error: z.object({ description: z.string() }),
    }),
    z.object({
      success: z.object({ username: z.string() }),
    }),
  ]),
]);

const lightSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      metadata: z.object({ name: z.string() }),
    })
  ),
});

async function init() {
  console.log("Initializing Philips HUE...\n");

  const discoveryResponse = await fetch("https://discovery.meethue.com/");
  const discoveryBody = await discoveryResponse.json();

  const discovery = discoverySchema.safeParse(discoveryBody);
  if (discovery.error) {
    console.log("Malformed discovery response");
    console.log(discoveryBody);
    return;
  }

  const [{ internalipaddress: hueBridgeAddress }] = discovery.data;
  console.log(`Philips HUE Bridge discovered @ ${hueBridgeAddress}\n`);

  const authorizeBody = await fetchHUE(hueBridgeAddress, "/api", {
    body: { devicetype: "schornai_mcp_example" },
    method: "POST",
  });

  const authorize = authorizeSchema.safeParse(authorizeBody);
  if (authorize.error) {
    console.log("Malformed authorize response");
    console.log(authorizeBody);
    return;
  }

  if ("error" in authorize.data[0]) {
    console.log(`Error: ${authorize.data[0].error.description}`);
    return;
  }

  const apiKey = authorize.data[0].success.username;

  console.log(`Philips HUE API Key: ${apiKey}\n`);

  const lightsBody = await fetchHUE(
    hueBridgeAddress,
    "/clip/v2/resource/light",
    {
      apiKey,
      method: "GET",
    }
  );
  const lights = lightSchema.safeParse(lightsBody);
  if (lights.error) {
    console.log("Malformed lights response");
    console.log(lightsBody);
    return;
  }

  console.log("Lights:");
  for (const light of lights.data.data) {
    console.log(`${light.id} > ${light.metadata.name}`);
  }
}

init().catch(console.error);
