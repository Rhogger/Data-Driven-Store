export interface CartData {
  id_cliente: number;
  produtos: Record<string, number>;
}

export interface CartItem {
  id_produto: string;
  quantidade: number;
}
