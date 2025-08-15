# Produto

```
[] Buscar produto por ID:
  - [X] Buscar produto do mongodb (se não tiver em cache);
  - [X] Criar relação de cliente visualizou o produto no neo4j;
  - [] Registrar evento de visualização no cassandra (eventos_por_data);
  - [] Atualizar funil de conversão no cassandra (visualizou = true);
  - [] Incrementar contador de visualizações diárias no cassandra;
  - [X] Criar o cache de produto no redis;
  - [X] Atualizar ranking no redis.

[] Buscar produtos por termo:
  - [] Buscar produtos do mongodb por termo;
  - [] Registrar termo de busca agregado no cassandra;
  - [] Registrar evento de busca no cassandra (eventos_por_data);
  - [] Retornar produtos encontrados.

[] Apagar um produto:
  - [] Deletar produto no mongodb;
  - [] Deletar produto no neo4j;
  - [] Deletar as relações desse produto no neo4j;
  - [] Deletar a marca vinculada (se não tiver mais nenhuma relação com outros produtos);
  - [] Deletar a categoria vinculada (se não tiver mais nenhuma relação com outros produtos);
  - [] Remover produto do ranking no redis;
  - [] Remover produto do cache no redis.

[] Alterar produto:
  - [X] Alterar produto no mongodb;
  - [] Recriar o produto no redis (se existir).

[] Avaliar produto:
  - [] Inserir avaliação no mongodb;
  - [] Criar relação de cliente avaliou produto no neo4j;
  - [] Registrar evento de avaliação no cassandra (eventos_por_data);
  - [] Atualizar funil de conversão no cassandra (se aplicável);
  - [] Recriar produto no redis.

[] Adicionar produto no carrinho:
  - [X] Criar carrinho no redis (se não existir);
  - [X] Adicionar produto no carrinho (se não existir) no redis;
  - [X] Incrementar quantidade (se o produto já estiver no carrinho e a quantidade nova for maior que zero e a quantidade atual) no redis;
  - [] Registrar evento de adicionar ao carrinho no cassandra (eventos_por_data);
  - [] Atualizar funil de conversão no cassandra (adicionou_carrinho = true).

[] Remover produto do carrinho:
  - [X] Remover carrinho no redis (se não tiver produto);
  - [X] Remover produto no carrinho (se existir) no redis;
  - [X] Decrementar quantidade (se o produto já estiver no carrinho e quantidade nova for maior que zero e menor que a atual) no redis.
  - [] Registrar evento de remover do carrinho no cassandra (eventos_por_data);

[X] Limpar carrinho:
  - [X] Apagar o carrinho inteiro no redis.

[X] Buscar o carrinho e todos seus produtos:
  - [X] Buscar carrinho no redis;
  - [X] Buscar dados dos produtos no mongodb;
  - [X] Retornar carrinho com produtos completos.

[X] Buscar o carrinho por id_cliente e todos seus produtos:
  - [X] Buscar carrinho por id_cliente no redis;
  - [X] Buscar dados dos produtos no mongodb;
  - [X] Retornar carrinho com produtos completos.

[] Comprar produto (finalizar pedido):
  - [] Adicionar relação de cliente comprou no neo4j;
  - [] Registrar evento de compra no cassandra (eventos_por_data);
  - [] Atualizar funil de conversão no cassandra (comprou = true);
  - [] Registrar compra por UTM source no cassandra (se aplicável);
  - [] Remover carrinho no redis;
  - [] Criar pedido e seus itens_pedido no postgres;
  - [] Criar transação financeira no postgres.

```

SERVICES

- Login;
- Cadastro usuario;
- Criar categoria;
- Buscar produto por id;
- Atualizar produto;
- 
