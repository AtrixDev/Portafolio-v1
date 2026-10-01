import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ResponseFormat } from "../constants.js";
import {
  GetProductInputSchema,
  ListListingsInputSchema,
  ListingsOutputSchema,
  ProductOutputSchema,
  type GetProductInput,
  type Listing,
  type ListingsOutput,
  type ListListingsInput,
  type ProductOutput,
} from "../schemas/products.js";
import { handleApiError, mlGet } from "../services/api.js";
import {
  formatPrice,
  invalidProductIdMessage,
  itemPermalink,
  normalizeProductId,
  truncateText,
} from "../services/format.js";
import type { MlProduct, MlProductItemsResponse } from "../types.js";

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

function errorResult(text: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text }] };
}

function successResult<T extends object>(
  data: T,
  format: ResponseFormat,
  toMarkdown: (data: T) => string,
  truncationHint: string
): CallToolResult {
  const text = format === ResponseFormat.JSON ? JSON.stringify(data, null, 2) : toMarkdown(data);
  return {
    content: [{ type: "text", text: truncateText(text, truncationHint) }],
    structuredContent: data as Record<string, unknown>,
  };
}

// ---------- Producto de catálogo ----------

function toProductOutput(p: MlProduct): ProductOutput {
  const w = p.buy_box_winner;
  return {
    id: p.id,
    name: p.name ?? null,
    status: p.status ?? null,
    domain_id: p.domain_id ?? null,
    family_name: p.family_name ?? null,
    parent_id: p.parent_id ?? null,
    permalink: p.permalink ?? null,
    main_features: (p.main_features ?? []).map((f) => f.text).filter((t): t is string => !!t),
    attributes: (p.attributes ?? [])
      .filter((a) => a.value_name)
      .map((a) => ({ id: a.id ?? null, name: a.name ?? null, value: a.value_name ?? null })),
    pictures: (p.pictures ?? []).map((pic) => pic.url).filter((u): u is string => !!u),
    short_description: p.short_description?.content ?? null,
    buy_box_winner: w
      ? {
          item_id: w.item_id ?? null,
          price: w.price ?? null,
          original_price: w.original_price ?? null,
          currency_id: w.currency_id ?? null,
          seller_id: w.seller_id ?? null,
          condition: w.condition ?? null,
          free_shipping: w.shipping?.free_shipping ?? null,
        }
      : null,
  };
}

function productToMarkdown(p: ProductOutput): string {
  const lines = [`# ${p.name ?? p.id} (${p.id})`, ""];
  if (p.status) lines.push(`- **Estado**: ${p.status}`);
  if (p.domain_id) lines.push(`- **Dominio**: ${p.domain_id}`);
  if (p.family_name) lines.push(`- **Familia**: ${p.family_name}`);
  if (p.parent_id) lines.push(`- **Producto padre**: ${p.parent_id}`);
  if (p.permalink) lines.push(`- **Link**: ${p.permalink}`);

  lines.push("", "## Ganador de la compra (buy box)");
  const w = p.buy_box_winner;
  if (w) {
    lines.push(`- **Publicación**: ${w.item_id ?? "?"}`);
    lines.push(`- **Precio**: ${formatPrice(w.price, w.currency_id)}`);
    if (w.original_price) lines.push(`- **Precio original**: ${formatPrice(w.original_price, w.currency_id)}`);
    if (w.seller_id != null) lines.push(`- **Vendedor**: ${w.seller_id}`);
    if (w.condition) lines.push(`- **Condición**: ${w.condition}`);
    if (w.free_shipping != null) lines.push(`- **Envío gratis**: ${w.free_shipping ? "sí" : "no"}`);
  } else {
    lines.push("Sin ganador actualmente (puede no haber publicaciones activas compitiendo).");
  }

  if (p.main_features.length) {
    lines.push("", "## Características principales", ...p.main_features.map((f) => `- ${f}`));
  }
  if (p.attributes.length) {
    lines.push("", "## Ficha técnica", ...p.attributes.map((a) => `- **${a.name ?? a.id}**: ${a.value}`));
  }
  if (p.short_description) lines.push("", "## Descripción", p.short_description);
  if (p.pictures.length) lines.push("", `## Imágenes (${p.pictures.length})`, ...p.pictures.slice(0, 3).map((u) => `- ${u}`));
  return lines.join("\n");
}

