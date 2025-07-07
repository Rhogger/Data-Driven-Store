// Interfaces para o domínio Order (PostgreSQL)

export interface OrderInput {
  id_cliente: number;
  valor_total: number;
  status_pedido: string;
  itens: OrderItemInput[];
}

export interface OrderItemInput {
  id_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface CreatedOrder {
  id_pedido: number;
  id_cliente: number;
  data_pedido: Date;
  valor_total: number;
  status_pedido: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderRow {
  id_pedido: number;
  id_cliente: number;
  data_pedido: Date;
  valor_total: number;
  status_pedido: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id_item: number;
  id_pedido: number;
  id_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderWithItems {
  order: OrderRow;
  items: OrderItemRow[];
}
