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

  async getFrequentlyBoughtTogether(
    id_produto: string,
    limit: number = 5,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (p1:Produto {id_produto: '${id_produto}'})<-[:COMPROU]-(c:Cliente)-[:COMPROU]->(p2:Produto)
        WHERE p1.id_produto <> p2.id_produto
        RETURN p2.id_produto as id_produto,
               count(*) as frequencia
        ORDER BY frequencia DESC
        LIMIT ${limit}
      `;

      const result = await session.run(query);

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        score: record.get('frequencia').toNumber(),
      }));
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  async getCategoryBasedRecommendations(
    clienteId: number,
    limite: number = 10,
    diasAnalise: number = 30,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Cliente {id_cliente: ${clienteId}})
        OPTIONAL MATCH (c)-[:COMPROU]->(pComprado:Produto)
        WITH c, collect(DISTINCT pComprado.id_produto) AS produtos_ja_comprados

        MATCH (c)-[v:VISUALIZOU]->(pVisualizado:Produto)
        WHERE v.data IS NOT NULL
          AND datetime(v.data) >= datetime() - duration({days: ${diasAnalise}})

        MATCH (pVisualizado)-[:PERTENCE_A]->(cat:Categoria)
        WHERE NOT EXISTS {
          MATCH (c)-[:COMPROU]->(pComprou:Produto)-[:PERTENCE_A]->(catComprada:Categoria)
          WHERE catComprada = cat
        }

        MATCH (produto:Produto)-[:PERTENCE_A]->(cat)
        WHERE NOT produto.id_produto IN produtos_ja_comprados

        OPTIONAL MATCH (outro:Cliente)-[:COMPROU]->(produto)
        WITH produto, cat, count(DISTINCT outro) AS popularidade
        ORDER BY popularidade DESC
        LIMIT ${limite}

        RETURN produto.id_produto AS id_produto,
               cat.id_categoria AS id_categoria,
               popularidade
      `;

      const result = await session.run(query);

      const mapped = result.records.map((record) => {
        let id_produto = record.get('id_produto');
        let id_categoria = record.get('id_categoria');
        let score = record.get('popularidade');

        id_produto = id_produto !== undefined && id_produto !== null ? String(id_produto) : null;

        // id_categoria deve ser integer ou null
        if (id_categoria !== undefined && id_categoria !== null) {
          if (typeof id_categoria === 'object' && typeof id_categoria.toNumber === 'function') {
            id_categoria = id_categoria.toNumber();
          } else if (typeof id_categoria === 'string' && !isNaN(Number(id_categoria))) {
            id_categoria = Number(id_categoria);
          }
        } else {
          id_categoria = null;
        }

        if (score && typeof score.toNumber === 'function') {
          score = score.toNumber();
        } else if (typeof score !== 'number') {
          score = null;
        }

        return {
          id_produto,
          id_categoria,
          score,
        };
      });

      return mapped;
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

  async getShortestPath(
    produtoOrigemId: string,
    produtoDestinoId: string,
    maxDistancia: number = 6,
  ): Promise<any> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
    MATCH (origem:Produto {id_produto: '${produtoOrigemId}'})
    MATCH (destino:Produto {id_produto: '${produtoDestinoId}'})
    WHERE origem <> destino

    OPTIONAL MATCH path = shortestPath((origem)-[:PERTENCE_A|PRODUZIDO_POR*1..${maxDistancia}]-(destino))
    WHERE all(n IN nodes(path) WHERE n:Produto OR n:Categoria OR n:Marca)

    WITH origem, destino, path,
         CASE WHEN path IS NOT NULL THEN true ELSE false END AS caminho_encontrado,
         CASE WHEN path IS NOT NULL THEN length(path) ELSE 0 END AS distancia,
         CASE WHEN path IS NOT NULL THEN nodes(path) ELSE [] END AS nos_do_caminho

    WITH origem, destino, caminho_encontrado, distancia,
         [i IN range(0, size(nos_do_caminho) - 1) |
           CASE WHEN nos_do_caminho IS NOT NULL AND size(nos_do_caminho) > i THEN
             {
               tipo: CASE
                       WHEN 'Produto' IN labels(nos_do_caminho[i]) THEN 'produto'
                       WHEN 'Categoria' IN labels(nos_do_caminho[i]) THEN 'categoria'
                       WHEN 'Marca' IN labels(nos_do_caminho[i]) THEN 'marca'
                     END,
               id: CASE
                     WHEN 'Produto' IN labels(nos_do_caminho[i]) THEN nos_do_caminho[i].id_produto
                     WHEN 'Categoria' IN labels(nos_do_caminho[i]) THEN nos_do_caminho[i].id_categoria
                     ELSE null
                   END,
               nome: CASE
                     WHEN 'Marca' IN labels(nos_do_caminho[i]) THEN coalesce(nos_do_caminho[i].nome, '')
                     ELSE nos_do_caminho[i].nome
                   END,
               posicao_no_caminho: i
             }
           ELSE NULL END
         ] AS caminho_formatado

    RETURN origem.id_produto AS produto_origem_id,
           destino.id_produto AS produto_destino_id,
           caminho_encontrado,
           distancia,
           caminho_formatado AS caminho
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
          caminho: [],
        };
      }

      const record = result.records[0];
      return {
        produto_origem: {
          id_produto: record.get('produto_origem_id'),
        },
        produto_destino: {
          id_produto: record.get('produto_destino_id'),
        },
        caminho_encontrado: record.get('caminho_encontrado'),
        distancia: record.get('distancia').toNumber(),
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
        caminho: [],
      };
    } finally {
      await session.close();
    }
  }

  // ============================================================================
  // Customer Recommendations
  // ============================================================================

  async getUserBasedRecommendations(
    clienteId: number,
    limite: number = 10,
    minSimilaridade: number = 0.1,
  ): Promise<RecommendedProduct[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (cliente_base:Cliente {id_cliente: ${clienteId}})-[:COMPROU]->(produto_base:Produto)
        WITH cliente_base, collect(produto_base.id_produto) as produtos_cliente_base
        MATCH (outros_clientes:Cliente)-[:COMPROU]->(produtos_outros:Produto)
        WHERE outros_clientes.id_cliente <> ${clienteId}
        WITH cliente_base, produtos_cliente_base, outros_clientes, collect(produtos_outros.id_produto) as produtos_outros_clientes
        WITH cliente_base, produtos_cliente_base, outros_clientes, produtos_outros_clientes,
             [produto IN produtos_cliente_base WHERE produto IN produtos_outros_clientes] as produtos_em_comum
        WITH cliente_base, produtos_cliente_base, outros_clientes, produtos_outros_clientes,
             produtos_em_comum,
             size(produtos_em_comum) as intersecao,
             size(produtos_cliente_base) + size(produtos_outros_clientes) - size(produtos_em_comum) as uniao
        WHERE intersecao > 0
        WITH cliente_base, produtos_cliente_base, outros_clientes, produtos_outros_clientes,
             produtos_em_comum, intersecao,
             toFloat(intersecao) / toFloat(uniao) as similaridade
        WHERE similaridade >= ${minSimilaridade}
        UNWIND produtos_outros_clientes as produto_recomendado
        WITH cliente_base, produtos_cliente_base, produto_recomendado, sum(similaridade) as score_total
        WHERE NOT produto_recomendado IN produtos_cliente_base
        WITH produto_recomendado, score_total
        ORDER BY score_total DESC
        LIMIT ${limite}
        MATCH (produto:Produto {id_produto: produto_recomendado})
        RETURN produto.id_produto as id_produto,
               round(score_total, 2) as score
      `;

      const result = await session.run(query);

      const mapped = result.records.map((record) => {
        const obj = {
          id_produto: record.get('id_produto'),
          score: record.get('score'),
          motivo_recomendacao: 'Baseado em clientes similares',
        };

        return obj;
      });
      return mapped;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return [];
    } finally {
      await session.close();
    }
  }

  async getInfluencerCustomers(limit: number = 10): Promise<InfluencerCustomer[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Cliente)-[a:AVALIOU]->(p:Produto)
        RETURN c.id_cliente as id_cliente,
               count(a) as total_avaliacoes,
               avg(a.nota) as media_notas,
               collect(DISTINCT p.id_produto) as produtos_avaliados
        ORDER BY total_avaliacoes DESC, media_notas DESC
        LIMIT ${limit}
      `;

      const result = await session.run(query, { limit });

      const mapped = result.records.map((record) => {
        let idCliente = record.get('id_cliente');
        if (
          idCliente &&
          typeof idCliente === 'object' &&
          typeof idCliente.toNumber === 'function'
        ) {
          idCliente = idCliente.toNumber().toString();
        } else {
          idCliente = String(idCliente);
        }

        let totalAvaliacoes = record.get('total_avaliacoes');
        if (
          totalAvaliacoes &&
          typeof totalAvaliacoes === 'object' &&
          typeof totalAvaliacoes.toNumber === 'function'
        ) {
          totalAvaliacoes = totalAvaliacoes.toNumber();
        }

        let mediaNotas = record.get('media_notas');
        if (
          mediaNotas &&
          typeof mediaNotas === 'object' &&
          typeof mediaNotas.toNumber === 'function'
        ) {
          mediaNotas = mediaNotas.toNumber();
        }

        const influenciaScore = Math.round((totalAvaliacoes * mediaNotas) / 5);

        const obj = {
          id_cliente: idCliente,
          total_avaliacoes: totalAvaliacoes,
          media_notas: Math.round(mediaNotas * 100) / 100,
          produtos_avaliados: record.get('produtos_avaliados'),
          influencia_score: influenciaScore,
        };
        return obj;
      });
      return mapped;
    } catch {
      return [];
    } finally {
      await session.close();
    }
  }

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
