import { ObjectId } from 'mongodb';

export interface Product {
  _id?: ObjectId;
  id?: string;
  id_produto?: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque?: number;
  reservado?: number;
  disponivel?: number;
  categorias: number[];
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
  categorias: number[];
  marca: string;
  atributos?: Record<string, any>;
}

export interface UpdateProductInput {
  nome?: string;
  descricao?: string;
  preco?: number;
  estoque?: number;
  categorias?: number[];
  marca?: string;
  atributos?: Record<string, any>;
  avaliacoes?: Array<Record<string, any>>;
}

export interface ProductCacheData {
  id_produto: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  disponivel: number;
  reservado: number;
  marca: string;
  categorias: number[];
  atributos: Record<string, any>;
  avaliacoes: Array<Record<string, any>>;
}

export interface ProductViewData {
  id_produto: string;
  visualizacoes: number;
}
