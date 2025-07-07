import { Driver, Session } from 'neo4j-driver';
import {
  RecommendedProduct,
  ProductPath,
  CategoryBasedRecommendation,
} from '../interfaces/RecommendationInterfaces';

export class ProductRecommendationRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Filtragem Colaborativa (Item-Item)
   * Dado um produto X, encontre outros produtos frequentemente comprados juntos
   */
  async findFrequentlyBoughtTogether(
    produtoId: string,
    limite: number = 10,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.driver.session();

    try {
      const query = `
        // Encontra clientes que compraram o produto base
        MATCH (produto_base:Produto {id_produto: $produtoId})<-[:COMPROU]-(cliente:Cliente)

        // Encontra outros produtos comprados pelos mesmos clientes
        MATCH (cliente)-[:COMPROU]->(produto_relacionado:Produto)
        WHERE produto_relacionado.id_produto <> $produtoId

        // Busca informações adicionais dos produtos relacionados
        MATCH (produto_relacionado)-[:PRODUZIDO_POR]->(marca:Marca)
        MATCH (produto_relacionado)-[:PERTENCE_A]->(categoria:Categoria)

        // Agrupa e conta as co-compras
        WITH produto_relacionado, marca, categoria,
            count(DISTINCT cliente) as clientes_em_comum

        // Ordena por frequência e limita os resultados
        ORDER BY clientes_em_comum DESC, produto_relacionado.nome ASC
        LIMIT $limite

        RETURN produto_relacionado.id_produto as id_produto,
              produto_relacionado.nome as nome,
              marca.nome as marca,
              categoria.nome as categoria,
              clientes_em_comum as score,
              clientes_em_comum
      `;

      const result = await session.run(query, {
        produtoId,
        limite,
      });

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        nome: record.get('nome'),
        marca: record.get('marca'),
        categoria: record.get('categoria'),
        score: record.get('score').toNumber(),
        clientes_em_comum: record.get('clientes_em_comum').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Encontrar o caminho mais curto entre dois produtos através de suas categorias
   */
  async findShortestPathBetweenProducts(
    produtoOrigemId: string,
    produtoDestinoId: string,
    maxDistancia: number = 6,
  ): Promise<ProductPath> {
    const session: Session = this.driver.session();

    try {
      const query = `
        // Busca informações dos produtos origem e destino
        MATCH (origem:Produto {id_produto: $produtoOrigemId})
        MATCH (destino:Produto {id_produto: $produtoDestinoId})

        // Encontra o caminho mais curto considerando relacionamentos bidirecionais
        MATCH path = shortestPath((origem)-[*1..$maxDistancia]-(destino))
        WHERE origem <> destino

        // Extrai informações do caminho
        WITH origem, destino, path,
            length(path) as distancia,
            nodes(path) as nos_caminho

        // Prepara os nós do caminho com suas informações
        UNWIND range(0, size(nos_caminho)-1) as indice
        WITH origem, destino, distancia, nos_caminho, indice,
            nos_caminho[indice] as no_atual

        // Determina o tipo de cada nó
        WITH origem, destino, distancia, nos_caminho, indice, no_atual,
            CASE
              WHEN 'Produto' IN labels(no_atual) THEN 'produto'
              WHEN 'Categoria' IN labels(no_atual) THEN 'categoria'
              WHEN 'Marca' IN labels(no_atual) THEN 'marca'
              ELSE 'desconhecido'
            END as tipo_no

        // Coleta informações de cada nó
        WITH origem, destino, distancia,
            collect({
              tipo: tipo_no,
              id: CASE tipo_no
                    WHEN 'produto' THEN no_atual.id_produto
                    WHEN 'categoria' THEN no_atual.id_categoria
                    WHEN 'marca' THEN no_atual.id_marca
                    ELSE toString(id(no_atual))
                  END,
              nome: no_atual.nome,
              posicao_no_caminho: indice
            }) as caminho_detalhado

        RETURN origem.id_produto as produto_origem_id,
              origem.nome as produto_origem_nome,
              destino.id_produto as produto_destino_id,
              destino.nome as produto_destino_nome,
              true as caminho_encontrado,
              distancia,
              'caminho_mais_curto' as algoritmo_usado,
              caminho_detalhado as caminho

        LIMIT 1
      `;

      const result = await session.run(query, {
        produtoOrigemId,
        produtoDestinoId,
        maxDistancia,
      });

      if (result.records.length === 0) {
        return {
          produto_origem: {
            id_produto: produtoOrigemId,
            nome: 'Produto não encontrado',
          },
          produto_destino: {
            id_produto: produtoDestinoId,
            nome: 'Produto não encontrado',
          },
          caminho_encontrado: false,
          distancia: -1,
          algoritmo_usado: 'caminho_mais_curto',
          caminho: [],
        };
      }

      const record = result.records[0];
      return {
        produto_origem: {
          id_produto: record.get('produto_origem_id'),
          nome: record.get('produto_origem_nome'),
        },
        produto_destino: {
          id_produto: record.get('produto_destino_id'),
          nome: record.get('produto_destino_nome'),
        },
        caminho_encontrado: record.get('caminho_encontrado'),
        distancia: record.get('distancia').toNumber(),
        algoritmo_usado: record.get('algoritmo_usado'),
        caminho: record.get('caminho'),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Recomendar produtos de categorias que um cliente visualizou, mas das quais ainda não comprou
   */
  async findCategoryBasedRecommendations(
    clienteId: string,
    limite: number = 10,
    diasAnalise: number = 30,
  ): Promise<CategoryBasedRecommendation[]> {
    const session: Session = this.driver.session();

    try {
      const query = `
        // Encontra produtos que o cliente já comprou
        MATCH (cliente:Cliente {id_cliente: $clienteId})-[:COMPROU]->(produtos_comprados:Produto)
        WITH cliente, collect(DISTINCT produtos_comprados.id_produto) as produtos_ja_comprados

        // Encontra categorias que o cliente visualizou nos últimos X dias
        MATCH (cliente)-[visualizacao:VISUALIZOU]->(produtos_visualizados:Produto)
        WHERE visualizacao.data_visualizacao >= date() - duration({days: $diasAnalise})

        // Busca as categorias dos produtos visualizados
        MATCH (produtos_visualizados)-[:PERTENCE_A]->(categoria_visualizada:Categoria)

        // Conta visualizações por categoria
        WITH cliente, produtos_ja_comprados,
            categoria_visualizada,
            count(DISTINCT visualizacao) as total_visualizacoes_categoria,
            collect(DISTINCT produtos_visualizados.id_produto) as produtos_visualizados_categoria

        // Encontra outros produtos dessa categoria que o cliente NÃO comprou
        MATCH (produtos_categoria:Produto)-[:PERTENCE_A]->(categoria_visualizada)
        MATCH (produtos_categoria)-[:PRODUZIDO_POR]->(marca:Marca)

        // Filtra produtos que o cliente ainda não comprou
        WHERE NOT produtos_categoria.id_produto IN produtos_ja_comprados
          AND NOT produtos_categoria.id_produto IN produtos_visualizados_categoria

        // Calcula score baseado na popularidade do produto + visualizações da categoria
        OPTIONAL MATCH (outros_clientes:Cliente)-[:COMPROU]->(produtos_categoria)
        WITH cliente, produtos_ja_comprados, categoria_visualizada, total_visualizacoes_categoria,
            produtos_categoria, marca,
            count(DISTINCT outros_clientes) as popularidade_produto

        // Calcula score final combinando visualizações da categoria e popularidade do produto
        WITH cliente, categoria_visualizada, total_visualizacoes_categoria,
            produtos_categoria, marca,
            round((total_visualizacoes_categoria * 0.7 + popularidade_produto * 0.3), 2) as score_final

        // Ordena por score e limita resultados
        ORDER BY score_final DESC, produtos_categoria.nome ASC
        LIMIT $limite

        RETURN produtos_categoria.id_produto as id_produto,
              produtos_categoria.nome as nome,
              marca.nome as marca,
              categoria_visualizada.nome as categoria,
              score_final as score,
              {
                id_categoria: categoria_visualizada.id_categoria,
                nome_categoria: categoria_visualizada.nome,
                total_visualizacoes: total_visualizacoes_categoria
              } as categoria_visualizada
      `;

      const result = await session.run(query, {
        clienteId,
        limite,
        diasAnalise,
      });

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        nome: record.get('nome'),
        marca: record.get('marca'),
        categoria: record.get('categoria'),
        score: record.get('score'),
        categoria_visualizada: record.get('categoria_visualizada'),
      }));
    } finally {
      await session.close();
    }
  }
}