// ---------- Publicaciones que compiten ----------

function toListing(r: NonNullable<MlProductItemsResponse["results"]>[number]): Listing {
  const city = r.seller_address?.city?.name;
  const state = r.seller_address?.state?.name;
  return {
    item_id: r.item_id ?? null,
    permalink: r.item_id ? itemPermalink(r.item_id) : null,
    price: r.price ?? null,
    original_price: r.original_price ?? null,
    currency_id: r.currency_id ?? null,
    seller_id: r.seller_id ?? null,
    official_store_id: r.official_store_id ?? null,
    condition: r.condition ?? null,
    listing_type_id: r.listing_type_id ?? null,
    free_shipping: r.shipping?.free_shipping ?? null,
    logistic_type: r.shipping?.logistic_type ?? null,
    warranty: r.warranty ?? null,
    location: [city, state].filter(Boolean).join(", ") || null,
  };
}

function listingsToMarkdown(out: ListingsOutput): string {
  const lines = [
    `# Publicaciones del producto ${out.product_id}`,
    "",
    `Mostrando ${out.count} de ${out.total} (desde la posición ${out.offset}).`,
  ];
  if (out.min_price_in_page != null && out.max_price_in_page != null) {
    const currency = out.listings.find((l) => l.currency_id)?.currency_id;
    lines.push(
      `Rango de precios en esta página: ${formatPrice(out.min_price_in_page, currency)} – ${formatPrice(out.max_price_in_page, currency)}.`
    );
  }
  lines.push("");
  out.listings.forEach((l, i) => {
    lines.push(`## ${out.offset + i + 1}. ${l.item_id ?? "(sin ID)"} — ${formatPrice(l.price, l.currency_id)}`);
    if (l.original_price) lines.push(`- **Precio original**: ${formatPrice(l.original_price, l.currency_id)}`);
    if (l.seller_id != null) lines.push(`- **Vendedor**: ${l.seller_id}${l.official_store_id ? " (tienda oficial)" : ""}`);
    if (l.condition) lines.push(`- **Condición**: ${l.condition}`);
    if (l.listing_type_id) lines.push(`- **Tipo de publicación**: ${l.listing_type_id}`);
    if (l.free_shipping != null) lines.push(`- **Envío gratis**: ${l.free_shipping ? "sí" : "no"}${l.logistic_type ? ` (${l.logistic_type})` : ""}`);
    if (l.warranty) lines.push(`- **Garantía**: ${l.warranty}`);
    if (l.location) lines.push(`- **Ubicación**: ${l.location}`);
    if (l.permalink) lines.push(`- **Link**: ${l.permalink}`);
    lines.push("");
  });
  if (out.has_more) lines.push(`Hay más publicaciones: usá offset=${out.next_offset}.`);
  return lines.join("\n");
}

// ---------- Registro ----------

