// ============================================================================
// PostgreSQL Interfaces
// ============================================================================
export interface CategoryRow {
  id_categoria: number;
  nome: string;
  id_categoria_pai?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryCreateInput {
  nome: string;
}

// ============================================================================
// Neo4j Interfaces
// ============================================================================
export interface Category {
  id_categoria: string;
  nome: string;
}

export interface CreateNodeResult {
  success: boolean;
  created: boolean;
  message: string;
  id?: string;
}

export interface DeleteNodeResult {
  success: boolean;
  deleted: boolean;
  message: string;
}
