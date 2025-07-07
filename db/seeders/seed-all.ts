/* eslint-disable quotes */
/* eslint-disable no-console */
import { MongoClient, ObjectId } from 'mongodb';
import { Pool, PoolClient } from 'pg';
import { databaseConfig } from '../../src/config/database';

// Tipos para clareza
type Product = {
  _id: ObjectId;
  nome: string;
  descricao: string;
  preco: number;
  categorias: number[];
  estoque: number;
  reservado: number;
  disponivel: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
};

const TOTAL_PRODUCTS = 25;
const TOTAL_CLIENTS = 20;
const TOTAL_ORDERS = 30;

async function cleanAllTables(pgPool: Pool) {
  console.log('🧹 [PG] Limpando todas as tabelas de dados...');
  await pgPool.query(
    `TRUNCATE TABLE
      itens_pedido,
      transacoes_financeiras,
      pedidos,
      enderecos,
      clientes,
      cidades,
      estados,
      categorias,
      metodos_pagamento
    RESTART IDENTITY CASCADE;`,
  );
  console.log('✅ [PG] Todas as tabelas foram limpas.');
}

async function seedPostgresBase(pgPool: Pool): Promise<number[]> {
  console.log('🌱 [PG] Iniciando seed base (Estados, Cidades, Categorias, Clientes)...');
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // 1. Estados
    const estadosResult = await client.query(
      "INSERT INTO estados (nome, uf) VALUES ('São Paulo', 'SP'), ('Rio de Janeiro', 'RJ'), ('Minas Gerais', 'MG'), ('Goiás', 'GO'), ('Paraná', 'PR'), ('Bahia', 'BA') ON CONFLICT (uf) DO UPDATE SET nome = EXCLUDED.nome RETURNING id_estado, uf",
    );
    const estadosMap = new Map(estadosResult.rows.map((r) => [r.uf, r.id_estado]));
    console.log('   -> Estados inseridos.');

    // 2. Cidades
    const cidadesData = [
      { nome: 'São Paulo', uf: 'SP' },
      { nome: 'Campinas', uf: 'SP' },
      { nome: 'Rio de Janeiro', uf: 'RJ' },
      { nome: 'Niterói', uf: 'RJ' },
      { nome: 'Belo Horizonte', uf: 'MG' },
      { nome: 'Goiânia', uf: 'GO' },
      { nome: 'Rio Verde', uf: 'GO' },
      { nome: 'Curitiba', uf: 'PR' },
      { nome: 'Salvador', uf: 'BA' },
    ];
    for (const cidade of cidadesData) {
      // Usando ON CONFLICT para tornar a operação segura para re-execução
      await client.query(
        `
        INSERT INTO cidades (nome, id_estado)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
        [cidade.nome, estadosMap.get(cidade.uf)],
      );
    }
    console.log('   -> Cidades inseridas.');

    // 3. Métodos de Pagamento
    await client.query(
      "INSERT INTO metodos_pagamento (nome_pagamento) VALUES ('Cartão de Crédito'), ('PIX'), ('Boleto Bancário') ON CONFLICT DO NOTHING",
    );
    console.log('   -> Métodos de pagamento inseridos.');

    // 4. Categorias
    const categoriasBase = [
      'Eletrônicos',
      'Livros',
      'Roupas',
      'Casa e Cozinha',
      'Esportes e Lazer',
      'Ferramentas',
    ];
    const subcategorias = {
      Eletrônicos: ['Smartphones', 'Notebooks', 'Fones de Ouvido'],
      Livros: ['Ficção Científica', 'Fantasia', 'Técnico'],
      Roupas: ['Camisetas', 'Calças'],
    };

    for (const nomeCat of categoriasBase) {
      const res = await client.query(
        'INSERT INTO categorias (nome) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id_categoria',
        [nomeCat],
      );
      if (res.rows.length > 0 && subcategorias[nomeCat as keyof typeof subcategorias]) {
        const idPai = res.rows[0].id_categoria;
        for (const nomeSub of subcategorias[nomeCat as keyof typeof subcategorias]) {
          await client.query(
            'INSERT INTO categorias (nome, id_categoria_pai) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [nomeSub, idPai],
          );
        }
      }
    }
    console.log('   -> Categorias inseridas.');

    const allCategoriesResult = await client.query('SELECT id_categoria FROM categorias');
    const categoryIds = allCategoriesResult.rows.map((r) => r.id_categoria);

    // 5. Clientes e Endereços
    const nomes = [
      'Ana',
      'Bruno',
      'Carla',
      'Daniel',
      'Elisa',
      'Fábio',
      'Gisele',
      'Hugo',
      'Íris',
      'João',
      'Lia',
      'Marcos',
    ];
    const sobrenomes = [
      'Silva',
      'Costa',
      'Mendes',
      'Oliveira',
      'Ferreira',
      'Gomes',
      'Martins',
      'Lima',
      'Araújo',
      'Pereira',
    ];
    const ruas = [
      'Rua das Flores',
      'Avenida Paulista',
      'Rua da Praia',
      'Avenida Brasil',
      'Rua 25 de Março',
    ];
    const { rows: cidades } = await client.query('SELECT id_cidade FROM cidades');
    const cidadeIds = cidades.map((c) => c.id_cidade);

    for (let i = 1; i <= TOTAL_CLIENTS; i++) {
      const clienteResult = await client.query(
        'INSERT INTO clientes (nome, email, cpf, telefone) VALUES ($1, $2, $3, $4) RETURNING id_cliente',
        [
          `${nomes[i % nomes.length]} ${sobrenomes[i % sobrenomes.length]}`,
          `cliente${i}@email.com`,
          `${String(i).padStart(3, '0')}.${String(i).padStart(3, '0')}.${String(i).padStart(3, '0')}-${String(i).padStart(2, '0')}`,
          `(11) 9${String(i).padStart(4, '0')}-${String(i).padStart(4, '0')}`,
        ],
      );
      const clienteId = clienteResult.rows[0].id_cliente;

      await client.query(
        'INSERT INTO enderecos (id_cliente, id_cidade, logradouro, numero, cep, tipo_endereco, bairro) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          clienteId,
          cidadeIds[Math.floor(Math.random() * cidadeIds.length)],
          ruas[i % ruas.length],
          String(i),
          '12345-000',
          'Entrega',
          'Centro',
        ],
      );
    }
    console.log(`   -> ${TOTAL_CLIENTS} Clientes e Endereços inseridos.`);

    await client.query('COMMIT');
    return categoryIds;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  console.log('✅ [PG] Seed base (clientes, endereços, etc.) concluído.');
}

// Função auxiliar para pegar N categorias aleatórias e únicas
function getRandomCategories(allCategoryIds: number[], count: number): number[] {
  const shuffled = [...allCategoryIds].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedMongo(mongoClient: MongoClient, categoryIds: number[]): Promise<Product[]> {
  console.log('🌱 [Mongo] Iniciando seed de produtos...');
  const db = mongoClient.db(databaseConfig.mongodb.database);
  const productCollection = db.collection('products');

  await productCollection.deleteMany({});
  console.log('🧹 [Mongo] Coleção de produtos limpa.');

  const productsToInsert: Omit<Product, '_id' | 'disponivel'>[] = [];
  const productNames = [
    'Notebook Pro',
    'Smartphone X',
    'Livro de Ficção',
    'Camiseta Básica',
    'Tênis de Corrida',
    'Fone de Ouvido',
    'Mochila Executiva',
    'Garrafa Térmica',
    'Cadeira Gamer',
    'Monitor 4K',
  ];
  const marcas = ['TechPro', 'GlobalData', 'OfficeComfort', 'GamerX', 'Bookworm', 'StyleFit'];

  for (let i = 0; i < TOTAL_PRODUCTS; i++) {
    const estoque = Math.floor(Math.random() * 200);
    productsToInsert.push({
      nome: `${productNames[i % productNames.length]} v${Math.floor(i / productNames.length) + 1}`,
      descricao: `Descrição detalhada do produto ${i + 1}. Marca ${marcas[i % marcas.length]}. Este item possui características únicas e é feito com materiais de alta qualidade.`,
      preco: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
      categorias: getRandomCategories(categoryIds, Math.floor(Math.random() * 3) + 1), // Pega de 1 a 3 categorias
      estoque: estoque,
      reservado: 0, // Começa com 0
      tags: ['novo', 'popular', 'oferta'].slice(0, Math.floor(Math.random() * 3) + 1),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Adiciona o campo 'disponivel' que é derivado
  const finalProducts = productsToInsert.map((p) => ({
    ...p,
    disponivel: p.estoque - p.reservado,
  }));

  const result = await productCollection.insertMany(finalProducts);
  console.log(`✅ [Mongo] ${result.insertedCount} produtos inseridos.`);

  const insertedProducts = await db.collection<Product>('products').find({}).toArray();
  if (insertedProducts.length === 0) {
    throw new Error(
      '[Mongo] Falha crítica: Nenhum produto foi criado ou encontrado após a inserção.',
    );
  }
  return insertedProducts;
}

async function seedPostgresOrders(pgPool: Pool, products: Product[]) {
  console.log('🌱 [PG] Iniciando seed de Pedidos...');
  const statusPedidosArr = ['Pendente', 'Processando', 'Enviado', 'Entregue', 'Cancelado'];

  for (let i = 1; i <= TOTAL_ORDERS; i++) {
    const pgClient: PoolClient = await pgPool.connect();
    try {
      await pgClient.query('BEGIN');

      const randomClienteId = Math.floor(Math.random() * TOTAL_CLIENTS) + 1;
      const { rows: enderecoRows } = await pgClient.query(
        'SELECT id_endereco FROM enderecos WHERE id_cliente = $1 LIMIT 1',
        [randomClienteId],
      );
      if (enderecoRows.length === 0) {
        console.warn(`\nSkipping order for client ${randomClienteId} - no address found.`);
        await pgClient.query('ROLLBACK');
        continue;
      }
      const randomEnderecoId = enderecoRows[0].id_endereco;
      const randomStatusPedido = statusPedidosArr[Math.floor(Math.random() * 5)];
      const randomDataPedido = new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
      );

      const pedidoResult = await pgClient.query(
        'INSERT INTO pedidos (id_cliente, id_endereco, status_pedido, data_pedido, valor_total) VALUES ($1, $2, $3, $4, 0) RETURNING id_pedido',
        [randomClienteId, randomEnderecoId, randomStatusPedido, randomDataPedido],
      );
      const pedidoId = pedidoResult.rows[0].id_pedido;
      let pedidoValorTotal = 0;

      const numItensPedido = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItensPedido; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const itemQtd = Math.floor(Math.random() * 3) + 1;
        const itemSubtotal = randomProduct.preco * itemQtd;
        await pgClient.query(
          'INSERT INTO itens_pedido (id_pedido, id_produto, id_categoria, preco_unitario, quantidade, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            pedidoId,
            randomProduct._id.toHexString(),
            randomProduct.categorias[0], // Usa a primeira categoria do array como a principal
            randomProduct.preco,
            itemQtd,
            itemSubtotal,
          ],
        );
        pedidoValorTotal += itemSubtotal;
      }

      await pgClient.query('UPDATE pedidos SET valor_total = $1 WHERE id_pedido = $2', [
        pedidoValorTotal.toFixed(2),
        pedidoId,
      ]);

      const randomStatusTransacao =
        randomStatusPedido === 'Cancelado'
          ? 'Estornada'
          : randomStatusPedido === 'Pendente'
            ? 'Pendente'
            : 'Aprovada';
      await pgClient.query(
        'INSERT INTO transacoes_financeiras (id_pedido, id_metodo_pagamento, valor_transacao, status_transacao, data_transacao) VALUES ($1, $2, $3, $4, $5)',
        [
          pedidoId,
          Math.floor(Math.random() * 3) + 1,
          pedidoValorTotal.toFixed(2),
          randomStatusTransacao,
          new Date(randomDataPedido.getTime() + 60000),
        ],
      );

      await pgClient.query('COMMIT');
      process.stdout.write(
        `\r   -> Pedido ${i}/${TOTAL_ORDERS} criado com sucesso. ID: ${pedidoId}`,
      );
    } catch (error) {
      await pgClient.query('ROLLBACK');
      console.error(`\n❌ Erro ao criar pedido ${i}. A transação foi revertida.`, error);
      throw error;
    } finally {
      pgClient.release();
    }
  }
  console.log(`\n✅ [PG] ${TOTAL_ORDERS} pedidos inseridos com sucesso.`);
}

async function main() {
  console.log('🚀 Iniciando processo de seeding orquestrado...');
  const mongoClient = new MongoClient(databaseConfig.mongodb.uri);
  const pgPool = new Pool(databaseConfig.postgres);

  try {
    await mongoClient.connect();
    console.log('🔗 Conectado ao MongoDB.');

    await pgPool.query('SELECT NOW()');
    console.log('🔗 Conectado ao PostgreSQL.');

    await cleanAllTables(pgPool);
    const pgCategoryIds = await seedPostgresBase(pgPool);
    const createdProducts = await seedMongo(mongoClient, pgCategoryIds);
    await seedPostgresOrders(pgPool, createdProducts);

    console.log('\n🎉 Seeding orquestrado concluído com sucesso!');
  } finally {
    await mongoClient.close();
    await pgPool.end();
    console.log('🔌 Conexões com os bancos de dados fechadas.');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ocorreu um erro fatal durante o seeding.', error);
    process.exit(1);
  });
