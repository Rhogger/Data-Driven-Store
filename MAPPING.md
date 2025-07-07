# Auth

```
[] Cadastrar-se:
  - [] Criar cliente no postgres;
  - [] Criar preferencias no mongodb (exigir as preferencias no body da requisição e sugerir no swagger fazer o get de categorias primeiro, pois as preferencias sao array de categoria);
  - [] Criar cliente no neo4j.
[] Logar:
  - [] Criar sessao no redis.
```

## To Do:

```
[] Criar middleware para autenticação, sempre que for executar um endpoint, deve verificar se o usuário possui sessao no redis;

[] No cadastro, coletar as preferencias, sendo os ids de categorias.
```

---

# Cliente

```
[] Alterar informações:
  - [] Update de clientes no postgres.
[] Adicionar endereço;
[] Criar endpoint para get de cidades;
[] Criar endpoint para get de estados;
[] Buscar clientes (sem paginação).
```

# Categoria

```
[] Criar categoria:
  - [] Criar categoria no postgres;
  - [] Criar categoria no neo4j.
[] Buscar categorias (sem paginação).
```

# Produto

```
[] Criar produto:
  - [] Criar produto no mongodb;
  - [] Criar produto no neo4j;
  - [] Criar marca do produto no neo4j (se não existir);
  - [] Criar categorias do produto no neo4j (se não existir).
[] Buscar produto:
  - [] Buscar produto do mongodb (se nao tiver em cache);
  - [] Criar relação de cliente visualizou o produto no neo4j;
  - [] Criar o cache de produto no redis;
  - [] Atualizar ranking no redis.
[] Buscar produtos (remover paginação);
[] Apagar um produto:
  - [] Deletar produto no mongodb;
  - [] Deletar produto no neo4j;
  - [] Deletar as relações desse produto no neo4j;
  - [] Deletar a marca vinculada (se nao tiver mais nenhuma relação com outros produtos);
  - [] Deletar a categoria vinculada (se nao tiver mais nenhuma relação com outros produtos);
  - [] Remover produto do ranking no redis;
  - [] Remover produto do cache no redis.
[] Alterar produto:
  - [] Alterar produto no mongodb;
  - [] Recriar o produto no redis (se existir).
[] Avaliar produto:
  - [] Inserir avaliação no mongodb;
  - [] Criar relação de cliente avaliou produto no neo4j;
  - [] Recriar produto no redis.
[] Adicionar produto no carrinho:
  - [] Criar carrinho no redis (se nao existir) no redis;
  - [] Adicionar produto no carrinho (se não existir) no redis;
  - [] Incrementar quantidade (se o produto ja estiver no carrinho e a quantidade nova for maior que zero e a quantidade atual) no redis.
[] Remover produto do carrinho:
  - [] Remover carrinho no redis (se nao tiver produto) no redis;
  - [] Remover produto no carrinho (se existir) no redis;
  - [] Decrementar quantidade (se o produto ja estiver no carrinho e quantidade nova for maior que zero e menor que a atual)  no redis.
[] Limpar carrinho:
  - [] Apagar o carrinho inteiro no redis.
[] Buscar o carrinho e todos seus produtos;
[] Comprar produto:
  - [] Adicionar relação de cliente comprou no neo4j;
  - [] Remover carrinho no redis;
  - [] Criar pedido e seus itens_pedido no postgres;
  - [] Criar transação financeira no postgres.
```

#

```
[] :
  -
```
