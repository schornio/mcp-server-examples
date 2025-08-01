import { Agent, fetch } from "undici";

export async function fetchHUE(
  hueBridgeAddress: string,
  path: string,
  options: { apiKey?: string } & (
    | {
        method: "POST" | "PUT";
        body: unknown;
      }
    | { method: "GET" }
  )
) {
  const result = await fetch(`https://${hueBridgeAddress}${path}`, {
    body:
      options.method === "POST" || options.method === "PUT"
        ? JSON.stringify(options.body)
        : undefined,
    dispatcher: new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    }),
    headers: {
      "Content-Type": "application/json",
      "hue-application-key": options.apiKey,
    },
    method: options.method,
  });
  return (await result.json()) as unknown;
}
