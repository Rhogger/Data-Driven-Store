CREATE KEYSPACE IF NOT EXISTS datadriven WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE datadriven;

CREATE TABLE IF NOT EXISTS eventos_por_data (
    data_evento DATE,
    timestamp_evento TIMESTAMP,
    id_evento UUID,
    id_usuario UUID,
    tipo_evento TEXT,
    id_produto TEXT,
    termo_busca TEXT,
    url_pagina TEXT,
    origem_campanha TEXT,
    detalhes_evento MAP<TEXT, TEXT>,
    PRIMARY KEY (data_evento, timestamp_evento, id_evento)
);

CREATE TABLE IF NOT EXISTS eventos_por_usuario (
    id_usuario UUID,
    timestamp_evento TIMESTAMP,
    id_evento UUID,
    data_evento DATE,
    tipo_evento TEXT,
    id_produto TEXT,
    termo_busca TEXT,
    url_pagina TEXT,
    origem_campanha TEXT,
    detalhes_evento MAP<TEXT, TEXT>,
    PRIMARY KEY (id_usuario, timestamp_evento, id_evento)
);

CREATE TABLE IF NOT EXISTS funil_conversao_por_usuario_produto (
    id_usuario UUID,
    id_produto TEXT,
    visualizou BOOLEAN,
    adicionou_carrinho BOOLEAN,
    comprou BOOLEAN,
    timestamp_primeira_visualizacao TIMESTAMP,
    timestamp_ultima_atualizacao TIMESTAMP,
    PRIMARY KEY (id_usuario, id_produto)
);

CREATE TABLE IF NOT EXISTS termos_busca_agregados_por_dia (
    data_evento DATE,
    termo_busca TEXT,
    total_contagem COUNTER,
    PRIMARY KEY (data_evento, termo_busca)
);

CREATE TABLE IF NOT EXISTS visualizacoes_produto_agregadas_por_dia (
    data_evento DATE,
    id_produto TEXT,
    total_visualizacoes COUNTER,
    PRIMARY KEY (data_evento, id_produto)
);

CREATE TABLE IF NOT EXISTS compras_por_utm_source (
    origem_campanha TEXT,
    timestamp_evento TIMESTAMP,
    id_usuario UUID,
    id_produto TEXT,
    id_pedido UUID,
    tipo_evento TEXT,
    PRIMARY KEY (origem_campanha, timestamp_evento, id_usuario)
);
