-- Inserção de Dados (Seeding)
--------------------------------------------------------------------------------

-- 1. Dados Básicos (Localização, Pagamento, Categorias)
--------------------------------------------------------------------------------

-- Estados
INSERT INTO estados (nome, uf) VALUES ('São Paulo', 'SP'), ('Rio de Janeiro', 'RJ'), ('Minas Gerais', 'MG'), ('Goiás', 'GO') ON CONFLICT (uf) DO NOTHING;

-- Cidades (12 no total)
INSERT INTO cidades (nome, id_estado) VALUES
    ('São Paulo', (SELECT id_estado FROM estados WHERE uf = 'SP')),
    ('Campinas', (SELECT id_estado FROM estados WHERE uf = 'SP')),
    ('Santos', (SELECT id_estado FROM estados WHERE uf = 'SP')),
    ('Rio de Janeiro', (SELECT id_estado FROM estados WHERE uf = 'RJ')),
    ('Niterói', (SELECT id_estado FROM estados WHERE uf = 'RJ')),
    ('Volta Redonda', (SELECT id_estado FROM estados WHERE uf = 'RJ')),
    ('Belo Horizonte', (SELECT id_estado FROM estados WHERE uf = 'MG')),
    ('Uberlândia', (SELECT id_estado FROM estados WHERE uf = 'MG')),
    ('Juiz de Fora', (SELECT id_estado FROM estados WHERE uf = 'MG')),
    ('Goiânia', (SELECT id_estado FROM estados WHERE uf = 'GO')),
    ('Rio Verde', (SELECT id_estado FROM estados WHERE uf = 'GO')),
    ('Anápolis', (SELECT id_estado FROM estados WHERE uf = 'GO'))
ON CONFLICT DO NOTHING;

-- Métodos de Pagamento
INSERT INTO metodos_pagamento (nome_pagamento) VALUES ('Cartão de Crédito'), ('PIX'), ('Boleto Bancário') ON CONFLICT DO NOTHING;

-- Categorias (10 no total, com subcategorias)
INSERT INTO categorias (id_categoria, nome, id_categoria_pai) VALUES
    (1, 'Eletrônicos', NULL),
    (2, 'Livros', NULL),
    (3, 'Roupas', NULL),
    (4, 'Casa e Cozinha', NULL),
    (5, 'Esportes e Lazer', NULL),
    (6, 'Saúde e Bem-estar', NULL),
    (7, 'Smartphones', 1),
    (8, 'Notebooks', 1),
    (9, 'Ficção Científica', 2),
    (10, 'Cama, Mesa e Banho', 4)
ON CONFLICT (id_categoria) DO NOTHING;

-- 2. Geração Massiva de Clientes e Endereços (30 clientes)
--------------------------------------------------------------------------------

DO $$
DECLARE
    nomes TEXT[] := ARRAY['Ana', 'Bruno', 'Carla', 'Daniel', 'Elisa', 'Fábio', 'Gisele', 'Hugo', 'Íris', 'João'];
    sobrenomes TEXT[] := ARRAY['Silva', 'Costa', 'Mendes', 'Oliveira', 'Ferreira', 'Gomes', 'Martins', 'Lima', 'Araújo', 'Pereira'];
    ruas TEXT[] := ARRAY['Rua das Flores', 'Avenida Paulista', 'Rua da Praia', 'Avenida Brasil', 'Rua 25 de Março', 'Avenida Ipiranga'];
    bairros TEXT[] := ARRAY['Centro', 'Bela Vista', 'Copacabana', 'Savassi', 'Setor Bueno', 'Jardins'];
    cliente_id INT;
BEGIN
    FOR i IN 1..30 LOOP
        INSERT INTO clientes (nome, email, cpf, telefone)
        VALUES (
            nomes[1 + (i-1) % 10] || ' ' || sobrenomes[1 + (i-1) % 10],
            'cliente' || i || '@email.com',
            LPAD(i::text, 3, '0') || '.' || LPAD(i::text, 3, '0') || '.' || LPAD(i::text, 3, '0') || '-' || LPAD(i::text, 2, '0'),
            '(11) 9' || LPAD(i::text, 4, '0') || '-' || LPAD(i::text, 4, '0')
        ) RETURNING id_cliente INTO cliente_id;

        INSERT INTO enderecos (id_cliente, id_cidade, logradouro, numero, cep, tipo_endereco, bairro)
        VALUES (
            cliente_id,
            floor(random() * 12) + 1, -- 12 cidades
            ruas[floor(random() * 6) + 1],
            (floor(random() * 1000) + 1)::text,
            LPAD((floor(random()*90000)+10000)::text, 5, '0') || '-000',
            'Entrega',
            bairros[floor(random() * 6) + 1]
        );
    END LOOP;
