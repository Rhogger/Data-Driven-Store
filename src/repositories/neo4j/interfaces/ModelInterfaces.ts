// Interfaces para os nós do grafo Neo4j

export interface Cliente {
  id_cliente: string;
  nome: string;
  email: string;
  telefone?: string;
  data_cadastro: string;
}

export interface Categoria {
  id_categoria: string;
  nome: string;
  descricao?: string;
  ativa: boolean;
}

export interface Produto {
  id_produto: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  data_criacao: string;
}

export interface Marca {
  id_marca: string;
  nome: string;
  descricao?: string;
  ativa: boolean;
}

// Interfaces para os relacionamentos

export interface RelacaoVisualizou {
  data_visualizacao: string;
  duracao_segundos?: number;
  origem?: string; // web, mobile, app
}

export interface RelacaoComprou {
  data_pedido: string;
  quantidade: number;
  preco_unitario: number;
  desconto?: number;
  id_pedido: string;
}

export interface RelacaoAvaliou {
  nota: number; // 1-5
  comentario?: string;
  data: string;
  verificada?: boolean;
}

export interface RelacaoPertenceA {
  categoria_principal?: boolean;
}

export interface RelacaoProduzidoPor {
  data_lancamento?: string;
}

// Tipos de resposta para operações CRUD

export interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface CreateNodeResult extends OperationResult {
  id?: string;
  created: boolean;
}

export interface UpdateNodeResult extends OperationResult {
  updated: boolean;
  changes?: any;
}

export interface DeleteNodeResult extends OperationResult {
  deleted: boolean;
  relationships_deleted?: number;
}

export interface CreateRelationshipResult extends OperationResult {
  relationship_created: boolean;
  from_node: string;
  to_node: string;
  relationship_type: string;
}
