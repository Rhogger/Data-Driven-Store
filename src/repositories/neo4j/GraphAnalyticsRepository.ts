import { FastifyInstance } from 'fastify';
import { Session } from 'neo4j-driver';

export interface ClienteNeo4j {
  id_cliente: number;
  nome: string;
  email: string;
  telefone: string;
  data_cadastro: Date;
}

export interface ProdutoNeo4j {
  id_produto: number;
  nome: string;
  preco: number;
  descricao: string;
  estoque: number;
}

export interface CategoriaNeo4j {
  id_categoria: number;
  nome: string;
}

export interface MarcaNeo4j {
  nome: string;
}

export interface VisualizacaoNeo4j {
  cliente: ClienteNeo4j;
  produto: ProdutoNeo4j;
  data: Date;
}

export interface CompraNeo4j {
  cliente: ClienteNeo4j;
  produto: ProdutoNeo4j;
  data: Date;
  id_pedido: string;
  quantidade: number;
  valor_total: number;
}

export interface AvaliacaoNeo4j {
  cliente: ClienteNeo4j;
  produto: ProdutoNeo4j;
  nota: number;
  comentario: string;
  data: Date;
}

export interface RecomendacaoNeo4j {
  produto: string;
  score: number;
}

export class GraphAnalyticsRepository {
  constructor(private fastify: FastifyInstance) {}

  private getSession(): Session {
    return this.fastify.neo4j.session();
  }