END $$;

-- 3. Geração Massiva de Pedidos, Itens e Transações (50 pedidos)
--------------------------------------------------------------------------------

DO $$
DECLARE
    -- Configurações
    total_clientes INT := 30;
    total_pedidos INT := 50;
    total_categorias INT := 10;
    total_metodos_pagamento INT := 3;

    -- Arrays para seleção aleatória
    status_pedidos_arr status_pedido[] := ARRAY['Pendente', 'Processando', 'Enviado', 'Entregue', 'Cancelado'];
    status_transacoes_arr status_transacao[] := ARRAY['Aprovada', 'Recusada', 'Pendente', 'Estornada'];
    produtos_mock_ids TEXT[] := ARRAY['60d5ec49e0d3f4a3c8a8b4a1', '60d5ec49e0d3f4a3c8a8b4a2', '60d5ec49e0d3f4a3c8a8b4a3', '60d5ec49e0d3f4a3c8a8b4a4', '60d5ec49e0d3f4a3c8a8b4a5', '60d5ec49e0d3f4a3c8a8b4a6', '60d5ec49e0d3f4a3c8a8b4a7', '60d5ec49e0d3f4a3c8a8b4a8', '60d5ec49e0d3f4a3c8a8b4a9', '60d5ec49e0d3f4a3c8a8b4aa'];
    precos_produtos NUMERIC[] := ARRAY[899.99, 1599.99, 49.90, 79.90, 99.90, 29.99, 129.90, 349.00, 4500.00, 19.99];

    -- Variáveis de loop
    pedido_id INT;
    pedido_valor_total NUMERIC;
    item_subtotal NUMERIC;
    random_cliente_id INT;
    random_endereco_id INT;
    random_status_pedido status_pedido;
    random_status_transacao status_transacao;
    random_data_pedido TIMESTAMP;
    num_itens_pedido INT;
    random_produto_idx INT;
    item_preco NUMERIC;
    item_qtd INT;
BEGIN
    FOR i IN 1..total_pedidos LOOP
        -- Seleciona um cliente e seu endereço aleatoriamente
        random_cliente_id := floor(random() * total_clientes) + 1;
        SELECT id_endereco INTO random_endereco_id FROM enderecos WHERE id_cliente = random_cliente_id LIMIT 1;

        -- Define status do pedido aleatoriamente
        random_status_pedido := status_pedidos_arr[floor(random() * 5) + 1];

        -- Cria o pedido com valor total 0 e data a partir de 01/01/2025, que será atualizado depois
        INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, data_pedido, valor_total)
        VALUES (
            random_cliente_id, random_endereco_id, random_status_pedido,
            '2025-01-01'::timestamp + random() * (('2025-12-31'::timestamp) - ('2025-01-01'::timestamp)),
            0
        )
        RETURNING id_pedido, data_pedido INTO pedido_id, random_data_pedido;

        pedido_valor_total := 0;
        num_itens_pedido := floor(random() * 3) + 1; -- Entre 1 e 3 itens por pedido

        -- Cria os itens do pedido
        FOR j IN 1..num_itens_pedido LOOP
            random_produto_idx := floor(random() * 10) + 1;
            item_preco := precos_produtos[random_produto_idx];
            item_qtd := floor(random() * 3) + 1;
            item_subtotal := item_preco * item_qtd;

            INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal)
            VALUES (
                pedido_id,
                produtos_mock_ids[random_produto_idx],
                floor(random() * total_categorias) + 1,
                item_preco,
                item_qtd,
                item_subtotal
            );
            pedido_valor_total := pedido_valor_total + item_subtotal;
        END LOOP;

        -- Atualiza o pedido com o valor total correto
        UPDATE pedidos SET valor_total = pedido_valor_total WHERE id_pedido = pedido_id;

        -- Cria a transação financeira correspondente
        IF random_status_pedido = 'Cancelado' THEN
            random_status_transacao := 'Estornada';
        ELSIF random_status_pedido = 'Pendente' THEN
            random_status_transacao := 'Pendente';
        ELSE
            random_status_transacao := 'Aprovada';
        END IF;

        INSERT INTO transacoes_financeiras (id_pedido, id_metodo_pagamento, valor_transacao, status_transacao, data_transacao)
        VALUES (
            pedido_id,
            floor(random() * total_metodos_pagamento) + 1,
            pedido_valor_total,
            random_status_transacao,
            random_data_pedido + (floor(random() * 120) || ' seconds')::interval
        );
    END LOOP;
END $$;
