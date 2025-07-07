export interface CartData {
  id_cliente: string;
  produtos: Record<string, number>; // { id_produto: quantidade }
}

export interface CartItem {
  id_produto: string;
  quantidade: number;
}
