import { types } from 'cassandra-driver';

export interface PurchaseByUtm {
  origem_campanha: string;
  timestamp_evento: Date;
  id_usuario: types.Uuid;
  id_produto: string;
  id_pedido: types.Uuid;
  tipo_evento: string;
}

export interface CreatePurchaseByUtmInput {
  origem_campanha: string;
  timestamp_evento: Date;
  id_usuario: types.Uuid;
  id_produto: string;
  id_pedido: types.Uuid;
  tipo_evento: string;
}
