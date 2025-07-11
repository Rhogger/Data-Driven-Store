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

  async getConversionFunnelStats(): Promise<any> {
    const query = `SELECT id_usuario, visualizou, adicionou_carrinho, comprou FROM ${this.keyspace}.funil_conversao_por_usuario_produto`;
    const result = await this.cassandraClient.execute(query);

    // Usar Set para garantir unicidade
    const usuariosVisualizaram = new Set<number>();
    const usuariosAdicionaramCarrinho = new Set<number>();
    const usuariosCompraram = new Set<number>();
    const todosUsuarios = new Set<number>();

    // Para estatísticas extras
    const usuariosSomenteVisualizaram = new Set<number>();
    const usuariosVisualizaramECarrinho = new Set<number>();
    const usuariosCompletaramFunil = new Set<number>();
    const usuariosAbandonaramCarrinho = new Set<number>();

    // Map para saber o status de cada usuário
    const userStatus: Record<
      number,
      { visualizou: boolean; adicionou: boolean; comprou: boolean }
    > = {};

    for (const row of result.rows) {
      todosUsuarios.add(row.id_usuario);
      if (!userStatus[row.id_usuario]) {
        userStatus[row.id_usuario] = { visualizou: false, adicionou: false, comprou: false };
      }
      if (row.visualizou) {
        usuariosVisualizaram.add(row.id_usuario);
        userStatus[row.id_usuario].visualizou = true;
      }
      if (row.adicionou_carrinho) {
        usuariosAdicionaramCarrinho.add(row.id_usuario);
        userStatus[row.id_usuario].adicionou = true;
      }
      if (row.comprou) {
        usuariosCompraram.add(row.id_usuario);
        userStatus[row.id_usuario].comprou = true;
      }
    }

    // Estatísticas extras
    for (const [id, status] of Object.entries(userStatus)) {
      const idNum = Number(id);
      if (status.visualizou && !status.adicionou && !status.comprou) {
        usuariosSomenteVisualizaram.add(idNum);
      }
      if (status.visualizou && status.adicionou && !status.comprou) {
        usuariosVisualizaramECarrinho.add(idNum);
      }
      if (status.visualizou && status.adicionou && status.comprou) {
        usuariosCompletaramFunil.add(idNum);
      }
      if (status.adicionou && !status.comprou) {
        usuariosAbandonaramCarrinho.add(idNum);
      }
    }

    const totalUsuarios = todosUsuarios.size;
    const taxaVisualizacaoCarrinho =
      usuariosVisualizaram.size > 0
        ? (usuariosAdicionaramCarrinho.size / usuariosVisualizaram.size) * 100
        : 0;
    const taxaCarrinhoCompra =
      usuariosAdicionaramCarrinho.size > 0
        ? (usuariosCompraram.size / usuariosAdicionaramCarrinho.size) * 100
        : 0;
    const taxaVisualizacaoCompra =
      usuariosVisualizaram.size > 0
        ? (usuariosCompraram.size / usuariosVisualizaram.size) * 100
        : 0;

    return {
      total_usuarios: totalUsuarios,
      usuarios_visualizaram: usuariosVisualizaram.size,
      usuarios_adicionaram_carrinho: usuariosAdicionaramCarrinho.size,
      usuarios_compraram: usuariosCompraram.size,
      taxa_visualizacao_ate_carrinho: Math.round(taxaVisualizacaoCarrinho * 100) / 100,
      taxa_carrinho_ate_compra: Math.round(taxaCarrinhoCompra * 100) / 100,
      taxa_visualizacao_ate_compra: Math.round(taxaVisualizacaoCompra * 100) / 100,
      usuarios_somente_visualizaram: usuariosSomenteVisualizaram.size,
      usuarios_visualizaram_e_carrinho: usuariosVisualizaramECarrinho.size,
      usuarios_completaram_funil: usuariosCompletaramFunil.size,
      usuarios_abandonaram_carrinho: usuariosAbandonaramCarrinho.size,
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
    // Buscar os últimos 30 dias e agregar em memória
    const termosMap = new Map<string, number>();
    const hoje = new Date();
    let total_termos_analisados = 0;
    for (let i = 0; i < 30; i++) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);
      const cassandraDate = CassandraTypes.LocalDate.fromDate(data);
      const query = `
        SELECT termo_busca, total_contagem
        FROM ${this.keyspace}.termos_busca_agregados_por_dia
        WHERE data_evento = ?
      `;
      const result = await this.cassandraClient.execute(query, [cassandraDate]);
      total_termos_analisados += result.rows.length;
      result.rows.forEach((row) => {
        const termo = row.termo_busca;
        const contagem = Number(row.total_contagem);
        if (termosMap.has(termo)) {
          termosMap.set(termo, termosMap.get(termo)! + contagem);
        } else {
          termosMap.set(termo, contagem);
        }
      });
    }
    const termosOrdenados = Array.from(termosMap.entries())
      .map(([termo, total]) => ({ termo_busca: termo, total_buscas: total }))
      .sort((a, b) => b.total_buscas - a.total_buscas)
      .slice(0, limit)
      .map((termo, index) => ({ ...termo, posicao_ranking: index + 1 }));
    return {
      total_termos_analisados,
      termos_mais_buscados: termosOrdenados,
    };
  }

  // ============================================================================
  // 4. CTR de Campanha
  // ============================================================================

  async getCampaignCTR(origemCampanha: string): Promise<CampaignCTRData> {
    const visualizacoesQuery = `
      SELECT COUNT(*) as total_visualizacoes
      FROM ${this.keyspace}.eventos_por_data
      WHERE origem_campanha = ? AND tipo_evento = 'visualizou'
      ALLOW FILTERING
    `;

    const visualizacoesResult = await this.cassandraClient.execute(visualizacoesQuery, [
      origemCampanha,
    ]);

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
    const result = await this.cassandraClient.execute(query, params, { prepare: true });

    const usuariosMap = new Map<
      number,
      {
        id_usuario: number;
        timestamp_primeira_compra: Date;
        total_compras: number;
        produtos_comprados: string[];
      }
    >();

    result.rows.forEach((row) => {
      const userId = row.id_usuario;
      const dataEvento = row.timestamp_evento;

      if (usuariosMap.has(userId)) {
        const user = usuariosMap.get(userId)!;
        user.total_compras += 1;
        user.produtos_comprados.push(row.id_produto);
        if (dataEvento < user.timestamp_primeira_compra)
          user.timestamp_primeira_compra = dataEvento;
      } else
        usuariosMap.set(userId, {
          id_usuario: userId,
          timestamp_primeira_compra: dataEvento,
          total_compras: 1,
          produtos_comprados: [row.id_produto],
        });
    });

    const usuarios = Array.from(usuariosMap.values())
      .sort((a, b) => b.total_compras - a.total_compras)
      .slice(0, limite)
      .map((user) => {
        const obj = {
          id_usuario: user.id_usuario.toString(),
          timestamp_primeira_compra: user.timestamp_primeira_compra?.toISOString?.() || '',
          total_compras: user.total_compras,
          produtos_comprados: user.produtos_comprados,
        };
        return obj;
      });

    const response = {
      utm_source: utmSource,
      total_usuarios_compraram: usuarios.length,
      usuarios,
    };

    return response;
  }

  // ============================================================================
  // 6. Funil de conversão agrupado por usuário
  // ============================================================================

  async getConversionFunnelByUser() {
    const query = `SELECT id_usuario, visualizou, adicionou_carrinho, comprou FROM ${this.keyspace}.funil_conversao_por_usuario_produto`;
    const result = await this.cassandraClient.execute(query);
    // Agrupa por usuário e soma os eventos
    const funnelByUser: Record<
      number,
      { visualizou: number; adicionou_carrinho: number; comprou: number }
    > = {};
    for (const row of result.rows) {
      const id = Number(row.id_usuario);
      if (!funnelByUser[id]) {
        funnelByUser[id] = { visualizou: 0, adicionou_carrinho: 0, comprou: 0 };
      }
      funnelByUser[id].visualizou += row.visualizou || 0;
      funnelByUser[id].adicionou_carrinho += row.adicionou_carrinho || 0;
      funnelByUser[id].comprou += row.comprou || 0;
    }
    // Calcula estatísticas por usuário
    return Object.entries(funnelByUser).map(([id_usuario, stats]) => {
      const visualizou = stats.visualizou;
      const adicionou = stats.adicionou_carrinho;
      const comprou = stats.comprou;
      const taxa_visualizacao_ate_carrinho = visualizou > 0 ? (adicionou / visualizou) * 100 : 0;
      const taxa_carrinho_ate_compra = adicionou > 0 ? (comprou / adicionou) * 100 : 0;
      const taxa_visualizacao_ate_compra = visualizou > 0 ? (comprou / visualizou) * 100 : 0;
      return {
        id_usuario: Number(id_usuario),
        visualizou,
        adicionou_carrinho: adicionou,
        comprou,
        taxa_visualizacao_ate_carrinho: Math.round(taxa_visualizacao_ate_carrinho * 100) / 100,
        taxa_carrinho_ate_compra: Math.round(taxa_carrinho_ate_compra * 100) / 100,
        taxa_visualizacao_ate_compra: Math.round(taxa_visualizacao_ate_compra * 100) / 100,
        completou_funil: visualizou > 0 && adicionou > 0 && comprou > 0,
        abandonou_carrinho: adicionou > 0 && comprou === 0,
        somente_visualizou: visualizou > 0 && adicionou === 0 && comprou === 0,
      };
    });
  }
}
