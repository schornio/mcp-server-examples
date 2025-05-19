import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createDocument } from "domino";
import TurndownService from "turndown";
import { XMLParser } from "fast-xml-parser";

export const MCP_SERVER_NAME = "Firmenbuch";
export const MCP_SERVER_VERSION = "1.0.0";

type SingleOrArray<T> = T | T[];

type SOAPResponse<T> = {
  Envelope: {
    Body: T;
  };
};

type FirmenbuchAuszugSharedAttributes = {
  "@_AUFRECHT": "true" | "false";
  "@_VNR": string;
};

type FirmenbuchAuszugV2Body = {
  AUSZUG_V2_RESPONSE: {
    "@_ABFRAGEZEITPUNKT": string;
    "@_FNR": string;
    "@_PRUEFSUMME": string;
    "@_STICHTAG": string;
    "@_UMFANG": string;
    FIRMA: {
      FI_DKZ02: {
        BEZEICHNUNG: string;
      };
      FI_DKZ03?: {
        STAAT: string;
        PLZ: number;
        ORT: string;
        ZUSTELLBAR: boolean;
      } & ({ STELLE: string } | { STRASSE: string; HAUSNUMMER: number });
      FI_DKZ05?: {
        TEXT: string;
      };
      FI_DKZ06?: {
        ORTNR: { CODE: number; TEXT: string };
        SITZ: string;
      };
      FI_DKZ07: {
        RECHTSFORM: { CODE: string; TEXT: string };
      };
    } & {
      [key: `FI_${string}`]: FirmenbuchAuszugSharedAttributes;
    };
    FUN: SingleOrArray<{
      "@_FKEN": string;
      "@_FKENTEXT": string;
      "@_PNR": string;
      FU_DKZ10: FirmenbuchAuszugSharedAttributes & {
        DATVON: number;
        VART: { CODE: string; TEXT: string };
        TEXT: SingleOrArray<string>;
      };
    }>;
    PER: SingleOrArray<{
      PE_DKZ02: FirmenbuchAuszugSharedAttributes & {
        TITELVOR?: string;
        VORNAME: string;
        NACHNAME: string;
        NAME_FORMATIERT: string;
        GEBURTSDATUM: number;
      };
      "@_PNR": string;
    }>;
    VOLLZ: {
      VNR: number;
      VOLLZUGSDATUM: string;
      HG: { CODE: number; TEXT: string };
      AZ: string;
      ANTRAGSTEXT: string;
      EINGELANGTAM: string;
    }[];
    EUID: { ZNR: number; EUID: string };
  };
};

type FirmenbuchSucheBody = {
  SUCHEFIRMARESPONSE: {
    ERGEBNIS?: SingleOrArray<{
      FNR: string;
      STATUS: string;
      NAME: SingleOrArray<string>;
      SITZ: string;
      RECHTSFORM: { CODE: number; TEXT: string };
      RECHTSEIGENSCHAFT: string;
      GERICHT: { CODE: number; TEXT: string };
    }>;
    "@_REQUEST_EXAKTESUCHE": string;
    "@_REQUEST_FIRMENWORTLAUT": string;
    "@_REQUEST_GERICHT": string;
    "@_REQUEST_ORTNR": string;
    "@_REQUEST_RECHTSEIGENSCHAFT": string;
    "@_REQUEST_RECHTSFORM": string;
    "@_REQUEST_SUCHBEREICH": string;
  };
};

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toArray<T>(data?: SingleOrArray<T>): T[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [data];
}

function numberToDateString(dateNumber: number) {
  const day = (dateNumber % 100).toString().padStart(2, "0");
  const month = (Math.floor(dateNumber / 100) % 100)
    .toString()
    .padStart(2, "0");
  const year = Math.floor(dateNumber / 10_000);

  return `${year}-${month}-${day}`;
}

function wrapInSOAPEnvelope(content: string, xmlns: string) {
  let envelope = `<soap:Envelope xmlns="${xmlns}" xmlns:soap="http://www.w3.org/2003/05/soap-envelope">`;
  envelope += "<soap:Header/>";
  envelope += "<soap:Body>";
  envelope += content;
  envelope += "</soap:Body>";
  envelope += "</soap:Envelope>";
  return envelope;
}

function createFirmenbuchAuszugRequest({
  corporateRegisterNumber,
  cutoffDate,
}: {
  corporateRegisterNumber: string;
  cutoffDate: Date;
}) {
  let request = "<AUSZUG_V2_REQUEST>";
  request += `<FNR>${corporateRegisterNumber}</FNR>`;
  request += `<STICHTAG>${toDateString(cutoffDate)}</STICHTAG>`;
  request += "<UMFANG>Kurzinformation</UMFANG>";
  request += "</AUSZUG_V2_REQUEST>";
  return [
    request,
    "ns://firmenbuch.justiz.gv.at/Abfrage/v2/AuszugRequest",
  ] as const;
}

