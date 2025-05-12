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