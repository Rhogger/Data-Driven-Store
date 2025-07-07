// Interfaces para o domínio Analytics (Cassandra)

// ============================================================================
// Funil de Conversão
// ============================================================================
export interface ConversionFunnelData {
  id_usuario: string;
  id_produto: string;
  visualizou: boolean;
  adicionou_carrinho: boolean;
  comprou: boolean;
  timestamp_primeira_visualizacao?: string;
  timestamp_ultima_atualizacao?: string;
}

export interface ConversionFunnelStats {
  total_usuarios: number;
  usuarios_visualizaram: number;
  usuarios_adicionaram_carrinho: number;
  usuarios_compraram: number;
  taxa_conversao_visualizacao_carrinho: number;
  taxa_conversao_carrinho_compra: number;
  taxa_conversao_geral: number;
}

// ============================================================================
// Visualizações Semanais
// ============================================================================
export interface WeeklyViews {
  semana_inicio: string;
  semana_fim: string;
  total_visualizacoes: number;
  visualizacoes_por_dia: Array<{
    data: string;
    total_visualizacoes: number;
  }>;
}

// ============================================================================
// Termos de Busca
// ============================================================================
export interface SearchTermData {
  data_evento: string;
  termo_busca: string;
  total_contagem: number;
}

export interface TopSearchTerms {
  total_termos_analisados: number;
  termos_mais_buscados: Array<{
    termo_busca: string;
    total_buscas: number;
    posicao_ranking: number;
  }>;
}

// ============================================================================
// CTR de Campanha
// ============================================================================
export interface CampaignCTRData {
  origem_campanha: string;
  total_visualizacoes: number;
  total_cliques: number;
  ctr_percentual: number;
  periodo_analise: string;
}

// ============================================================================
// Usuários por UTM Source
// ============================================================================
export interface UsersByUtmData {
  utm_source: string;
  total_usuarios_compraram: number;
  usuarios: Array<{
    id_usuario: string;
    timestamp_primeira_compra: string;
    total_compras: number;
    produtos_comprados: string[];
  }>;
}

// ============================================================================
// Eventos
// ============================================================================
export interface EventData {
  data_evento: string;
  timestamp_evento: string;
  id_evento: string;
  id_usuario: string;
  tipo_evento: string;
  id_produto?: string;
  termo_busca?: string;
  url_pagina?: string;
  origem_campanha?: string;
  detalhes_evento?: { [key: string]: string };
}
