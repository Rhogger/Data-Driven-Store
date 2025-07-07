import { FastifyInstance } from 'fastify';
import { Driver, Session } from 'neo4j-driver';
import { RecommendedProduct, InfluencerCustomer } from './RecommendationInterfaces';

export class RecommendationRepository {
  private neo4jDriver: Driver;

  constructor(fastify: FastifyInstance) {
    this.neo4jDriver = fastify.neo4j;
  }

  // ============================================================================
  // Product Recommendations
  // ============================================================================

  /**
   * Produtos frequentemente comprados juntos
   */
  async getFrequentlyBoughtTogether(
    id_produto: string,
    limit: number = 5,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (p1:Produto {id_produto: $id_produto})<-[:COMPROU]-(c:Cliente)-[:COMPROU]->(p2:Produto)
        WHERE p1.id_produto <> p2.id_produto
        RETURN p2.id_produto as id_produto,
               p2.nome as nome,
               p2.preco as preco,
               count(*) as frequencia
        ORDER BY frequencia DESC
        LIMIT $limit
      `;

      const result = await session.run(query, { id_produto, limit });

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        nome: record.get('nome'),
        preco: record.get('preco'),
        score: record.get('frequencia').toNumber(),
        motivo_recomendacao: 'Frequentemente comprados juntos',
      }));
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Recomendações baseadas em categoria
   */
  async getCategoryBasedRecommendations(
    clienteId: string,
    limite: number = 10,
    diasAnalise: number = 30,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.neo4jDriver.session();

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
              produtos_categoria.preco as preco,
              score_final as score
      `;

      const result = await session.run(query, {
        clienteId,
        limite,
        diasAnalise,
      });

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        nome: record.get('nome'),
        preco: record.get('preco'),
        score: record.get('score'),
        motivo_recomendacao: 'Baseado nas categorias visualizadas',
      }));
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Menor caminho entre dois produtos (análise de relacionamento)
   */
  async getShortestPath(
    produtoOrigemId: string,
    produtoDestinoId: string,
    maxDistancia: number = 6,
  ): Promise<any> {
    const session: Session = this.neo4jDriver.session();

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
    } catch {
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
    } finally {
      await session.close();
    }
  }

  // ============================================================================
  // Customer Recommendations
  // ============================================================================

  /**
   * Recomendações baseadas em usuários similares
   */
  async getUserBasedRecommendations(
    clienteId: string,
    limite: number = 10,
    minSimilaridade: number = 0.1,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        // Encontra produtos comprados pelo cliente base
        MATCH (cliente_base:Cliente {id_cliente: $clienteId})-[:COMPROU]->(produto_base:Produto)
        WITH cliente_base, collect(produto_base.id_produto) as produtos_cliente_base

        // Encontra outros clientes e seus produtos
        MATCH (outros_clientes:Cliente)-[:COMPROU]->(produtos_outros:Produto)
        WHERE outros_clientes.id_cliente <> $clienteId

        // Agrupa produtos por cliente
        WITH cliente_base, produtos_cliente_base,
             outros_clientes, collect(produtos_outros.id_produto) as produtos_outros_clientes

        // Calcula intersecção (produtos em comum)
        WITH cliente_base, produtos_cliente_base, outros_clientes, produtos_outros_clientes,
             [produto IN produtos_cliente_base WHERE produto IN produtos_outros_clientes] as produtos_em_comum

        // Calcula similaridade usando Jaccard (intersecção / união)
        WITH cliente_base, produtos_cliente_base, outros_clientes, produtos_outros_clientes,
             produtos_em_comum,
             size(produtos_em_comum) as intersecao,
             size(produtos_cliente_base) + size(produtos_outros_clientes) - size(produtos_em_comum) as uniao

        WHERE intersecao > 0  // Filtro: deve ter pelo menos 1 produto em comum

        WITH cliente_base, produtos_cliente_base, outros_clientes, produtos_outros_clientes,
             produtos_em_comum, intersecao,
             toFloat(intersecao) / toFloat(uniao) as similaridade

        WHERE similaridade >= $minSimilaridade  // Filtro de similaridade mínima

        // Encontra produtos que outros clientes compraram mas o cliente base não
        UNWIND produtos_outros_clientes as produto_recomendado
        WHERE NOT produto_recomendado IN produtos_cliente_base

        // Busca informações detalhadas dos produtos recomendados
        MATCH (produto:Produto {id_produto: produto_recomendado})
        MATCH (produto)-[:PRODUZIDO_POR]->(marca:Marca)
        MATCH (produto)-[:PERTENCE_A]->(categoria:Categoria)

        // Agrupa por produto e calcula score baseado na similaridade
        WITH produto, marca, categoria,
             collect({
               id_cliente: outros_clientes.id_cliente,
               produtos_em_comum: intersecao,
               total_produtos_cliente: size(produtos_outros_clientes),
               similaridade: round(similaridade * 100, 2)
             }) as clientes_similares

        WITH produto, marca, categoria, clientes_similares,
             reduce(score = 0.0, cliente IN clientes_similares | score + cliente.similaridade) as score_total

        ORDER BY score_total DESC, size(clientes_similares) DESC
        LIMIT $limite

        RETURN produto.id_produto as id_produto,
               produto.nome as nome,
               produto.preco as preco,
               round(score_total, 2) as score
      `;

      const result = await session.run(query, {
        clienteId,
        limite,
        minSimilaridade,
      });

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        nome: record.get('nome'),
        preco: record.get('preco'),
        score: record.get('score'),
        motivo_recomendacao: 'Baseado em clientes similares',
      }));
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Clientes influenciadores (com mais avaliações e melhores notas)
   */
  async getInfluencerCustomers(limit: number = 10): Promise<InfluencerCustomer[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Cliente)-[a:AVALIOU]->(p:Produto)
        RETURN c.id_cliente as id_cliente,
               c.nome as nome,
               count(a) as total_avaliacoes,
               avg(a.nota) as media_notas,
               collect(DISTINCT p.id_produto) as produtos_avaliados
        ORDER BY total_avaliacoes DESC, media_notas DESC
        LIMIT $limit
      `;

      const result = await session.run(query, { limit });

      return result.records.map((record) => {
        const totalAvaliacoes = record.get('total_avaliacoes').toNumber();
        const mediaNotas = record.get('media_notas').toNumber();

        // Calcular score de influência baseado em quantidade e qualidade das avaliações
        const influenciaScore = Math.round((totalAvaliacoes * mediaNotas) / 5);

        return {
          id_cliente: record.get('id_cliente'),
          nome: record.get('nome'),
          total_avaliacoes: totalAvaliacoes,
          media_notas: Math.round(mediaNotas * 100) / 100,
          produtos_avaliados: record.get('produtos_avaliados'),
          influencia_score: influenciaScore,
        };
      });
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Produtos trending (mais comprados recentemente)
   */
  async getTrendingProducts(
    diasRecentes: number = 7,
    limit: number = 10,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasRecentes);

      const query = `
        MATCH (c:Cliente)-[comprou:COMPROU]->(p:Produto)
        WHERE comprou.data >= $dataLimite
        RETURN p.id_produto as id_produto,
               p.nome as nome,
               p.preco as preco,
               count(comprou) as vendas_recentes
        ORDER BY vendas_recentes DESC
        LIMIT $limit
      `;

      const result = await session.run(query, {
        dataLimite: dataLimite.toISOString().split('T')[0],
        limit,
      });

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        nome: record.get('nome'),
        preco: record.get('preco'),
        score: record.get('vendas_recentes').toNumber(),
        motivo_recomendacao: `Trending - ${record.get('vendas_recentes').toNumber()} vendas nos últimos ${diasRecentes} dias`,
      }));
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }
}
