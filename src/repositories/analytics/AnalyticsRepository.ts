import { FastifyInstance } from 'fastify';
import { Client as CassandraClient, types as CassandraTypes } from 'cassandra-driver';
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

    // Busca dia a dia para evitar ALLOW FILTERING
    const visualizacoesPorDia: { data: string; total_visualizacoes: number }[] = [];
    let totalVisualizacoes = 0;
    for (let i = 0; i < 7; i++) {
      const data = new Date(startDate);
      data.setDate(startDate.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];
      // Converter para types.LocalDate do Cassandra
      const cassandraDate = CassandraTypes.LocalDate.fromDate(data);
      const query = `
        SELECT SUM(total_visualizacoes) as total_dia
        FROM ${this.keyspace}.visualizacoes_produto_agregadas_por_dia
        WHERE data_evento = ?
      `;
      const result = await this.cassandraClient.execute(query, [cassandraDate]);
      const totalDia = result.rows[0]?.total_dia
        ? parseInt(result.rows[0].total_dia.toString(), 10)
        : 0;
      visualizacoesPorDia.push({
        data: dataStr,
        total_visualizacoes: totalDia,
      });
      totalVisualizacoes += totalDia;
    }

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
      SELECT origem_campanha, id_usuario, timestamp_evento, id_produto
      FROM ${this.keyspace}.compras_por_utm_source
      WHERE origem_campanha = ?
    `;
    const params = [utmSource];
    console.log('[DEBUG] Executando query Cassandra:', query, params);
    const result = await this.cassandraClient.execute(query, params, { prepare: true });
    console.log('[DEBUG] Resultado bruto da query:', JSON.stringify(result, null, 2));
    console.log('[DEBUG] Rows retornadas:', result.rows.length);
    result.rows.forEach((row, idx) => {
      console.log(`[DEBUG] Row #${idx}:`, JSON.stringify(row));
    });
    // Agrupa por usuário
    const usuariosMap = new Map<
      number,
      {
        id_usuario: number;
        timestamp_primeira_compra: Date;
        total_compras: number;
        produtos_comprados: string[];
      }
    >();
    result.rows.forEach((row, idx) => {
      console.log(`[DEBUG] Processando row #${idx}:`, JSON.stringify(row));
      const userId = row.id_usuario;
      const dataEvento = row.timestamp_evento;
      if (usuariosMap.has(userId)) {
        const user = usuariosMap.get(userId)!;
        user.total_compras += 1;
        user.produtos_comprados.push(row.id_produto);
        if (dataEvento < user.timestamp_primeira_compra) {
          user.timestamp_primeira_compra = dataEvento;
        }
        console.log('[DEBUG] Atualizado usuario existente:', JSON.stringify(user));
      } else {
        usuariosMap.set(userId, {
          id_usuario: userId,
          timestamp_primeira_compra: dataEvento,
          total_compras: 1,
          produtos_comprados: [row.id_produto],
        });
        console.log('[DEBUG] Novo usuario adicionado:', JSON.stringify(usuariosMap.get(userId)));
      }
    });
    const usuarios = Array.from(usuariosMap.values())
      .sort((a, b) => b.total_compras - a.total_compras)
      .slice(0, limite)
      .map((user, idx) => {
        const obj = {
          id_usuario: user.id_usuario.toString(),
          timestamp_primeira_compra: user.timestamp_primeira_compra?.toISOString?.() || '',
          total_compras: user.total_compras,
          produtos_comprados: user.produtos_comprados,
        };
        console.log(`[DEBUG] Usuario agrupado #${idx}:`, JSON.stringify(obj));
        return obj;
      });
    console.log('[DEBUG] usuarios agrupados final:', JSON.stringify(usuarios, null, 2));
    const response = {
      utm_source: utmSource,
      total_usuarios_compraram: usuarios.length,
      usuarios,
    };
    console.log('[DEBUG] Response final retornado:', JSON.stringify(response, null, 2));
    return response;
  }
}
