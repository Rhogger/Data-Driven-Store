export interface PurchaseByUtm {
  origem_campanha: string;
  timestamp_evento: Date;
  id_usuario: number;
  id_produto: string;
  id_pedido: string;
  tipo_evento: string;
}

export interface CreatePurchaseByUtmInput {
  origem_campanha: string;
  timestamp_evento: Date;
  id_usuario: number;
  id_produto: string;
  id_pedido: string;
  tipo_evento: string;
}