function mapFirmenbuchAuszugResult(resultBody: FirmenbuchAuszugV2Body) {
  const result = resultBody.AUSZUG_V2_RESPONSE;
  const functions = toArray(result.FUN);
  const business = {
    address: result.FIRMA.FI_DKZ03
      ? {
          city: result.FIRMA.FI_DKZ03.ORT,
          zipCode: result.FIRMA.FI_DKZ03.PLZ,
          ...("STRASSE" in result.FIRMA.FI_DKZ03
            ? {
                streetName: result.FIRMA.FI_DKZ03.STRASSE,
                streetNumber: result.FIRMA.FI_DKZ03.HAUSNUMMER,
              }
            : {
                streetName: result.FIRMA.FI_DKZ03.STELLE,
              }),
        }
      : undefined,
    description: result.FIRMA.FI_DKZ05?.TEXT,
    legalForm: result.FIRMA.FI_DKZ07.RECHTSFORM.TEXT,
    name: result.FIRMA.FI_DKZ02.BEZEICHNUNG,
    persons: toArray(result.PER).map((person) => ({
      birthday: numberToDateString(person.PE_DKZ02.GEBURTSDATUM),
      functions: functions
        .filter(($) => $["@_PNR"] === person["@_PNR"])
        .map(($) => ({
          name: $["@_FKENTEXT"],
          note: toArray($.FU_DKZ10.TEXT).join(" "),
        })),
      name: person.PE_DKZ02.NAME_FORMATIERT,
    })),
    placeOfBusiness: result.FIRMA.FI_DKZ06?.SITZ,
  };
  return business;
}

function createFirmenbuchSearchRequest({
  searchQuery,
}: {
  searchQuery: string;
}) {
  let request = "<SUCHEFIRMAREQUEST>";
  request += `<FIRMENWORTLAUT>${searchQuery}</FIRMENWORTLAUT>`;
  request += "<EXAKTESUCHE>false</EXAKTESUCHE>";
  request += "<SUCHBEREICH>1</SUCHBEREICH>";
  request += "<GERICHT></GERICHT>";
  request += "<RECHTSFORM></RECHTSFORM>";
  request += "<RECHTSEIGENSCHAFT></RECHTSEIGENSCHAFT>";
  request += "<ORTNR></ORTNR>";
  request += "</SUCHEFIRMAREQUEST>";
  return [
    request,
    "ns://firmenbuch.justiz.gv.at/Abfrage/SucheFirmaRequest",
  ] as const;
}

function mapFirmenbuchSearchResult(resultBody: FirmenbuchSucheBody) {
  const result = toArray(resultBody.SUCHEFIRMARESPONSE.ERGEBNIS);
  return result.map(($) => ({
    court: $.GERICHT.TEXT,
    corporateRegisterNumber: $.FNR,
    legalForm: $.RECHTSFORM.TEXT,
    name: toArray($.NAME).join(" "),
    placeOfBusiness: $.SITZ,
    state: $.STATUS !== "" ? $.STATUS : undefined,
  }));
}

async function fetchFirmenbuch<T>({
  apiKey,
  request,
}: {
  apiKey: string;
  request: readonly [string, string];
}) {
  const response = await fetch(
    "https://justizonline.gv.at/jop/api/at.gv.justiz.fbw/ws",
    {
      body: wrapInSOAPEnvelope(...request),
      headers: {
        "Content-Type": "application/soap+xml;charset=UTF-8",
        "User-Agent": "firmenbuch-mcp-server",
        "X-API-KEY": apiKey,
      },
      method: "POST",
    }
  );
  const text = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  const data = parser.parse(text) as SOAPResponse<T>;

  return data.Envelope.Body;
}

export async function runFirmenbuch() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  });

  const apiKey = process.env.FIRMENBUCH_API_KEY ?? "";

  server.tool(
    "find_company",
    {
      name: z
        .string()
        .describe("Name or part of the name of the searched company"),
    },
    async ({ name }) => {
      const result = await fetchFirmenbuch<FirmenbuchSucheBody>({
        apiKey,
        request: createFirmenbuchSearchRequest({ searchQuery: name }),
      });

      return {
        content: [
          {
            text: JSON.stringify(mapFirmenbuchSearchResult(result)),
            type: "text",
          },
        ],
      };
    }
  );

  server.tool(
    "get_company_by_register_number",
    {
      corporateRegisterNumber: z
        .string()
        .describe(
          'Corporate register number. German "Firmenbuchnummer". Bunch of digits and one (lowercase) character at the end.'
        ),
    },
    async ({ corporateRegisterNumber }) => {
      const result = await fetchFirmenbuch<FirmenbuchAuszugV2Body>({
        apiKey,
        request: createFirmenbuchAuszugRequest({
          corporateRegisterNumber,
          cutoffDate: new Date(),
        }),
      });

      return {
        content: [
          {
            text: JSON.stringify(mapFirmenbuchAuszugResult(result)),
            type: "text",
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
