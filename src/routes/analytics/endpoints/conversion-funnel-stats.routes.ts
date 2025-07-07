import { FastifyRequest, FastifyReply } from 'fastify';
import { ConversionFunnelRepository } from '@/repositories/conversion-funnel/ConversionFunnelRepository';

export const getConversionFunnelStatsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const cassandraClient = request.server.cassandra;
    const conversionFunnelRepo = new ConversionFunnelRepository(cassandraClient);

    const stats = await conversionFunnelRepo.getConversionFunnelStats();

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    request.log.error('Erro ao buscar estatísticas do funil de conversão:', error);
    return reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
    });
  }
};
