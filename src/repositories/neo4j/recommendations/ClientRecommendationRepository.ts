import neo4j, { Driver, Session } from 'neo4j-driver';
import {
  UserBasedRecommendation,
  InfluencerCustomer,
} from '../interfaces/RecommendationInterfaces';

export class ClientRecommendationRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Filtragem Colaborativa (User-User)
   * Encontre clientes com histórico de compra similar ao cliente Y e recomende produtos que eles compraram, mas Y não
   */
  async findUserBasedRecommendations(
    clienteId: string,
    limite: number = 10,
    minSimilaridade: number = 0.1,
  ): Promise<UserBasedRecommendation[]> {
    const session: Session = this.driver.session();

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
        // Filtra a lista de produtos ANTES de expandi-la com UNWIND para evitar o erro de sintaxe
        UNWIND [p IN produtos_outros_clientes WHERE NOT p IN produtos_cliente_base] as produto_recomendado

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
               marca.nome as marca,
               categoria.nome as categoria,
               round(score_total, 2) as score,
               clientes_similares
      `;

      const result = await session.run(query, {
        clienteId,
        limite: neo4j.int(limite),
        minSimilaridade,
      });

      return result.records.map((record) => ({
        id_produto: record.get('id_produto'),
        nome: record.get('nome'),
        marca: record.get('marca'),
        categoria: record.get('categoria'),
        score: record.get('score'),
        recomendado_por: record.get('clientes_similares'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Identificar clientes "influenciadores" (cujas avaliações positivas se correlacionam com mais vendas)
   */
  async findInfluencerCustomers(
    limite: number = 10,
    minAvaliacoes: number = 5,
    periodoAnalise: number = 30,
  ): Promise<InfluencerCustomer[]> {
    const session: Session = this.driver.session();

    try {
      const query = `
        // Encontra clientes que fizeram avaliações
        MATCH (cliente:Cliente)-[avaliacao:AVALIOU]->(produto:Produto)

        // Filtra apenas avaliações positivas (nota >= 4)
        WHERE avaliacao.nota >= 4

        // Conta avaliações por cliente
        WITH cliente,
            count(avaliacao) as avaliacoes_positivas,
            collect(DISTINCT produto.id_produto) as produtos_avaliados,
            collect({
              produto: produto.id_produto,
              nome: produto.nome,
              nota: avaliacao.nota,
              data: avaliacao.data,
              comentario: avaliacao.comentario
            }) as detalhes_avaliacoes

        // Filtra clientes com número mínimo de avaliações
        WHERE avaliacoes_positivas >= $minAvaliacoes

        // Para cada cliente, analisa o impacto nas vendas
        UNWIND detalhes_avaliacoes as avaliacao_detalhe
        MATCH (produto_avaliado:Produto {id_produto: avaliacao_detalhe.produto})

        // Conta vendas antes da avaliação
        OPTIONAL MATCH (outros_clientes:Cliente)-[compra_antes:COMPROU]->(produto_avaliado)
        WHERE compra_antes.data_pedido < avaliacao_detalhe.data
          AND compra_antes.data_pedido >= date(avaliacao_detalhe.data) - duration({days: $periodoAnalise})

        // Conta vendas depois da avaliação
        OPTIONAL MATCH (outros_clientes2:Cliente)-[compra_depois:COMPROU]->(produto_avaliado)
        WHERE compra_depois.data_pedido > avaliacao_detalhe.data
          AND compra_depois.data_pedido <= date(avaliacao_detalhe.data) + duration({days: $periodoAnalise})

        WITH cliente, avaliacoes_positivas, produtos_avaliados, avaliacao_detalhe,
            count(DISTINCT compra_antes) as vendas_antes,
            count(DISTINCT compra_depois) as vendas_depois

        // Calcula o impacto das vendas
        WITH cliente, avaliacoes_positivas, produtos_avaliados,
            collect({
              id_produto: avaliacao_detalhe.produto,
              nome_produto: avaliacao_detalhe.nome,
              nota_avaliacao: avaliacao_detalhe.nota,
              data_avaliacao: toString(avaliacao_detalhe.data),
              vendas_30_dias_antes: vendas_antes,
              vendas_30_dias_depois: vendas_depois,
              aumento_vendas: vendas_depois - vendas_antes,
              percentual_aumento: CASE
                WHEN vendas_antes > 0 THEN round(toFloat(vendas_depois - vendas_antes) / toFloat(vendas_antes) * 100, 2)
                ELSE CASE WHEN vendas_depois > 0 THEN 100.0 ELSE 0.0 END
              END
            }) as produtos_impactados

        // Calcula métricas gerais do cliente
        WITH cliente, avaliacoes_positivas, produtos_avaliados, produtos_impactados,
            reduce(total_vendas_antes = 0, produto IN produtos_impactados | total_vendas_antes + produto.vendas_30_dias_antes) as soma_vendas_antes,
            reduce(total_vendas_depois = 0, produto IN produtos_impactados | total_vendas_depois + produto.vendas_30_dias_depois) as soma_vendas_depois

        WITH cliente, avaliacoes_positivas, produtos_avaliados, produtos_impactados,
            soma_vendas_antes, soma_vendas_depois,
            soma_vendas_depois - soma_vendas_antes as aumento_total_vendas,
            CASE
              WHEN soma_vendas_antes > 0 THEN round(toFloat(soma_vendas_depois - soma_vendas_antes) / toFloat(soma_vendas_antes) * 100, 2)
              ELSE CASE WHEN soma_vendas_depois > 0 THEN 100.0 ELSE 0.0 END
            END as aumento_percentual_total

        // Calcula score de influência
        WITH cliente, avaliacoes_positivas, produtos_avaliados, produtos_impactados,
            soma_vendas_antes, soma_vendas_depois, aumento_total_vendas, aumento_percentual_total,
            round((avaliacoes_positivas * 0.3 + aumento_total_vendas * 0.4 + aumento_percentual_total * 0.3), 2) as score_influencia

        // Ordena por score de influência
        ORDER BY score_influencia DESC, avaliacoes_positivas DESC
        LIMIT $limite

        RETURN cliente.id_cliente as id_cliente,
              avaliacoes_positivas as total_avaliacoes,
              avaliacoes_positivas,
              100.0 as taxa_avaliacoes_positivas,
              produtos_avaliados,
              {
                vendas_antes_avaliacao: soma_vendas_antes,
                vendas_depois_avaliacao: soma_vendas_depois,
                aumento_percentual: aumento_percentual_total
              } as impacto_vendas,
              score_influencia,
              produtos_impactados
      `;

      const result = await session.run(query, {
        limite: neo4j.int(limite),
        minAvaliacoes: neo4j.int(minAvaliacoes),
        periodoAnalise: neo4j.int(periodoAnalise),
      });

      return result.records.map((record) => ({
        id_cliente: record.get('id_cliente'),
        total_avaliacoes: record.get('total_avaliacoes'),
        avaliacoes_positivas: record.get('avaliacoes_positivas'),
        taxa_avaliacoes_positivas: record.get('taxa_avaliacoes_positivas'),
        produtos_avaliados: record.get('produtos_avaliados'),
        impacto_vendas: record.get('impacto_vendas'),
        score_influencia: record.get('score_influencia'),
        produtos_impactados: record.get('produtos_impactados'),
      }));
    } finally {
      await session.close();
    }
  }
}
