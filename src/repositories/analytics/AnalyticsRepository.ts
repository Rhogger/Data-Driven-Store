import { FastifyInstance } from 'fastify';
import { Client as CassandraClient } from 'cassandra-driver';
import {
  ConversionFunnelData,
  ConversionFunnelStats,
  WeeklyViews,
  TopSearchTerms,
  CampaignCTRData,
  UsersByUtmData,
} from './AnalyticsInterfaces';

export class AnalyticsRepository {
  private cassandraClient: CassandraClient;
  private keyspace: string;

  constructor(fastify: FastifyInstance) {
    this.cassandraClient = fastify.cassandra;
    this.keyspace = process.env.CASSANDRA_KEYSPACE || 'datadriven_store';
  }

  // ============================================================================
  // 1. Funil de Conversão por Produto
  // ============================================================================

  async updateConversionFunnel(data: ConversionFunnelData): Promise<void> {
    const query = `
      UPDATE ${this.keyspace}.funil_conversao_por_usuario_produto
      SET
        visualizou = ?,
        adicionou_carrinho = ?,
        comprou = ?,
        timestamp_primeira_visualizacao = ?,
        timestamp_ultima_atualizacao = ?
      WHERE id_usuario = ? AND id_produto = ?
    `;

    await this.cassandraClient.execute(query, [
      data.visualizou,
      data.adicionou_carrinho,
      data.comprou,
      data.timestamp_primeira_visualizacao,
      data.timestamp_ultima_atualizacao,
      data.id_usuario,
      data.id_produto,
    ]);
  }

  async getConversionFunnelByProduct(id_produto: string): Promise<ConversionFunnelStats> {
    const query = `
      SELECT * FROM ${this.keyspace}.funil_conversao_por_usuario_produto
      WHERE id_produto = ?
      ALLOW FILTERING
    `;

    const result = await this.cassandraClient.execute(query, [id_produto]);

    const totalUsuarios = result.rows.length;
    const usuariosVisualizaram = result.rows.filter((row) => row.visualizou).length;
    const usuariosAdicionaramCarrinho = result.rows.filter((row) => row.adicionou_carrinho).length;
    const usuariosCompraram = result.rows.filter((row) => row.comprou).length;

    const taxaConversaoVisualizacaoCarrinho =
      usuariosVisualizaram > 0 ? (usuariosAdicionaramCarrinho / usuariosVisualizaram) * 100 : 0;
    const taxaConversaoCarrinhoCompra =
      usuariosAdicionaramCarrinho > 0 ? (usuariosCompraram / usuariosAdicionaramCarrinho) * 100 : 0;
    const taxaConversaoGeral =
      usuariosVisualizaram > 0 ? (usuariosCompraram / usuariosVisualizaram) * 100 : 0;

    return {
      total_usuarios: totalUsuarios,
      usuarios_visualizaram: usuariosVisualizaram,
      usuarios_adicionaram_carrinho: usuariosAdicionaramCarrinho,
      usuarios_compraram: usuariosCompraram,
      taxa_conversao_visualizacao_carrinho:
        Math.round(taxaConversaoVisualizacaoCarrinho * 100) / 100,
      taxa_conversao_carrinho_compra: Math.round(taxaConversaoCarrinhoCompra * 100) / 100,
      taxa_conversao_geral: Math.round(taxaConversaoGeral * 100) / 100,
    };
  }

  async getConversionFunnelStats(): Promise<ConversionFunnelStats> {
    const query = `SELECT * FROM ${this.keyspace}.funil_conversao_por_usuario_produto`;

    const result = await this.cassandraClient.execute(query);

    const totalUsuarios = result.rows.length;
    const usuariosVisualizaram = result.rows.filter((row) => row.visualizou).length;
    const usuariosAdicionaramCarrinho = result.rows.filter((row) => row.adicionou_carrinho).length;
    const usuariosCompraram = result.rows.filter((row) => row.comprou).length;

    const taxaConversaoVisualizacaoCarrinho =
      usuariosVisualizaram > 0 ? (usuariosAdicionaramCarrinho / usuariosVisualizaram) * 100 : 0;
    const taxaConversaoCarrinhoCompra =
      usuariosAdicionaramCarrinho > 0 ? (usuariosCompraram / usuariosAdicionaramCarrinho) * 100 : 0;
    const taxaConversaoGeral =
      usuariosVisualizaram > 0 ? (usuariosCompraram / usuariosVisualizaram) * 100 : 0;

    return {
      total_usuarios: totalUsuarios,
      usuarios_visualizaram: usuariosVisualizaram,
      usuarios_adicionaram_carrinho: usuariosAdicionaramCarrinho,
      usuarios_compraram: usuariosCompraram,
      taxa_conversao_visualizacao_carrinho:
        Math.round(taxaConversaoVisualizacaoCarrinho * 100) / 100,
      taxa_conversao_carrinho_compra: Math.round(taxaConversaoCarrinhoCompra * 100) / 100,
      taxa_conversao_geral: Math.round(taxaConversaoGeral * 100) / 100,
    };
  }

