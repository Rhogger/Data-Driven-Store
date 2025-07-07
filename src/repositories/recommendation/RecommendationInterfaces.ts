// Interfaces para o domínio Recommendation (Neo4j)

// ============================================================================
// Product Recommendations
// ============================================================================
export interface RecommendedProduct {
  id_produto: string;
  nome?: string;
  preco?: number;
  score?: number;
  motivo_recomendacao?: string;
}

export interface ProductPath {
  produto_origem: string;
  produto_destino: string;
  distancia: number;
  caminho: string[];
}

export interface CategoryBasedRecommendation {
  id_categoria: string;
  nome_categoria?: string;
  produtos_recomendados: RecommendedProduct[];
  total_produtos: number;
}

// ============================================================================
// Client Recommendations
// ============================================================================
export interface RecommendedCustomer {
  id_cliente: string;
  nome?: string;
  email?: string;
  score?: number;
  motivo_recomendacao?: string;
}

export interface UserBasedRecommendation {
  cliente_origem: string;
  clientes_similares: RecommendedCustomer[];
  produtos_recomendados: RecommendedProduct[];
  baseado_em: string;
}

export interface InfluencerCustomer {
  id_cliente: string;
  nome?: string;
  total_avaliacoes: number;
  media_notas: number;
  produtos_avaliados: string[];
  influencia_score: number;
}
