#!/usr/bin/env node
/**
 * Servidor MCP para consultar el catálogo de Mercado Libre Argentina:
 * datos de un producto de catálogo y las publicaciones que compiten en él.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { assertAuthConfigured } from "./services/auth.js";
import { registerProductTools } from "./tools/products.js";

async function main(): Promise<void> {
  try {
    assertAuthConfigured();
  } catch (error) {
    console.error(`ERROR: ${(error as Error).message}`);
    process.exit(1);
  }

  const server = new McpServer({ name: "mercadolibre-mcp-server", version: "1.0.0" });
  registerProductTools(server);

  await server.connect(new StdioServerTransport());
  console.error("mercadolibre-mcp-server corriendo por stdio");
}

main().catch((error) => {
  console.error("Error del servidor:", error);
  process.exit(1);
});
