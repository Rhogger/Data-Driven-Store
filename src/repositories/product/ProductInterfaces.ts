import { ObjectId } from 'mongodb';

export interface Product {
  _id?: ObjectId;
  id?: string;
  id_produto?: string; // Campo mapeado de _id
  nome: string;
  descricao: string;
  preco: number;
  estoque?: number;
  reservado?: number; // Quantidade reservada
  disponivel?: number; // estoque - reservado (calculado)
  categorias: number[]; // Array de IDs de categoria
  marca: string;
  atributos?: Record<string, any>;
  avaliacoes?: Array<Record<string, any>>;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductInput {
  nome: string;
  descricao: string;
  preco: number;
  estoque?: number;
  categorias: number[]; // Array de IDs de categoria
  marca: string;
  atributos?: Record<string, any>;
}

export interface UpdateProductInput {
  nome?: string;
  descricao?: string;
  preco?: number;
  estoque?: number;
  categorias?: number[]; // Array de IDs de categoria
  marca?: string;
  atributos?: Record<string, any>;
  avaliacoes?: Array<Record<string, any>>;
}
export interface ProductViewData {
  id_produto: string;
  visualizacoes: number;
}
