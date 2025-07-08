## To Do:

```
[X] Criar middleware para autenticação, sempre que for executar um endpoint, deve verificar se o usuário possui sessao no redis;
```

# Auth

```
[X] Cadastrar-se:
  - [X] Criar cliente no postgres;
  - [X] Criar preferências no mongodb (exigir as preferências no body da requisição e sugerir no swagger fazer o get de categorias primeiro, pois as preferências são array de categoria);
  - [X] Criar cliente no neo4j;
  - [X] Retornar dados do cliente criado.

[X] Logar:
  - [X] Criar sessao no redis.
```

# Cliente

```
[] Alterar informações do cliente:
  - [] Update de dados do cliente no postgres;
  - [] Retornar dados atualizados.

[X] Adicionar endereço:
  - [X] Inserir novo endereço no postgres;
  - [X] Vincular endereço ao cliente;
  - [X] Retornar confirmação.

[X] Listar endereços:
  - [X] Buscar todos os endereços no postgres;
  - [X] Retornar lista de endereços.

[X] Buscar endereço por ID:
  - [X] Buscar o endereço por id no postgres;
  - [X] Retornar endereço.

[X] Alterar endereço:
  - [X] Buscar o endereço por id no postgres;
  - [X] Aplicar as mudanças;
  - [X] Retornar o endereço.

[X] Excluir endereço:
  - [X] Buscar o endereço por id no postgres;
  - [X] Excluir o endereço.

[] Buscar cidades:
  - [] Consultar cidades do postgres;
  - [] Retornar lista de cidades.

[] Buscar estados:
  - [] Consultar estados do postgres;
  - [] Retornar lista de estados.

[] Buscar clientes (listagem):
  - [] Buscar todos os clientes no postgres (sem paginação);
  - [] Retornar lista de clientes.

[] Buscar cliente por ID:
  - [] Buscar cliente específico no postgres;
  - [] Retornar dados do cliente.
```

# Categoria

```
[X] Criar categoria:
  - [X] Criar categoria no postgres;
  - [X] Criar categoria no neo4j.

[X] Buscar categorias (listagem):
  - [X] Buscar todas as categorias do postgres (sem paginação);
  - [X] Retornar lista de categorias.

[X] Buscar categoria por ID:
  - [X] Buscar categoria específica no postgres;
  - [X] Retornar dados da categoria.
```

# Produto

```
[X] Criar produto:
  - [X] Criar produto no mongodb;
  - [X] Criar produto no neo4j;
  - [X] Criar marca do produto no neo4j (se não existir);
  - [X] Criar categorias do produto no neo4j (se não existir).

[] Buscar produto por ID:
  - [X] Buscar produto do mongodb (se não tiver em cache);
  - [X] Criar relação de cliente visualizou o produto no neo4j;
  - [] Registrar evento de visualização no cassandra (eventos_por_data);
  - [] Atualizar funil de conversão no cassandra (visualizou = true);
  - [] Incrementar contador de visualizações diárias no cassandra;
  - [X] Criar o cache de produto no redis;
  - [X] Atualizar ranking no redis.

[X] Buscar produtos (listagem):
  - [X] Buscar produtos do mongodb (remover paginação);
  - [X] Retornar lista de produtos.

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

# Analytics (Cassandra)

```
[] Funil de conversão geral:
  - [] Buscar estatísticas do funil no cassandra (funil_conversao_por_usuario_produto);
  - [] Calcular taxas de conversão;
  - [] Retornar métricas agregadas.

[] Funil de conversão por produto:
  - [] Buscar dados específicos de um produto no cassandra;
  - [] Calcular métricas de performance do produto;
  - [] Retornar estatísticas detalhadas.

[] Visualizações semanais de produtos:
  - [] Buscar visualizações dos últimos 7 dias no cassandra;
  - [] Agregar dados por data;
  - [] Retornar gráfico de visualizações.

[] Top termos de busca:
  - [] Buscar termos mais buscados no cassandra (termos_busca_agregados_por_dia);
  - [] Ordenar por popularidade;
  - [] Retornar ranking de termos.

[] CTR de campanhas:
  - [] Buscar eventos de campanha específica no cassandra;
  - [] Calcular taxa de cliques;
  - [] Retornar métricas de performance da campanha.

[] Usuários por UTM source:
  - [] Buscar compras por origem no cassandra (compras_por_utm_source);
  - [] Agregar dados por fonte;
  - [] Retornar relatório de conversão por canal.
```
