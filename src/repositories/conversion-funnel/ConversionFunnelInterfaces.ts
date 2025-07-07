import { types } from 'cassandra-driver';

export interface ConversionFunnel {
  id_usuario: types.Uuid;
  id_produto: string;
  visualizou: boolean;
  adicionou_carrinho: boolean;
  comprou: boolean;
  timestamp_primeira_visualizacao?: Date;
  timestamp_ultima_atualizacao?: Date;
}

export interface CreateConversionFunnelInput {
  id_usuario: types.Uuid;
  id_produto: string;
  visualizou: boolean;
  adicionou_carrinho: boolean;
  comprou: boolean;
  timestamp_primeira_visualizacao?: Date;
  timestamp_ultima_atualizacao?: Date;
}

export interface ConversionFunnelStats {
  total_usuarios: number;
  visualizaram: number;
  adicionaram_carrinho: number;
  compraram: number;
  taxa_visualizacao_para_carrinho: number;
  taxa_carrinho_para_compra: number;
  taxa_conversao_total: number;
}

export interface ConversionFunnelByProduct {
  id_produto: string;
  total_usuarios: number;
  visualizaram: number;
  adicionaram_carrinho: number;
  compraram: number;
  taxa_visualizacao_para_carrinho: number;
  taxa_carrinho_para_compra: number;
  taxa_conversao_total: number;
}

export interface ConversionFunnelFilter {
  id_produto?: string;
  data_inicio?: Date;
  data_fim?: Date;
}
