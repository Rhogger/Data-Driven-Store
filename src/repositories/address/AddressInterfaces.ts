// Interfaces para o domínio Address (PostgreSQL)

export interface Address {
  id_endereco: number;
  id_cliente: number;
  id_cidade: number;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cep: string;
  tipo_endereco: 'Residencial' | 'Comercial' | 'Entrega' | 'Cobranca';
  created_at: Date;
  updated_at: Date;
}

export interface CreateAddressInput {
  id_cliente: number;
  id_cidade: number;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cep: string;
  tipo_endereco: 'Residencial' | 'Comercial' | 'Entrega' | 'Cobranca';
}

export interface UpdateAddressInput {
  id_cidade?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  tipo_endereco?: 'Residencial' | 'Comercial' | 'Entrega' | 'Cobranca';
}

export interface AddressWithCity {
  id_endereco: number;
  id_cliente: number;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cep: string;
  tipo_endereco: string;
  cidade: string;
  estado: string;
  uf: string;
  created_at: Date;
  updated_at: Date;
}
