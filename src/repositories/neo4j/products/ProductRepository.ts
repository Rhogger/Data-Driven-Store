import { Driver, Session } from 'neo4j-driver';
import {
  Product,
  CreateNodeResult,
  CreateRelationshipResult,
  DeleteNodeResult,
  CategoryAssociation,
  CreatedByRelation,
} from '../interfaces/ModelInterfaces';
import { CategoriaRepository } from '../categories/CategoryRepository';
import { MarcaRepository } from '../brand/BrandRepository';

export class ProdutoRepository {
  private driver: Driver;
  private categoriaRepository: CategoriaRepository;
  private marcaRepository: MarcaRepository;

  constructor(
    driver: Driver,
    categoriaRepository: CategoriaRepository,
    marcaRepository: MarcaRepository,
  ) {
    this.driver = driver;
    this.categoriaRepository = categoriaRepository;
    this.marcaRepository = marcaRepository;
  }

  /**
   * Criar um nó de Produto
   */
  async createProduto(produto: Product): Promise<CreateNodeResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        CREATE (p:Produto {
          id_produto: $id_produto,
          nome: $nome,
          descricao: $descricao,
          preco: $preco,
          estoque: $estoque,
          ativo: $ativo,
          data_criacao: $data_criacao
        })
        RETURN p.id_produto as id_produto
      `;

      const result = await session.run(query, {
        id_produto: produto.id_produto,
        nome: produto.nome,
        descricao: produto.descricao || null,
        preco: produto.preco,
        estoque: produto.estoque,
        ativo: produto.ativo,
        data_criacao: produto.data_criacao,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          created: true,
          message: 'Produto criado com sucesso',
          id: result.records[0].get('id_produto'),
        };
      }

      return {
        success: false,
        created: false,
        message: 'Falha ao criar produto',
      };
    } catch (error: any) {
      return {
        success: false,
        created: false,
        message: `Erro ao criar produto: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Criar a relação PERTENCE_A de Produto para Categoria
   */
  async createPertenceARelation(
    id_produto: string,
    id_categoria: string,
    dadosRelacao?: CategoryAssociation,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (p:Produto {id_produto: $id_produto})
        MATCH (c:Categoria {id_categoria: $id_categoria})
        CREATE (p)-[r:PERTENCE_A {
          categoria_principal: $categoria_principal
        }]->(c)
        RETURN p.id_produto as produto_id, c.id_categoria as categoria_id
      `;

      const result = await session.run(query, {
        id_produto,
        id_categoria,
        categoria_principal: dadosRelacao?.categoria_principal || false,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação PERTENCE_A criada com sucesso',
          from_node: id_produto,
          to_node: id_categoria,
          relationship_type: 'PERTENCE_A',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação PERTENCE_A - Produto ou Categoria não encontrado',
        from_node: id_produto,
        to_node: id_categoria,
        relationship_type: 'PERTENCE_A',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação PERTENCE_A: ${error.message}`,
        from_node: id_produto,
        to_node: id_categoria,
        relationship_type: 'PERTENCE_A',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Criar a relação PRODUZIDO_POR de Produto para Marca
   */
  async createProduzidoPorRelation(
    id_produto: string,
    id_marca: string,
    dadosRelacao?: CreatedByRelation,
  ): Promise<CreateRelationshipResult> {
    const session: Session = this.driver.session();

    try {
      const query = `
        MATCH (p:Produto {id_produto: $id_produto})
        MATCH (m:Marca {id_marca: $id_marca})
        CREATE (p)-[r:PRODUZIDO_POR {
          data_lancamento: $data_lancamento
        }]->(m)
        RETURN p.id_produto as produto_id, m.id_marca as marca_id
      `;

      const result = await session.run(query, {
        id_produto,
        id_marca,
        data_lancamento: dadosRelacao?.data_lancamento || null,
      });

      if (result.records.length > 0) {
        return {
          success: true,
          relationship_created: true,
          message: 'Relação PRODUZIDO_POR criada com sucesso',
          from_node: id_produto,
          to_node: id_marca,
          relationship_type: 'PRODUZIDO_POR',
        };
      }

      return {
        success: false,
        relationship_created: false,
        message: 'Falha ao criar relação PRODUZIDO_POR - Produto ou Marca não encontrado',
        from_node: id_produto,
        to_node: id_marca,
        relationship_type: 'PRODUZIDO_POR',
      };
    } catch (error: any) {
      return {
        success: false,
        relationship_created: false,
        message: `Erro ao criar relação PRODUZIDO_POR: ${error.message}`,
        from_node: id_produto,
        to_node: id_marca,
        relationship_type: 'PRODUZIDO_POR',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Deletar Produto (deletando somente o nó Produto e todas as suas relações)
   * E deletar categorias e marcas órfãs (que não têm mais relações com outros produtos)
   */
  async deleteProduto(id_produto: string): Promise<DeleteNodeResult> {
    const session: Session = this.driver.session();

    try {
      // Primeiro, buscar as categorias e marcas relacionadas ao produto antes de deletá-lo
      const findRelatedQuery = `
        MATCH (p:Produto {id_produto: $id_produto})
        OPTIONAL MATCH (p)-[:PERTENCE_A]->(c:Categoria)
        OPTIONAL MATCH (p)-[:PRODUZIDO_POR]->(m:Marca)
        RETURN collect(DISTINCT c.id_categoria) as categorias, collect(DISTINCT m.id_marca) as marcas
      `;

      const relatedResult = await session.run(findRelatedQuery, { id_produto });

      if (relatedResult.records.length === 0) {
        return {
          success: false,
          deleted: false,
          message: 'Produto não encontrado',
        };
      }

      const categorias = relatedResult.records[0]
        .get('categorias')
        .filter((id: any) => id !== null);
      const marcas = relatedResult.records[0].get('marcas').filter((id: any) => id !== null);

      // Deletar o produto e suas relações
      const deleteProductQuery = `
        MATCH (p:Produto {id_produto: $id_produto})
        OPTIONAL MATCH (p)-[r]-()
        WITH p, count(r) as rel_count
        DETACH DELETE p
        RETURN rel_count
      `;

      const deleteResult = await session.run(deleteProductQuery, { id_produto });

      if (deleteResult.records.length === 0) {
        return {
          success: false,
          deleted: false,
          message: 'Produto não encontrado',
        };
      }

      const relationshipsDeleted = deleteResult.records[0].get('rel_count');

      // Agora tentar deletar categorias órfãs
      const categoriasDeletedMessages: string[] = [];
      for (const categoriaId of categorias) {
        try {
          const deleteResult = await this.categoriaRepository.deleteCategoria(categoriaId);
          if (deleteResult.deleted) {
            categoriasDeletedMessages.push(`Categoria ${categoriaId} deletada (órfã)`);
          }
        } catch {
          // Ignora erros de categoria, pois pode não estar órfã
        }
      }

      // Agora tentar deletar marcas órfãs
      const marcasDeletedMessages: string[] = [];
      for (const marcaId of marcas) {
        try {
          const deleteResult = await this.marcaRepository.deleteMarca(marcaId);
          if (deleteResult.deleted) {
            marcasDeletedMessages.push(`Marca ${marcaId} deletada (órfã)`);
          }
        } catch {
          // Ignora erros de marca, pois pode não estar órfã
        }
      }

      let message = 'Produto e suas relações deletados com sucesso';
      if (categoriasDeletedMessages.length > 0) {
        message += `. ${categoriasDeletedMessages.join(', ')}`;
      }
      if (marcasDeletedMessages.length > 0) {
        message += `. ${marcasDeletedMessages.join(', ')}`;
      }

      return {
        success: true,
        deleted: true,
        message,
        relationships_deleted: relationshipsDeleted,
      };
    } catch (error: any) {
      return {
        success: false,
        deleted: false,
        message: `Erro ao deletar produto: ${error.message}`,
      };
    } finally {
      await session.close();
    }
  }
}
