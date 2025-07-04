-- Inserção de Dados (Seeding)
--------------------------------------------------------------------------------

-- Estados e Cidades
INSERT INTO estados (nome, uf) VALUES ('São Paulo', 'SP'), ('Rio de Janeiro', 'RJ'), ('Minas Gerais', 'MG'), ('Goiás', 'GO') ON CONFLICT (uf) DO NOTHING;
INSERT INTO cidades (nome, id_estado) VALUES
    ('São Paulo', (SELECT id_estado FROM estados WHERE uf = 'SP')),
    ('Campinas', (SELECT id_estado FROM estados WHERE uf = 'SP')),
    ('Rio de Janeiro', (SELECT id_estado FROM estados WHERE uf = 'RJ')),
    ('Niterói', (SELECT id_estado FROM estados WHERE uf = 'RJ')),
    ('Belo Horizonte', (SELECT id_estado FROM estados WHERE uf = 'MG')),
    ('Uberlândia', (SELECT id_estado FROM estados WHERE uf = 'MG')),
    ('Goiânia', (SELECT id_estado FROM estados WHERE uf = 'GO')),
    ('Rio Verde', (SELECT id_estado FROM estados WHERE uf = 'GO'))
ON CONFLICT DO NOTHING;

-- Clientes
INSERT INTO clientes (nome, email, cpf, telefone) VALUES
    ('Ana Silva', 'ana.silva@email.com', '111.111.111-11', '(11) 91111-1111'),
    ('Bruno Costa', 'bruno.costa@email.com', '222.222.222-22', '(21) 92222-2222'),
    ('Carla Mendes', 'carla.mendes@email.com', '333.333.333-33', '(31) 93333-3333'),
    ('Daniel Oliveira', 'daniel.oliveira@email.com', '444.444.444-44', '(62) 94444-4444'),
    ('Elisa Ferreira', 'elisa.ferreira@email.com', '555.555.555-55', '(19) 95555-5555')
ON CONFLICT (email) DO NOTHING;

-- Endereços
INSERT INTO enderecos (id_cliente, id_cidade, logradouro, numero, cep, tipo_endereco, bairro) VALUES
    ((SELECT id_cliente FROM clientes WHERE email = 'ana.silva@email.com'), (SELECT id_cidade FROM cidades WHERE nome = 'São Paulo'), 'Avenida Paulista', '1500', '01310-200', 'Entrega', 'Bela Vista'),
    ((SELECT id_cliente FROM clientes WHERE email = 'bruno.costa@email.com'), (SELECT id_cidade FROM cidades WHERE nome = 'Rio de Janeiro'), 'Avenida Atlântica', '1702', '22021-001', 'Entrega', 'Copacabana'),
    ((SELECT id_cliente FROM clientes WHERE email = 'carla.mendes@email.com'), (SELECT id_cidade FROM cidades WHERE nome = 'Belo Horizonte'), 'Avenida Afonso Pena', '1212', '30130-003', 'Entrega', 'Centro'),
    ((SELECT id_cliente FROM clientes WHERE email = 'daniel.oliveira@email.com'), (SELECT id_cidade FROM cidades WHERE nome = 'Goiânia'), 'Avenida 85', '200', '74080-010', 'Entrega', 'Setor Marista'),
    ((SELECT id_cliente FROM clientes WHERE email = 'elisa.ferreira@email.com'), (SELECT id_cidade FROM cidades WHERE nome = 'Campinas'), 'Rua Barão de Jaguara', '1000', '13015-925', 'Entrega', 'Centro')
ON CONFLICT DO NOTHING;

-- Categorias
INSERT INTO categorias (id_categoria, nome) VALUES (1, 'Eletrônicos'), (2, 'Livros'), (3, 'Roupas'), (4, 'Casa e Cozinha') ON CONFLICT (id_categoria) DO NOTHING;

-- Métodos de Pagamento
INSERT INTO metodos_pagamento (nome_pagamento) VALUES ('Cartão de Crédito'), ('PIX'), ('Boleto Bancário') ON CONFLICT DO NOTHING;

