import { FastifyRequest, FastifyReply } from 'fastify';
import { PurchasesByUtmRepository } from '@/repositories/purchases-by-utm/PurchasesByUtmRepository';

interface UsersByUtmParams {
  utmSource: string;
}

interface UsersByUtmQuery {
  limite?: number;
}

export async function getUsersByUtmSourceHandler(
  request: FastifyRequest<{ Params: UsersByUtmParams; Querystring: UsersByUtmQuery }>,
  reply: FastifyReply,
) {
  try {
    const cassandraClient = request.server.cassandra;
    const purchasesRepo = new PurchasesByUtmRepository(cassandraClient);

    const { utmSource } = request.params;
    const { limite = 20 } = request.query;

    // Buscar compras da UTM source
    const compras = await purchasesRepo.findByCampaignSource(utmSource);

    // Agrupar por usuário
    const usuariosMap = new Map<
      string,
      {
        id_usuario: string;
        timestamp_primeira_compra: Date;
        total_compras: number;
        produtos_comprados: string[];
      }
    >();

    compras.forEach((compra) => {
      const userId = compra.id_usuario.toString();

      if (usuariosMap.has(userId)) {
        const usuario = usuariosMap.get(userId)!;
        usuario.total_compras++;
        usuario.produtos_comprados.push(compra.id_produto);

        // Atualizar primeira compra se for mais antiga
        if (compra.timestamp_evento < usuario.timestamp_primeira_compra) {
          usuario.timestamp_primeira_compra = compra.timestamp_evento;
        }
      } else {
        usuariosMap.set(userId, {
          id_usuario: userId,
          timestamp_primeira_compra: compra.timestamp_evento,
          total_compras: 1,
          produtos_comprados: [compra.id_produto],
        });
      }
    });

    // Converter para array, ordenar por primeira compra e limitar
    const usuarios = Array.from(usuariosMap.values())
      .sort((a, b) => a.timestamp_primeira_compra.getTime() - b.timestamp_primeira_compra.getTime())
      .slice(0, limite)
      .map((usuario) => ({
        ...usuario,
        timestamp_primeira_compra: usuario.timestamp_primeira_compra.toISOString(),
        produtos_comprados: [...new Set(usuario.produtos_comprados)], // Remover duplicatas
      }));

    return reply.code(200).send({
      success: true,
      data: {
        utm_source: utmSource,
        total_usuarios_compraram: usuariosMap.size,
        usuarios,
      },
    });
  } catch (error: any) {
    request.log.error('Erro ao buscar usuários por UTM source:', error);
    return reply.code(500).send({
      success: false,
      error: {
        message: 'Erro interno do servidor ao buscar usuários por UTM source',
        details: error.message,
      },
    });
  }
}
