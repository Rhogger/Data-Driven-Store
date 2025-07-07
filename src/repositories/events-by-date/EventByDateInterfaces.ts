import { types } from 'cassandra-driver';

export interface EventByDate {
  data_evento: Date;
  timestamp_evento: Date;
  id_evento: types.Uuid;
  id_usuario: types.Uuid;
  tipo_evento: string;
  id_produto?: string;
  termo_busca?: string;
  url_pagina?: string;
  origem_campanha?: string;
  detalhes_evento?: Map<string, string>;
}

export interface CreateEventByDateInput {
  data_evento: Date;
  timestamp_evento: Date;
  id_evento: types.Uuid;
  id_usuario: types.Uuid;
  tipo_evento: string;
  id_produto?: string;
  termo_busca?: string;
  url_pagina?: string;
  origem_campanha?: string;
  detalhes_evento?: Map<string, string>;
}