-- Pedidos e Itens (com datas variadas para relatórios)
DO $$
DECLARE
    -- Clientes
    id_ana INT := (SELECT id_cliente FROM clientes WHERE email = 'ana.silva@email.com');
    id_bruno INT := (SELECT id_cliente FROM clientes WHERE email = 'bruno.costa@email.com');
    id_carla INT := (SELECT id_cliente FROM clientes WHERE email = 'carla.mendes@email.com');
    id_daniel INT := (SELECT id_cliente FROM clientes WHERE email = 'daniel.oliveira@email.com');
    id_elisa INT := (SELECT id_cliente FROM clientes WHERE email = 'elisa.ferreira@email.com');
    -- Endereços
    end_ana INT := (SELECT id_endereco FROM enderecos WHERE id_cliente = id_ana);
    end_bruno INT := (SELECT id_endereco FROM enderecos WHERE id_cliente = id_bruno);
    end_carla INT := (SELECT id_endereco FROM enderecos WHERE id_cliente = id_carla);
    end_daniel INT := (SELECT id_endereco FROM enderecos WHERE id_cliente = id_daniel);
    end_elisa INT := (SELECT id_endereco FROM enderecos WHERE id_cliente = id_elisa);
    -- Pagamentos
    id_cartao INT := (SELECT id_metodo_pagamento FROM metodos_pagamento WHERE nome_pagamento = 'Cartão de Crédito');
    id_pix INT := (SELECT id_metodo_pagamento FROM metodos_pagamento WHERE nome_pagamento = 'PIX');
    -- Categorias
    cat_eletronicos INT := (SELECT id_categoria FROM categorias WHERE nome = 'Eletrônicos');
    cat_livros INT := (SELECT id_categoria FROM categorias WHERE nome = 'Livros');
    cat_roupas INT := (SELECT id_categoria FROM categorias WHERE nome = 'Roupas');
    -- Pedidos
    id_p1 INT; id_p2 INT; id_p3 INT; id_p4 INT; id_p5 INT; id_p6 INT; id_p7 INT; id_p8 INT; id_p9 INT; id_p10 INT;
BEGIN
    -- Pedidos de Carla (cliente com alto faturamento recente)
    INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, data_pedido, valor_total) VALUES (id_carla, end_carla, 'Entregue', NOW() - interval '15 days', 1599.99) RETURNING id_pedido INTO id_p1;
    INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal) VALUES (id_p1, '60d5ec49e0d3f4a3c8a8b4a2', cat_eletronicos, 1599.99, 1, 1599.99);
    INSERT INTO transacoes_financeiras (id_pedido, id_metodo_pagamento, valor_transacao, status_transacao) VALUES (id_p1, id_cartao, 1599.99, 'Aprovada');

    INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, data_pedido, valor_total) VALUES (id_carla, end_carla, 'Entregue', NOW() - interval '2 months', 129.80) RETURNING id_pedido INTO id_p2;
    INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal) VALUES (id_p2, '60d5ec49e0d3f4a3c8a8b4a3', cat_livros, 49.90, 1, 49.90), (id_p2, '60d5ec49e0d3f4a3c8a8b4a4', cat_roupas, 79.90, 1, 79.90);
    INSERT INTO transacoes_financeiras (id_pedido, id_metodo_pagamento, valor_transacao, status_transacao) VALUES (id_p2, id_pix, 129.80, 'Aprovada');

    -- Pedidos de Bruno (outro cliente com faturamento recente)
    INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, data_pedido, valor_total) VALUES (id_bruno, end_bruno, 'Enviado', NOW() - interval '5 days', 159.80) RETURNING id_pedido INTO id_p4;
    INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal) VALUES (id_p4, '60d5ec49e0d3f4a3c8a8b4a4', cat_roupas, 79.90, 2, 159.80);
    INSERT INTO transacoes_financeiras (id_pedido, id_metodo_pagamento, valor_transacao, status_transacao) VALUES (id_p4, id_pix, 159.80, 'Aprovada');

    -- Pedidos de Ana (um recente, um antigo)
    INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, data_pedido, valor_total) VALUES (id_ana, end_ana, 'Entregue', NOW() - interval '1 month', 99.90) RETURNING id_pedido INTO id_p6;
    INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal) VALUES (id_p6, '60d5ec49e0d3f4a3c8a8b4a5', cat_eletronicos, 99.90, 1, 99.90);
    INSERT INTO transacoes_financeiras (id_pedido, id_metodo_pagamento, valor_transacao, status_transacao) VALUES (id_p6, id_cartao, 99.90, 'Aprovada');

    INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, data_pedido, valor_total) VALUES (id_ana, end_ana, 'Entregue', NOW() - interval '8 months', 79.90) RETURNING id_pedido INTO id_p7;
    INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal) VALUES (id_p7, '60d5ec49e0d3f4a3c8a8b4a4', cat_roupas, 79.90, 1, 79.90);
    INSERT INTO transacoes_financeiras (id_pedido, id_metodo_pagamento, valor_transacao, status_transacao) VALUES (id_p7, id_cartao, 79.90, 'Aprovada');

END $$;
