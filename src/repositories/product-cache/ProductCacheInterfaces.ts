export interface ProductCacheData {
  id_produto: string;
  nome: string;
  descricao: string;
  preco: number;
  marca: string;
  id_categoria: number;
  atributos: Record<string, any>;
  avaliacoes: Array<Record<string, any>>;
}