  /**
   * Registra uma visualização de produto por um cliente
   */
  async registrarVisualizacao(id_cliente: number, id_produto: number): Promise<void> {
    const session = this.getSession();

    try {
      await session.run(
        `MATCH (c:Cliente {id_cliente: $id_cliente}), (p:Produto {id_produto: $id_produto})
         MERGE (c)-[v:VISUALIZOU]->(p)
         ON CREATE SET v.data = datetime()
         ON MATCH SET v.data = datetime()
         RETURN v`,
        { id_cliente, id_produto },
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Registra uma compra
   */
  async registrarCompra(
    id_cliente: number,
    id_produto: number,
    id_pedido: string,
    quantidade: number,
    valor_total: number,
  ): Promise<void> {
    const session = this.getSession();

    try {
      await session.run(
        `MATCH (c:Cliente {id_cliente: $id_cliente}), (p:Produto {id_produto: $id_produto})
         CREATE (c)-[:COMPROU {
           data: datetime(),
           id_pedido: $id_pedido,
           quantidade: $quantidade,
           valor_total: $valor_total
         }]->(p)`,
        { id_cliente, id_produto, id_pedido, quantidade, valor_total },
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Registra uma avaliação
   */
  async registrarAvaliacao(
    id_cliente: number,
    id_produto: number,
    nota: number,
    comentario: string,
  ): Promise<void> {
    const session = this.getSession();

    try {
      await session.run(
        `MATCH (c:Cliente {id_cliente: $id_cliente}), (p:Produto {id_produto: $id_produto})
         MERGE (c)-[a:AVALIOU]->(p)
         SET a.nota = $nota,
             a.comentario = $comentario,
             a.data = datetime()`,
        { id_cliente, id_produto, nota, comentario },
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém produtos mais visualizados
   */
  async getProdutosMaisVisualizados(
    limite: number = 10,
  ): Promise<Array<{ produto: string; visualizacoes: number }>> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (c:Cliente)-[v:VISUALIZOU]->(p:Produto)
         RETURN p.nome as produto, COUNT(v) as visualizacoes
         ORDER BY visualizacoes DESC
         LIMIT $limite`,
        { limite },
      );

      return result.records.map((record) => ({
        produto: record.get('produto'),
        visualizacoes: record.get('visualizacoes').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém produtos mais vendidos
   */
  async getProdutosMaisVendidos(
    limite: number = 10,
  ): Promise<Array<{ produto: string; vendas: number; receita: number }>> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (c:Cliente)-[comp:COMPROU]->(p:Produto)
         RETURN p.nome as produto,
                SUM(comp.quantidade) as vendas,
                SUM(comp.valor_total) as receita
         ORDER BY vendas DESC
         LIMIT $limite`,
        { limite },
      );

      return result.records.map((record) => ({
        produto: record.get('produto'),
        vendas: record.get('vendas').toNumber(),
        receita: record.get('receita').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém recomendações para um cliente baseadas em comportamento similar
   */
  async getRecomendacoes(id_cliente: number, limite: number = 5): Promise<RecomendacaoNeo4j[]> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (c1:Cliente {id_cliente: $id_cliente})-[:VISUALIZOU]->(p:Produto)<-[:VISUALIZOU]-(c2:Cliente)
         MATCH (c2)-[:VISUALIZOU]->(rec:Produto)
         WHERE NOT (c1)-[:VISUALIZOU]->(rec)
         RETURN rec.nome as produto, COUNT(*) as score
         ORDER BY score DESC
         LIMIT $limite`,
        { id_cliente, limite },
      );

      return result.records.map((record) => ({
        produto: record.get('produto'),
        score: record.get('score').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém produtos de uma categoria específica
   */
  async getProdutosPorCategoria(
    nome_categoria: string,
  ): Promise<Array<{ produto: string; preco: number; marca: string }>> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (p:Produto)-[:PERTENCE_A]->(cat:Categoria {nome: $nome_categoria})
         MATCH (p)-[:PRODUZIDO_POR]->(m:Marca)
         RETURN p.nome as produto, p.preco as preco, m.nome as marca
         ORDER BY p.preco DESC`,
        { nome_categoria },
      );

      return result.records.map((record) => ({
        produto: record.get('produto'),
        preco: record.get('preco').toNumber(),
        marca: record.get('marca'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém produtos de uma marca específica
   */
  async getProdutosPorMarca(
    nome_marca: string,
  ): Promise<Array<{ produto: string; preco: number; categoria: string }>> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (p:Produto)-[:PRODUZIDO_POR]->(m:Marca {nome: $nome_marca})
         MATCH (p)-[:PERTENCE_A]->(cat:Categoria)
         RETURN p.nome as produto, p.preco as preco, cat.nome as categoria
         ORDER BY p.preco DESC`,
        { nome_marca },
      );

      return result.records.map((record) => ({
        produto: record.get('produto'),
        preco: record.get('preco').toNumber(),
        categoria: record.get('categoria'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém clientes que compraram produtos de uma marca específica
   */
  async getClientesPorMarca(
    nome_marca: string,
  ): Promise<Array<{ cliente: string; email: string; total_gasto: number }>> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (c:Cliente)-[comp:COMPROU]->(p:Produto)-[:PRODUZIDO_POR]->(m:Marca {nome: $nome_marca})
         RETURN c.nome as cliente, c.email as email, SUM(comp.valor_total) as total_gasto
         ORDER BY total_gasto DESC`,
        { nome_marca },
      );

      return result.records.map((record) => ({
        cliente: record.get('cliente'),
        email: record.get('email'),
        total_gasto: record.get('total_gasto').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém análise de conversão (visualização -> compra)
   */
  async getAnaliseConversao(): Promise<
    Array<{ produto: string; visualizacoes: number; compras: number; taxa_conversao: number }>
  > {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (p:Produto)
         OPTIONAL MATCH (c1:Cliente)-[:VISUALIZOU]->(p)
         OPTIONAL MATCH (c2:Cliente)-[:COMPROU]->(p)
         WITH p, COUNT(DISTINCT c1) as visualizacoes, COUNT(DISTINCT c2) as compras
         WHERE visualizacoes > 0
         RETURN p.nome as produto,
                visualizacoes,
                compras,
                ROUND((compras * 100.0) / visualizacoes, 2) as taxa_conversao
         ORDER BY taxa_conversao DESC`,
      );

      return result.records.map((record) => ({
        produto: record.get('produto'),
        visualizacoes: record.get('visualizacoes').toNumber(),
        compras: record.get('compras').toNumber(),
        taxa_conversao: record.get('taxa_conversao').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém produtos com melhores avaliações
   */
  async getProdutosMelhorAvaliados(
    limite: number = 10,
  ): Promise<Array<{ produto: string; nota_media: number; total_avaliacoes: number }>> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (c:Cliente)-[a:AVALIOU]->(p:Produto)
         RETURN p.nome as produto,
                ROUND(AVG(a.nota), 2) as nota_media,
                COUNT(a) as total_avaliacoes
         ORDER BY nota_media DESC, total_avaliacoes DESC
         LIMIT $limite`,
        { limite },
      );

      return result.records.map((record) => ({
        produto: record.get('produto'),
        nota_media: record.get('nota_media').toNumber(),
        total_avaliacoes: record.get('total_avaliacoes').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém estatísticas gerais do grafo
   */
  async getEstatisticasGerais(): Promise<{
    total_clientes: number;
    total_produtos: number;
    total_categorias: number;
    total_marcas: number;
    total_visualizacoes: number;
    total_compras: number;
    total_avaliacoes: number;
  }> {
    const session = this.getSession();

    try {
      const result = await session.run(
        `MATCH (c:Cliente) WITH COUNT(c) as clientes
         MATCH (p:Produto) WITH clientes, COUNT(p) as produtos
         MATCH (cat:Categoria) WITH clientes, produtos, COUNT(cat) as categorias
         MATCH (m:Marca) WITH clientes, produtos, categorias, COUNT(m) as marcas
         MATCH ()-[v:VISUALIZOU]->() WITH clientes, produtos, categorias, marcas, COUNT(v) as visualizacoes
         MATCH ()-[comp:COMPROU]->() WITH clientes, produtos, categorias, marcas, visualizacoes, COUNT(comp) as compras
         MATCH ()-[a:AVALIOU]->() WITH clientes, produtos, categorias, marcas, visualizacoes, compras, COUNT(a) as avaliacoes
         RETURN clientes, produtos, categorias, marcas, visualizacoes, compras, avaliacoes`,
      );

      const record = result.records[0];
      return {
        total_clientes: record.get('clientes').toNumber(),
        total_produtos: record.get('produtos').toNumber(),
        total_categorias: record.get('categorias').toNumber(),
        total_marcas: record.get('marcas').toNumber(),
        total_visualizacoes: record.get('visualizacoes').toNumber(),
        total_compras: record.get('compras').toNumber(),
        total_avaliacoes: record.get('avaliacoes').toNumber(),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Inicializa a estrutura do Neo4j (constraints e índices)
   */
  async inicializarEstrutura(): Promise<string> {
    const session = this.getSession();

    try {
      // Criar constraints e índices
      const constraintsAndIndexes = [
        'CREATE CONSTRAINT cliente_id_unique IF NOT EXISTS FOR (c:Cliente) REQUIRE c.id_cliente IS UNIQUE',
        'CREATE CONSTRAINT produto_id_unique IF NOT EXISTS FOR (p:Produto) REQUIRE p.id_produto IS UNIQUE',
        'CREATE CONSTRAINT categoria_id_unique IF NOT EXISTS FOR (cat:Categoria) REQUIRE cat.id_categoria IS UNIQUE',
        'CREATE CONSTRAINT marca_nome_unique IF NOT EXISTS FOR (m:Marca) REQUIRE m.nome IS UNIQUE',
        'CREATE INDEX cliente_nome_index IF NOT EXISTS FOR (c:Cliente) ON (c.nome)',
        'CREATE INDEX cliente_email_index IF NOT EXISTS FOR (c:Cliente) ON (c.email)',
        'CREATE INDEX produto_nome_index IF NOT EXISTS FOR (p:Produto) ON (p.nome)',
        'CREATE INDEX produto_preco_index IF NOT EXISTS FOR (p:Produto) ON (p.preco)',
        'CREATE INDEX categoria_nome_index IF NOT EXISTS FOR (cat:Categoria) ON (cat.nome)',
        'CREATE INDEX produto_categoria_preco_index IF NOT EXISTS FOR (p:Produto) ON (p.preco, p.nome)',
        'CREATE INDEX visualizacao_data_index IF NOT EXISTS FOR ()-[v:VISUALIZOU]-() ON (v.data)',
        'CREATE INDEX compra_data_index IF NOT EXISTS FOR ()-[c:COMPROU]-() ON (c.data)',
        'CREATE INDEX avaliacao_nota_index IF NOT EXISTS FOR ()-[a:AVALIOU]-() ON (a.nota)',
      ];

      for (const constraint of constraintsAndIndexes) {
        await session.run(constraint);
      }

      return 'Estrutura de grafos do Neo4j criada com sucesso! Constraints e índices configurados.';
    } finally {
      await session.close();
    }
  }

  /**
   * Limpa todos os dados do grafo (use com cuidado!)
   */
  async limparDados(): Promise<string> {
    const session = this.getSession();

    try {
      await session.run('MATCH (n) DETACH DELETE n');
      return 'Todos os dados do Neo4j foram removidos.';
    } finally {
      await session.close();
    }
  }
}
