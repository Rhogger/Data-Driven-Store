import { types } from 'cassandra-driver';

export interface EventByUser {
  id_usuario: types.Uuid;
  timestamp_evento: Date;
  id_evento: types.Uuid;
  data_evento: Date;
  tipo_evento: string;
  id_produto?: string;
  termo_busca?: string;
  url_pagina?: string;
  origem_campanha?: string;
  detalhes_evento?: Map<string, string>;
}

export interface CreateEventByUserInput {
  id_usuario: types.Uuid;
  timestamp_evento: Date;
  id_evento: types.Uuid;
  data_evento: Date;
  tipo_evento: string;
  id_produto?: string;
  termo_busca?: string;
  url_pagina?: string;
  origem_campanha?: string;
  detalhes_evento?: Map<string, string>;
}
