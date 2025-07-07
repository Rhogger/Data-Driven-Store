export interface RecommendedProduct {
  id_produto: string;
  nome: string;
  marca: string;
  categoria: string;
  score: number; // Frequência de co-compra ou peso da recomendação
  clientes_em_comum?: number;
}

export interface SimilarCustomer {
  id_cliente: string;
  produtos_em_comum: number;
  total_produtos_cliente: number;
  similaridade: number; // Score de similaridade (0-1)
}

export interface UserBasedRecommendation {
  id_produto: string;
  nome: string;
  marca: string;
  categoria: string;
  score: number; // Peso da recomendação baseado na similaridade dos clientes
  recomendado_por: SimilarCustomer[];
}

export interface CategoryBasedRecommendation {
  id_produto: string;
  nome: string;
  marca: string;
  categoria: string;
  score: number; // Score baseado na frequência de visualizações da categoria
  categoria_visualizada: {
    id_categoria: string;
    nome_categoria: string;
    total_visualizacoes: number;
  };
}

export interface ProductPathNode {
  tipo: 'produto' | 'categoria' | 'marca';
  id: string;
  nome: string;
  posicao_no_caminho: number;
}

export interface ProductPath {
  produto_origem: {
    id_produto: string;
    nome: string;
  };
  produto_destino: {
    id_produto: string;
    nome: string;
  };
  caminho_encontrado: boolean;
  distancia: number;
  algoritmo_usado: string;
  caminho: ProductPathNode[];
}

export interface InfluencerCustomer {
  id_cliente: string;
  total_avaliacoes: number;
  avaliacoes_positivas: number;
  taxa_avaliacoes_positivas: number; // Percentual de avaliações positivas
  produtos_avaliados: string[];
  impacto_vendas: {
    vendas_antes_avaliacao: number;
    vendas_depois_avaliacao: number;
    aumento_percentual: number;
  };
  score_influencia: number; // Score geral de influência
  produtos_impactados: ProductImpact[];
}

export interface ProductImpact {
  id_produto: string;
  nome_produto: string;
  nota_avaliacao: number;
  data_avaliacao: string;
  vendas_30_dias_antes: number;
  vendas_30_dias_depois: number;
  aumento_vendas: number;
  percentual_aumento: number;
}
