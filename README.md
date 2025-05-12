# Beispiel MCP Server

Mit öffentlich verfügbaren Daten.

## Linz Innovationshaupplatz

Quelle: [https://partizipation.linz.at/de-DE/projects/proposals](https://partizipation.linz.at/de-DE/projects/proposals)

### Ausführen

```bash
npx @schornio/mcp-server-examples linz-inno-hp
```

### schorn.ai in a Box Konfiguration

```json
{
    "command": "npx",
    "args": [
        "@schornio/mcp-server-examples",
        "linz-inno-hp"
    ]
}
```

## klimaaktiv Förderungen

Quelle: [https://www.klimaaktiv.at/foerderungen](https://www.klimaaktiv.at/foerderungen)

### Ausführen

```bash
npx @schornio/mcp-server-examples klimaaktiv-foerderungen
```

### schorn.ai in a Box Konfiguration

```json
{
    "command": "npx",
    "args": [
        "@schornio/mcp-server-examples",
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
                "@schornio/mcp-server-examples",
                "linz-inno-hp"
            ]
        }
    }
}
```