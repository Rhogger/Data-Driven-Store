import { types } from 'cassandra-driver';

export interface ProductViewAggregated {
  data_evento: Date;
  id_produto: string;
  total_visualizacoes: types.Long;
}

export interface IncrementProductViewInput {
  data_evento: Date;
  id_produto: string;
  incremento?: number; // Default: 1
}
