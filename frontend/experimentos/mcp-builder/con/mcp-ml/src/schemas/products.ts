import { z } from "zod";
import { ResponseFormat } from "../constants.js";

const productIdField = z
  .string()
  .min(4)
  .max(500)
  .describe(
    "ID del producto de catálogo (ej. 'MLA19615208') o URL de catálogo que contenga '/p/MLA...'. " +
      "No sirve un ID de publicación (MLA-123456789)."
  );

const responseFormatField = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Formato de salida: 'markdown' (legible) o 'json' (estructurado)");

export const GetProductInputSchema = z
  .object({
    product_id: productIdField,
    response_format: responseFormatField,
  })
  .strict();

export const ListListingsInputSchema = z
  .object({
    product_id: productIdField,
    limit: z.number().int().min(1).max(50).default(20).describe("Cantidad de publicaciones a devolver (1-50, default 20)"),
    offset: z.number().int().min(0).default(0).describe("Cantidad de publicaciones a saltear para paginar (default 0)"),
    response_format: responseFormatField,
  })
  .strict();

export type GetProductInput = z.infer<typeof GetProductInputSchema>;
export type ListListingsInput = z.infer<typeof ListListingsInputSchema>;

const buyBoxWinnerSchema = z.object({
  item_id: z.string().nullable(),
  price: z.number().nullable(),
  original_price: z.number().nullable(),
  currency_id: z.string().nullable(),
  seller_id: z.number().nullable(),
  condition: z.string().nullable(),
  free_shipping: z.boolean().nullable(),
});

export const ProductOutputSchema = {
  id: z.string(),
  name: z.string().nullable(),
  status: z.string().nullable(),
  domain_id: z.string().nullable(),
  family_name: z.string().nullable(),
  parent_id: z.string().nullable(),
  permalink: z.string().nullable(),
  main_features: z.array(z.string()),
  attributes: z.array(z.object({ id: z.string().nullable(), name: z.string().nullable(), value: z.string().nullable() })),
  pictures: z.array(z.string()),
  short_description: z.string().nullable(),
  buy_box_winner: buyBoxWinnerSchema.nullable(),
};

const listingSchema = z.object({
  item_id: z.string().nullable(),
  permalink: z.string().nullable(),
  price: z.number().nullable(),
  original_price: z.number().nullable(),
  currency_id: z.string().nullable(),
  seller_id: z.number().nullable(),
  official_store_id: z.number().nullable(),
  condition: z.string().nullable(),
  listing_type_id: z.string().nullable(),
  free_shipping: z.boolean().nullable(),
  logistic_type: z.string().nullable(),
  warranty: z.string().nullable(),
  location: z.string().nullable(),
});

export const ListingsOutputSchema = {
  product_id: z.string(),
  total: z.number(),
  count: z.number(),
  offset: z.number(),
  has_more: z.boolean(),
  next_offset: z.number().nullable(),
  min_price_in_page: z.number().nullable(),
  max_price_in_page: z.number().nullable(),
  listings: z.array(listingSchema),
};

export type ProductOutput = z.infer<z.ZodObject<typeof ProductOutputSchema>>;
export type ListingsOutput = z.infer<z.ZodObject<typeof ListingsOutputSchema>>;
export type Listing = z.infer<typeof listingSchema>;