export function registerProductTools(server: McpServer): void {
  server.registerTool(
    "mercadolibre_get_catalog_product",
    {
      title: "Ver producto de catálogo de Mercado Libre",
      description: `Obtiene los datos de un producto del catálogo de Mercado Libre (Argentina) a partir de su ID.

Un producto de catálogo agrupa a todas las publicaciones que venden exactamente el mismo artículo. Su ID tiene la forma 'MLA19615208' y aparece en las URLs con '/p/' (ej. https://www.mercadolibre.com.ar/.../p/MLA19615208).

Args:
  - product_id (string): ID de catálogo o URL de catálogo.
  - response_format ('markdown' | 'json'): formato de salida (default 'markdown').

Devuelve: id, name, status, domain_id, family_name, parent_id, permalink, main_features[], attributes[{id,name,value}], pictures[], short_description y buy_box_winner {item_id, price, original_price, currency_id, seller_id, condition, free_shipping} (null si no hay ganador).

Usalo para: "¿Qué es el producto MLA19615208?", "¿Quién gana la buy box y a qué precio?".
No lo uses para listar todas las publicaciones que compiten: para eso está mercadolibre_list_catalog_listings.

Errores: ID inválido, producto inexistente (404), credenciales inválidas (401) o límite de pedidos (429), con un mensaje que explica cómo resolverlo.`,
      inputSchema: GetProductInputSchema,
      outputSchema: ProductOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params: GetProductInput) => {
      const productId = normalizeProductId(params.product_id);
      if (!productId) return errorResult(invalidProductIdMessage(params.product_id));
      try {
        const product = await mlGet<MlProduct>(`/products/${productId}`);
        return successResult(
          toProductOutput(product),
          params.response_format,
          productToMarkdown,
          "Pedí response_format='json' para procesar la ficha completa."
        );
      } catch (error) {
        return errorResult(handleApiError(error, productId));
      }
    }
  );

  server.registerTool(
    "mercadolibre_list_catalog_listings",
    {
      title: "Listar publicaciones que compiten en un catálogo",
      description: `Lista las publicaciones (ítems de distintos vendedores) que compiten dentro de un producto de catálogo de Mercado Libre (Argentina), con su precio y condiciones de venta. Paginado.

Args:
  - product_id (string): ID de catálogo (ej. 'MLA19615208') o URL de catálogo con '/p/'.
  - limit (number): publicaciones por página, 1-50 (default 20).
  - offset (number): posición desde la cual empezar (default 0).
  - response_format ('markdown' | 'json'): formato de salida (default 'markdown').

Devuelve:
  {
    "product_id": string, "total": number, "count": number, "offset": number,
    "has_more": boolean, "next_offset": number | null,
    "min_price_in_page": number | null, "max_price_in_page": number | null,
    "listings": [{ "item_id", "permalink", "price", "original_price", "currency_id", "seller_id",
                   "official_store_id", "condition", "listing_type_id", "free_shipping",
                   "logistic_type", "warranty", "location" }]
  }

El orden es el que devuelve Mercado Libre (no necesariamente por precio). Los precios mínimo/máximo son sólo de la página actual; para comparar todas las publicaciones, recorré las páginas con offset mientras has_more sea true.

Usalo para: "¿Cuántos vendedores venden este producto y a qué precios?", "¿Quién lo tiene más barato con envío gratis?".

Errores: ID inválido, producto inexistente (404), credenciales inválidas (401) o límite de pedidos (429), con un mensaje que explica cómo resolverlo.`,
      inputSchema: ListListingsInputSchema,
      outputSchema: ListingsOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (params: ListListingsInput) => {
      const productId = normalizeProductId(params.product_id);
      if (!productId) return errorResult(invalidProductIdMessage(params.product_id));
      try {
        const data = await mlGet<MlProductItemsResponse>(`/products/${productId}/items`, {
          limit: params.limit,
          offset: params.offset,
        });
        const listings = (data.results ?? []).map(toListing);
        const total = data.paging?.total ?? params.offset + listings.length;
        const hasMore = total > params.offset + listings.length;
        const prices = listings.map((l) => l.price).filter((p): p is number => p != null);
        const output: ListingsOutput = {
          product_id: productId,
          total,
          count: listings.length,
          offset: params.offset,
          has_more: hasMore,
          next_offset: hasMore ? params.offset + listings.length : null,
          min_price_in_page: prices.length ? Math.min(...prices) : null,
          max_price_in_page: prices.length ? Math.max(...prices) : null,
          listings,
        };
        if (!listings.length) {
          return successResult(
            output,
            params.response_format,
            () =>
              params.offset > 0
                ? `No hay más publicaciones para ${productId} a partir de offset=${params.offset} (total: ${total}).`
                : `El producto ${productId} no tiene publicaciones activas compitiendo en este momento.`,
            ""
          );
        }
        return successResult(
          output,
          params.response_format,
          listingsToMarkdown,
          "Usá un 'limit' más chico o paginá con 'offset'."
        );
      } catch (error) {
        return errorResult(handleApiError(error, productId));
      }
    }
  );
}
