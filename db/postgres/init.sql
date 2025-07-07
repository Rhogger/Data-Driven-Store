SET session_replication_role = 'replica';

-- 1. Criação dos Tipos ENUM personalizados (padrão snake_case)
--------------------------------------------------------------------------------

-- Tipo para o status do pedido
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_pedido') THEN
        CREATE TYPE status_pedido AS ENUM (
            'Pendente', 'Processando', 'Enviado', 'Entregue', 'Cancelado'
        );
    END IF;
END $$;

-- Tipo para o status da transação
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_transacao') THEN
        CREATE TYPE status_transacao AS ENUM (
            'Aprovada', 'Recusada', 'Pendente', 'Estornada'
        );
    END IF;
END $$;

-- Tipo para o tipo de endereço
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_endereco') THEN
        CREATE TYPE tipo_endereco AS ENUM (
            'Residencial', 'Comercial', 'Entrega', 'Cobranca'
        );
    END IF;
END $$;


-- 2. Criação das Tabelas (padrão snake_case)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS estados (
    id_estado SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    uf VARCHAR(2) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cidades (
    id_cidade SERIAL PRIMARY KEY,
    id_estado INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estado) REFERENCES estados(id_estado) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enderecos (
    id_endereco SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_cidade INT NOT NULL,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cep VARCHAR(10) NOT NULL,
    tipo_endereco tipo_endereco NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE ON UPDATE NO ACTION,
    FOREIGN KEY (id_cidade) REFERENCES cidades(id_cidade) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS metodos_pagamento (
    id_metodo_pagamento SERIAL PRIMARY KEY,
    nome_pagamento VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_endereco INT NOT NULL,
    status_pedido status_pedido NOT NULL,
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valor_total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE RESTRICT ON UPDATE NO ACTION,
    FOREIGN KEY (id_endereco) REFERENCES enderecos(id_endereco) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    id_transacao SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_metodo_pagamento INT NOT NULL,
    valor_transacao NUMERIC(10, 2) NOT NULL,
    data_transacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_transacao status_transacao NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE RESTRICT ON UPDATE NO ACTION,
    FOREIGN KEY (id_metodo_pagamento) REFERENCES metodos_pagamento(id_metodo_pagamento) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id_item_pedido SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto VARCHAR(24) NOT NULL,
    id_categoria INT NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    quantidade INT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE ON UPDATE NO ACTION,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT
);

-- 3. Triggers
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = current_schema()
    ) LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON %I;
            CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t_name, t_name);
    END LOOP;
END$$;

SET session_replication_role = 'origin';
