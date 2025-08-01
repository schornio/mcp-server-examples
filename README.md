# Beispiel MCP Server

Mit öffentlich verfügbaren Daten.

## Linz Innovationshaupplatz

Quelle: [https://partizipation.linz.at/de-DE/projects/proposals](https://partizipation.linz.at/de-DE/projects/proposals)

### Ausführen

```bash
npx @schornio/mcp-server-examples@latest linz-inno-hp
```

### schorn.ai in a Box Konfiguration

```json
{
    "command": "npx",
    "args": [
        "@schornio/mcp-server-examples@latest",
        "linz-inno-hp"
    ]
}
```

## klimaaktiv Förderungen

Quelle: [https://www.klimaaktiv.at/foerderungen](https://www.klimaaktiv.at/foerderungen)

### Ausführen

```bash
npx @schornio/mcp-server-examples@latest klimaaktiv-foerderungen
```

### schorn.ai in a Box Konfiguration

```json
{
    "command": "npx",
    "args": [
        "@schornio/mcp-server-examples@latest",
        "klimaaktiv-foerderungen"
    ]
}
```

## Firmenbuch

Quelle: [https://justizonline.gv.at/jop/web/iwg](https://justizonline.gv.at/jop/web/iwg)

`FIRMENBUCH_API_KEY` bekommt man unter [https://justizonline.gv.at/jop/secure/web/iwg/register](https://justizonline.gv.at/jop/secure/web/iwg/register)

### Ausführen

```bash
npx @schornio/mcp-server-examples@latest firmenbuch
```

### schorn.ai in a Box Konfiguration

```json
{
    "command": "npx",
    "args": [
        "@schornio/mcp-server-examples@latest",
        "firmenbuch"
    ],
    "env": {
        "FIRMENBUCH_API_KEY": "<HIER EINGEBEN>"
    }
}
```

## Philips HUE

`PHILIPS_HUE_BRIDGE_ADDRESS`, `PHILIPS_HUE_API_KEY`, bekommt man mit dem script `npm run philips-hue:init`. Bevor man das Script ausführt, den Knopf auf der Philips HUE Bridge drücken.

`PHILIPS_HUE_LIGHT_IDS` bekommt man auch vom Script, sind UUIDs und werden durch Komma (`,`) getrennt. 1. ID ist Licht mit der Nummer 1 und so weiter. zB `PHILIPS_HUE_LIGHT_IDS="8fea3b20-89d4-417c-a01e-912ee5ce0de8,d275d48e-b21e-4853-9935-d01e5b5f33a4"`

### Ausführen

```bash
npx @schornio/mcp-server-examples@latest philips-hue
```

### schorn.ai in a Box Konfiguration

```json
{
    "command": "npx",
    "args": [
        "@schornio/mcp-server-examples@latest",
        "philips-hue"
    ],
    "env": {
        "PHILIPS_HUE_BRIDGE_ADDRESS": "<HIER EINGEBEN>",
        "PHILIPS_HUE_API_KEY": "<HIER EINGEBEN>",
        "PHILIPS_HUE_LIGHT_IDS": "<HIER EINGEBEN>"
    }
}
```

## Benutzen mit Claude

"schorn.ai in a Box Konfiguration" in folgendes JSON einbetten:

```json
{
    "mcpServers": {
        "<Name des Servers>": {
            // Konfiguration
        }
    }
}
```

### Claude Konfigurationsbeispiel mit Innovationshauptplatz MCP

```json
{
    "mcpServers": {
        "inz-inno-hp": {
            "command": "npx",
            "args": [
                "@schornio/mcp-server-examples@latest",
                "linz-inno-hp"
            ]
        }
    }
}
```

## Publish new version

1. `npm version major/minor/patch`
2. `npm run build`
3. `npm publish --access public`