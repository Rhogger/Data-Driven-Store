// Interfaces para o domínio Brand (Neo4j)

export interface Brand {
  id_marca: string;
  nome: string;
  descricao?: string;
  pais_origem?: string;
  ativa: boolean;
}

export interface CreateNodeResult {
  success: boolean;
  created: boolean;
  message: string;
  id?: string;
}

export interface UpdateNodeResult {
  success: boolean;
  updated: boolean;
  message: string;
}

export interface DeleteNodeResult {
  success: boolean;
  deleted: boolean;
  message: string;
}
