import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsRepository } from '@/repositories/analytics/AnalyticsRepository';

export async function getConversionFunnelHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const analyticsRepo = new AnalyticsRepository(request.server);

    const stats = await analyticsRepo.getConversionFunnelStats();

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    request.log.error('Erro ao buscar estatísticas do funil de conversão:', error);
    return reply.code(500).send({
      success: false,
      error: {
        message: 'Erro interno do servidor ao buscar funil de conversão',
        details: error.message,
      },
    });
  }
}
