// Formas parciales de las respuestas de la API de Mercado Libre.
// Todos los campos son opcionales porque la API no garantiza su presencia.

export interface MlAttribute {
  id?: string;
  name?: string;
  value_name?: string | null;
}

export interface MlBuyBoxWinner {
  item_id?: string;
  price?: number;
  original_price?: number | null;
  currency_id?: string;
  seller_id?: number;
  condition?: string;
  shipping?: { free_shipping?: boolean };
}

export interface MlProduct {
  id: string;
  name?: string;
  status?: string;
  domain_id?: string;
  permalink?: string;
  family_name?: string;
  parent_id?: string | null;
  pictures?: { url?: string }[];
  attributes?: MlAttribute[];
  main_features?: { text?: string }[];
  short_description?: { content?: string };
  buy_box_winner?: MlBuyBoxWinner | null;
}

export interface MlProductItem {
  item_id?: string;
  price?: number;
  original_price?: number | null;
  currency_id?: string;
  seller_id?: number;
  official_store_id?: number | null;
  condition?: string;
  listing_type_id?: string;
  warranty?: string | null;
  shipping?: { free_shipping?: boolean; logistic_type?: string };
  seller_address?: { city?: { name?: string }; state?: { name?: string } };
}

export interface MlProductItemsResponse {
  paging?: { total?: number; offset?: number; limit?: number };
  results?: MlProductItem[];
}
