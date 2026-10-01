#!/usr/bin/env node
// Servidor MCP para consultar productos de catálogo de Mercado Libre Argentina.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mlGet, MLError } from "./ml-client.js";

// Acepta "MLA14086325", "mla14086325" o una URL de catálogo (".../p/MLA14086325").
function parseProductId(input) {
  const text = input.trim();
  const fromUrl = text.match(/\/p\/(MLA\d+)/i);
  const id = (fromUrl ? fromUrl[1] : text).toUpperCase();
  if (!/^MLA\d+$/.test(id)) {
    throw new MLError(
      `"${input}" no parece un ID de catálogo de Mercado Libre Argentina. Tiene que ser del estilo MLA14086325 ` +
        "o una URL que contenga /p/MLA...",
    );
  }
  return id;
}

function itemUrl(itemId) {
  const m = /^([A-Z]{3})(\d+)$/.exec(itemId ?? "");
  return m ? `https://articulo.mercadolibre.com.ar/${m[1]}-${m[2]}` : undefined;
}

function summarizeProduct(p) {
  return {
    id: p.id,
    nombre: p.name,
    estado: p.status,
    dominio: p.domain_id,
    familia: p.family_name,
    url: p.permalink,
    descripcion_corta: p.short_description?.content,
    caracteristicas_principales: p.main_features?.map((f) => f.text),
    atributos: p.attributes?.map((a) => ({ nombre: a.name, valor: a.value_name })),
    fotos: p.pictures?.slice(0, 5).map((f) => f.url),
    ganador_buy_box: p.buy_box_winner
      ? {
          item_id: p.buy_box_winner.item_id,
          precio: p.buy_box_winner.price,
          moneda: p.buy_box_winner.currency_id,
          vendedor_id: p.buy_box_winner.seller_id,
          condicion: p.buy_box_winner.condition,
          envio_gratis: p.buy_box_winner.shipping?.free_shipping,
          url: itemUrl(p.buy_box_winner.item_id),
        }
      : null,
    productos_hijos: p.children_ids?.length ? p.children_ids : undefined,
  };
}

function summarizeItem(i) {
  return {
    item_id: i.item_id,
    precio: i.price,
    precio_original: i.original_price ?? undefined,
    moneda: i.currency_id,
    vendedor_id: i.seller_id,
    tienda_oficial_id: i.official_store_id ?? undefined,
    condicion: i.condition,
    tipo_publicacion: i.listing_type_id,
    envio_gratis: i.shipping?.free_shipping,
    logistica: i.shipping?.logistic_type,
    garantia: i.warranty ?? undefined,
    provincia: i.seller_address?.state?.name,
    url: itemUrl(i.item_id),
  };
}

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(err) {
  const msg = err instanceof MLError ? err.message : `Error inesperado: ${err.message}`;
  return { content: [{ type: "text", text: msg }], isError: true };
}

const server = new McpServer({ name: "mcp-ml", version: "1.0.0" });

server.registerTool(
  "ml_obtener_producto",
  {
    title: "Obtener producto de catálogo",
    description:
      "Devuelve los datos de un producto de catálogo de Mercado Libre Argentina a partir de su ID (ej. MLA14086325) " +
      "o de su URL (.../p/MLA...): nombre, estado, atributos, características, fotos y la publicación que gana la buy box.",
    inputSchema: {
      product_id: z.string().describe("ID de catálogo (MLA seguido de números) o URL del producto de catálogo"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ product_id }) => {
    try {
      const id = parseProductId(product_id);
      return ok(summarizeProduct(await mlGet(`/products/${id}`)));
    } catch (err) {
      return fail(err);
    }
  },
);

server.registerTool(
  "ml_listar_publicaciones",
  {
    title: "Listar publicaciones que compiten en un catálogo",
    description:
      "Lista las publicaciones (items) que compiten en un producto de catálogo de Mercado Libre Argentina, con precio, " +
      "vendedor, condición y envío. Incluye un resumen con precio mínimo, máximo y promedio de la página devuelta.",
    inputSchema: {
      product_id: z.string().describe("ID de catálogo (MLA seguido de números) o URL del producto de catálogo"),
      limit: z.number().int().min(1).max(100).default(20).describe("Cantidad máxima de publicaciones a traer (1-100)"),
      offset: z.number().int().min(0).default(0).describe("Desde qué posición empezar, para paginar"),
      orden: z
        .enum(["relevancia", "precio_asc", "precio_desc"])
        .default("relevancia")
        .describe("Orden de los resultados dentro de la página devuelta"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ product_id, limit, offset, orden }) => {
    try {
      const id = parseProductId(product_id);
      const data = await mlGet(`/products/${id}/items`, { limit, offset });
      const items = (data.results ?? []).map(summarizeItem);

      if (orden === "precio_asc") items.sort((a, b) => a.precio - b.precio);
      if (orden === "precio_desc") items.sort((a, b) => b.precio - a.precio);

      const precios = items.map((i) => i.precio).filter((p) => typeof p === "number");
      const resumen = precios.length
        ? {
            precio_minimo: Math.min(...precios),
            precio_maximo: Math.max(...precios),
            precio_promedio: Math.round((precios.reduce((a, b) => a + b, 0) / precios.length) * 100) / 100,
            monedas: [...new Set(items.map((i) => i.moneda))],
          }
        : null;

      return ok({
        producto_id: id,
        total: data.paging?.total ?? items.length,
        offset: data.paging?.offset ?? offset,
        devueltas: items.length,
        resumen,
        publicaciones: items,
      });
    } catch (err) {
      // Un catálogo sin publicaciones activas devuelve 404 en este endpoint.
      if (err instanceof MLError && err.status === 404) {
        return ok({ producto_id: product_id, total: 0, devueltas: 0, publicaciones: [], nota: "El producto no existe o no tiene publicaciones activas compitiendo." });
      }
      return fail(err);
    }
  },
);

await server.connect(new StdioServerTransport());
console.error("[mcp-ml] Servidor MCP de Mercado Libre listo (stdio).");
