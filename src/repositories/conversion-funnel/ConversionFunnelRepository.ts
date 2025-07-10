import { Client } from 'cassandra-driver';
import {
  ConversionFunnel,
  CreateConversionFunnelInput,
  ConversionFunnelStats,
  ConversionFunnelByProduct,
} from './ConversionFunnelInterfaces';
import { FastifyInstance } from 'fastify';

export class ConversionFunnelRepository {
  private client: Client;
  private keyspace: string = 'datadriven_store';

  constructor(fastify: FastifyInstance) {
    this.client = fastify.cassandra;
  }

  async create(funil: CreateConversionFunnelInput): Promise<void> {
    const query = `
      INSERT INTO ${this.keyspace}.funil_conversao_por_usuario_produto (
        id_usuario,
        id_produto,
        visualizou,
        adicionou_carrinho,
        comprou,
        timestamp_primeira_visualizacao,
        timestamp_ultima_atualizacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      funil.id_usuario,
      funil.id_produto,
      funil.visualizou,
      funil.adicionou_carrinho,
      funil.comprou,
      funil.timestamp_primeira_visualizacao || null,
      funil.timestamp_ultima_atualizacao || null,
    ];

    try {
      await this.client.execute(query, params, { prepare: true });
    } catch (error: any) {
      throw new Error(`Erro ao criar/atualizar funil de conversão: ${error.message}`);
    }
  }

  async findByUserAndProduct(
    idUsuario: number,
    idProduto: string,
  ): Promise<ConversionFunnel | null> {
    const query = `
      SELECT * FROM ${this.keyspace}.funil_conversao_por_usuario_produto
      WHERE id_usuario = ? AND id_produto = ?
    `;

    try {
      const result = await this.client.execute(query, [idUsuario, idProduto], { prepare: true });

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id_usuario: row.id_usuario,
        id_produto: row.id_produto,
        visualizou: row.visualizou,
        adicionou_carrinho: row.adicionou_carrinho,
        comprou: row.comprou,
        timestamp_primeira_visualizacao: row.timestamp_primeira_visualizacao,
        timestamp_ultima_atualizacao: row.timestamp_ultima_atualizacao,
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar funil de conversão: ${error.message}`);
    }
  }

  async getConversionFunnelStats(): Promise<ConversionFunnelStats> {
    const query = `
      SELECT id_usuario, visualizou, adicionou_carrinho, comprou
      FROM ${this.keyspace}.funil_conversao_por_usuario_produto
    `;

    try {
      const result = await this.client.execute(query, [], { prepare: true });

      const totalUsuarios = new Set(result.rows.map((row) => row.id_usuario)).size;
      const visualizaram = result.rows.filter((row) => row.visualizou).length;
      const adicionaramCarrinho = result.rows.filter((row) => row.adicionou_carrinho).length;
      const compraram = result.rows.filter((row) => row.comprou).length;

      const taxaVisualizacaoParaCarrinho =
        visualizaram > 0 ? (adicionaramCarrinho / visualizaram) * 100 : 0;
      const taxaCarrinhoParaCompra =
        adicionaramCarrinho > 0 ? (compraram / adicionaramCarrinho) * 100 : 0;
      const taxaConversaoTotal = visualizaram > 0 ? (compraram / visualizaram) * 100 : 0;

      return {
        total_usuarios: totalUsuarios,
        visualizaram,
        adicionaram_carrinho: adicionaramCarrinho,
        compraram,
        taxa_visualizacao_para_carrinho: Math.round(taxaVisualizacaoParaCarrinho * 100) / 100,
        taxa_carrinho_para_compra: Math.round(taxaCarrinhoParaCompra * 100) / 100,
        taxa_conversao_total: Math.round(taxaConversaoTotal * 100) / 100,
      };
    } catch (error: any) {
      throw new Error(`Erro ao consultar estatísticas do funil de conversão: ${error.message}`);
    }
  }

  async getConversionFunnelByProduct(idProduto: string): Promise<ConversionFunnelByProduct> {
    const query = `
      SELECT id_usuario, visualizou, adicionou_carrinho, comprou
      FROM ${this.keyspace}.funil_conversao_por_usuario_produto
      WHERE id_produto = ?
      ALLOW FILTERING
    `;

    try {
      const result = await this.client.execute(query, [idProduto], { prepare: true });

      const totalUsuarios = new Set(result.rows.map((row) => row.id_usuario)).size;
      const visualizaram = result.rows.filter((row) => row.visualizou).length;
      const adicionaramCarrinho = result.rows.filter((row) => row.adicionou_carrinho).length;
      const compraram = result.rows.filter((row) => row.comprou).length;

      const taxaVisualizacaoParaCarrinho =
        visualizaram > 0 ? (adicionaramCarrinho / visualizaram) * 100 : 0;
      const taxaCarrinhoParaCompra =
        adicionaramCarrinho > 0 ? (compraram / adicionaramCarrinho) * 100 : 0;
      const taxaConversaoTotal = visualizaram > 0 ? (compraram / visualizaram) * 100 : 0;

      return {
        id_produto: idProduto,
        total_usuarios: totalUsuarios,
        visualizaram,
        adicionaram_carrinho: adicionaramCarrinho,
        compraram,
        taxa_visualizacao_para_carrinho: Math.round(taxaVisualizacaoParaCarrinho * 100) / 100,
        taxa_carrinho_para_compra: Math.round(taxaCarrinhoParaCompra * 100) / 100,
        taxa_conversao_total: Math.round(taxaConversaoTotal * 100) / 100,
      };
    } catch (error: any) {
      throw new Error(`Erro ao consultar funil de conversão por produto: ${error.message}`);
    }
  }
}