  // ============================================================================
  // 2. Visualizações Semanais
  // ============================================================================

  async getWeeklyViews(): Promise<WeeklyViews> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Últimos 7 dias

    const query = `
      SELECT data_evento, SUM(total_visualizacoes) as total_dia
      FROM ${this.keyspace}.visualizacoes_produto_agregadas_por_dia
      WHERE data_evento >= ? AND data_evento <= ?
    `;

    const result = await this.cassandraClient.execute(query, [
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    ]);

    const visualizacoesPorDia = result.rows.map((row) => ({
      data: row.data_evento,
      total_visualizacoes: parseInt(row.total_dia.toString(), 10),
    }));

    const totalVisualizacoes = visualizacoesPorDia.reduce(
      (acc, dia) => acc + dia.total_visualizacoes,
      0,
    );

    return {
      semana_inicio: startDate.toISOString().split('T')[0],
      semana_fim: endDate.toISOString().split('T')[0],
      total_visualizacoes: totalVisualizacoes,
      visualizacoes_por_dia: visualizacoesPorDia,
    };
  }

  // ============================================================================
  // 3. Top 10 Termos de Busca
  // ============================================================================

  async getTopSearchTerms(limit: number = 10): Promise<TopSearchTerms> {
    const query = `
      SELECT termo_busca, SUM(total_contagem) as total_buscas
      FROM ${this.keyspace}.termos_busca_agregados_por_dia
      GROUP BY termo_busca
    `;

    const result = await this.cassandraClient.execute(query);

    // Ordenar por total de buscas (descendente) e pegar os top 10
    const termosOrdenados = result.rows
      .map((row) => ({
        termo_busca: row.termo_busca,
        total_buscas: parseInt(row.total_buscas.toString(), 10),
      }))
      .sort((a, b) => b.total_buscas - a.total_buscas)
      .slice(0, limit)
      .map((termo, index) => ({
        ...termo,
        posicao_ranking: index + 1,
      }));

    return {
      total_termos_analisados: result.rows.length,
      termos_mais_buscados: termosOrdenados,
    };
  }

  // ============================================================================
  // 4. CTR de Campanha
  // ============================================================================

  async getCampaignCTR(origemCampanha: string): Promise<CampaignCTRData> {
    // Buscar visualizações (impressões)
    const visualizacoesQuery = `
      SELECT COUNT(*) as total_visualizacoes
      FROM ${this.keyspace}.eventos_por_data
      WHERE origem_campanha = ? AND tipo_evento = 'visualizacao'
      ALLOW FILTERING
    `;

    const visualizacoesResult = await this.cassandraClient.execute(visualizacoesQuery, [
      origemCampanha,
    ]);

    // Buscar compras (cliques/conversões)
    const comprasQuery = `
      SELECT COUNT(*) as total_compras
      FROM ${this.keyspace}.compras_por_utm_source
      WHERE origem_campanha = ?
    `;

    const comprasResult = await this.cassandraClient.execute(comprasQuery, [origemCampanha]);

    const totalVisualizacoes = parseInt(
      visualizacoesResult.rows[0]?.total_visualizacoes?.toString() || '0',
      10,
    );
    const totalCliques = parseInt(comprasResult.rows[0]?.total_compras?.toString() || '0', 10);

    const ctrPercentual = totalVisualizacoes > 0 ? (totalCliques / totalVisualizacoes) * 100 : 0;

    return {
      origem_campanha: origemCampanha,
      total_visualizacoes: totalVisualizacoes,
      total_cliques: totalCliques,
      ctr_percentual: Math.round(ctrPercentual * 100) / 100,
      periodo_analise: new Date().toISOString().split('T')[0],
    };
  }

  // ============================================================================
  // 5. Usuários por UTM Source que compraram
  // ============================================================================

  async getUsersByUtmSource(utmSource: string, limite: number = 20): Promise<UsersByUtmData> {
    const query = `
      SELECT id_usuario, MIN(timestamp_evento) as primeira_compra, COUNT(*) as total_compras,
             COLLECT(id_produto) as produtos_comprados
      FROM ${this.keyspace}.compras_por_utm_source
      WHERE origem_campanha = ?
      GROUP BY id_usuario
      LIMIT ?
    `;

    const result = await this.cassandraClient.execute(query, [utmSource, limite]);

    const usuarios = result.rows.map((row) => ({
      id_usuario: row.id_usuario.toString(),
      timestamp_primeira_compra: row.primeira_compra.toISOString(),
      total_compras: parseInt(row.total_compras.toString(), 10),
      produtos_comprados: row.produtos_comprados || [],
    }));

    return {
      utm_source: utmSource,
      total_usuarios_compraram: usuarios.length,
      usuarios,
    };
  }
}
