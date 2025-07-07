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
