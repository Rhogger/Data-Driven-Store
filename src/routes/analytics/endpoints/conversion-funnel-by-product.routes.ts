import { FastifyRequest, FastifyReply } from 'fastify';
import { ConversionFunnelRepository } from '@repositories/cassandra/conversion-funnel/ConversionFunnelRepository';

interface ConversionFunnelByProductParams {
  produtoId: string;
}

export const getConversionFunnelByProductHandler = async (
  request: FastifyRequest<{ Params: ConversionFunnelByProductParams }>,
  reply: FastifyReply,
) => {
  try {
    const { produtoId } = request.params;
    const cassandraClient = request.server.cassandra;
    const conversionFunnelRepo = new ConversionFunnelRepository(cassandraClient);

    const stats = await conversionFunnelRepo.getConversionFunnelByProduct(produtoId);

    return reply.code(200).send({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    request.log.error('Erro ao buscar funil de conversão por produto:', error);
    return reply.code(500).send({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
    });
  }
};
