// ============================================================================
// PostgreSQL Interfaces
// ============================================================================
export interface CustomerInput {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
}

export interface CustomerRow {
  id_cliente: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerLoginResult {
  success: boolean;
  customer?: CustomerRow;
  message?: string;
}

// ============================================================================
// Neo4j Interfaces
// ============================================================================
export interface Customer {
  id_cliente: string;
  nome: string;
  email: string;
  data_nascimento: string;
  cidade: string;
  preferencias: string[];
}

export interface ViewRelation {
  data: string;
  timestamp: string;
  navegador?: string;
  dispositivo?: string;
}

export interface PurchaseRelation {
  data: string;
  valor: number;
  quantidade: number;
  desconto?: number;
}

export interface EvaluationRelation {
  nota: number;
  comentario?: string;
  data: string;
  verificada: boolean;
}

export interface CreateNodeResult {
  success: boolean;
  created: boolean;
  message: string;
  id?: string;
}

export interface CreateRelationshipResult {
  success: boolean;
  relationship_created: boolean;
  message: string;
  from_node: string;
  to_node: string;
  relationship_type: string;
}
