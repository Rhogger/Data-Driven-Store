import { FastifyPluginAsync } from 'fastify';
import { RecommendationRepository } from '@/repositories/recommendation/RecommendationRepository';
import { ProductRepository } from '@repositories/product/ProductRepository';
import { CategoryRepository } from '@repositories/category/CategoryRepository';
import { BrandRepository } from '@repositories/brand/BrandRepository';
import { productRecommendationSchemas } from '../schema/recommendation.schemas';

interface ShortestPathParams {
  produtoOrigemId: string;
  produtoDestinoId: string;
}

interface ShortestPathQuery {
  maxDistancia?: number;
}

const shortestPathRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: ShortestPathParams;
    Querystring: ShortestPathQuery;
  }>('/recommendations/shortest-path/:produtoOrigemId/:produtoDestinoId', {
    schema: productRecommendationSchemas.shortestPath(),
    preHandler: fastify.authenticate,
    handler: async (request, reply) => {
      try {
        const { produtoOrigemId, produtoDestinoId } = request.params;
        const { maxDistancia = 6 } = request.query;

        if (!produtoOrigemId || produtoOrigemId.trim() === '') {
          return reply.code(400).send({
            success: false,
            error: 'ID do produto de origem é obrigatório',
            details: 'O parâmetro produtoOrigemId não pode estar vazio',
          });
        }

        if (!produtoDestinoId || produtoDestinoId.trim() === '') {
          return reply.code(400).send({
            success: false,
            error: 'ID do produto de destino é obrigatório',
            details: 'O parâmetro produtoDestinoId não pode estar vazio',
          });
        }

        if (produtoOrigemId === produtoDestinoId) {
          return reply.code(400).send({
            success: false,
            error: 'Produtos de origem e destino devem ser diferentes',
            details: 'Não é possível calcular caminho entre o mesmo produto',
          });
        }

        if (maxDistancia < 1 || maxDistancia > 10) {
          return reply.code(400).send({
            success: false,
            error: 'Distância máxima inválida',
            details: 'A distância máxima deve estar entre 1 e 10',
          });
        }

        const productRepo = new ProductRepository(fastify);
        const produtoOrigem = await productRepo.findById(produtoOrigemId);
        if (!produtoOrigem) {
          return reply.code(404).send({
            success: false,
            error: 'Produto de origem não encontrado',
          });
        }
        const produtoDestino = await productRepo.findById(produtoDestinoId);
        if (!produtoDestino) {
          return reply.code(404).send({
            success: false,
            error: 'Produto de destino não encontrado',
          });
        }

        const recommendationRepository = new RecommendationRepository(fastify);
        const caminho = await recommendationRepository.getShortestPath(
          produtoOrigemId,
          produtoDestinoId,
          maxDistancia,
        );

        if (!caminho.caminho_encontrado) {
          return reply.code(404).send({
            success: false,
            error: 'Nenhum caminho encontrado entre os produtos especificados',
          });
        }

        // Buscar nomes dos nós do caminho
        const caminhoArray = Array.isArray(caminho.caminho) ? caminho.caminho : [];
        const produtosNoCaminho = caminhoArray.filter((n: any) => n.tipo === 'produto');
        const categoriasNoCaminho = caminhoArray.filter((n: any) => n.tipo === 'categoria');
        const marcasNoCaminho = caminhoArray.filter((n: any) => n.tipo === 'marca');

        const idsProdutosCaminho = produtosNoCaminho.map((n: any) => n.id);
        const idsCategoriasCaminho = categoriasNoCaminho.map((n: any) => n.id);
        const idsMarcasCaminho = marcasNoCaminho.map((n: any) => n.id); // são nomes, não IDs

        const categoryRepo = new CategoryRepository(fastify);
        const brandRepo = new BrandRepository(fastify);

        const produtosMongo = await Promise.all(
          idsProdutosCaminho.map((id: string) => productRepo.findById(id)),
        );
        const categoriasDb = await Promise.all(
          idsCategoriasCaminho.map((id: string) => categoryRepo.findById(Number(id))),
        );
        const marcasDb = await Promise.all(
          idsMarcasCaminho.map((nome: string) => brandRepo.findByName(nome)),
        );

        const caminhoComNomes = caminhoArray.map((n: any) => {
          if (n.tipo === 'produto') {
            const idx = idsProdutosCaminho.indexOf(n.id);
            return {
              ...n,
              posicao_no_caminho: Number(n.posicao_no_caminho),
              nome: produtosMongo[idx]?.nome || null,
            };
          }
          if (n.tipo === 'categoria') {
            const idx = idsCategoriasCaminho.indexOf(n.id);
            return {
              ...n,
              posicao_no_caminho: Number(n.posicao_no_caminho),
              nome: categoriasDb[idx]?.nome || null,
            };
          }
          if (n.tipo === 'marca') {
            let nomeMarca = null;
            const idx = idsMarcasCaminho.indexOf(n.id);
            if (idx !== -1) {
              nomeMarca = marcasDb[idx]?.nome || n.id || null; // usa n.id como fallback já que é o nome
            }
            // Se ainda não encontrou, tenta buscar pelo produto anterior
            if (!nomeMarca) {
              const idxNoCaminho = caminhoArray.findIndex((el: any) => el === n);
              if (idxNoCaminho > 0 && caminhoArray[idxNoCaminho - 1].tipo === 'produto') {
                const idProdutoAnterior = caminhoArray[idxNoCaminho - 1].id;
                const idxProdutoAnterior = idsProdutosCaminho.indexOf(idProdutoAnterior);
                const produtoAnterior = produtosMongo[idxProdutoAnterior];
                if (produtoAnterior && produtoAnterior.marca) {
                  nomeMarca = produtoAnterior.marca; // marca é string no produto
                }
              }
            }
            let nomeProduto = null;
            const idxNoCaminho = caminhoArray.findIndex((el: any) => el === n);
            if (idxNoCaminho > 0 && caminhoArray[idxNoCaminho - 1].tipo === 'produto') {
              const idProdutoAnterior = caminhoArray[idxNoCaminho - 1].id;
              const idxProdutoAnterior = idsProdutosCaminho.indexOf(idProdutoAnterior);
              nomeProduto = produtosMongo[idxProdutoAnterior]?.nome || null;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...rest } = n;
            return {
              ...rest,
              posicao_no_caminho: Number(n.posicao_no_caminho),
              nome: nomeMarca,
              produto: nomeProduto,
            };
          }
          return {
            ...n,
            posicao_no_caminho: Number(n.posicao_no_caminho),
          };
        });

        const produtoOrigemNode = produtosNoCaminho[0];
        const produtoDestinoNode = produtosNoCaminho[produtosNoCaminho.length - 1];
        const produtoOrigemMongo = produtosMongo[0];
        const produtoDestinoMongo = produtosMongo[produtosMongo.length - 1];

        const caminhoConvertido = {
          ...caminho,
          distancia: Number(caminho.distancia),
          caminho: caminhoComNomes,
        };

        reply.code(200).send({
          success: true,
          data: {
            ...caminhoConvertido,
            produto_origem: {
              id_produto: produtoOrigemNode?.id || null,
              nome: produtoOrigemMongo?.nome || null,
            },
            produto_destino: {
              id_produto: produtoDestinoNode?.id || null,
              nome: produtoDestinoMongo?.nome || null,
            },
          },
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          success: false,
          error: 'Erro interno do servidor ao calcular caminho mais curto',
        });
      }
    },
  });
};

export default shortestPathRoutes;
