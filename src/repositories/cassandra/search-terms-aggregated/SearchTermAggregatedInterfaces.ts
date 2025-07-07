import { types } from 'cassandra-driver';

export interface SearchTermAggregated {
  data_evento: Date;
  termo_busca: string;
  total_contagem: types.Long;
}

export interface IncrementSearchTermInput {
  data_evento: Date;
  termo_busca: string;
  incremento?: number; // Default: 1
}
