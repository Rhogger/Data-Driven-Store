print('🌱 Iniciando o processo de seeding para o MongoDB...');

const dbName = 'datadriven_store';
db = db.getSiblingDB(dbName);

print('📦 Populando a collection "products"...');

try {
  db.products.deleteMany({});

  const products = [
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a1'),
      nome: 'Smartphone Modelo X',
      descricao: 'O mais recente smartphone com câmera de 108MP e tela AMOLED.',
      marca: 'TechBrand',
      preco: 899.99,
      id_categoria: 7, // Smartphones
      estoque: 150,
      reservado: 0,
      disponivel: 150,
      atributos: { cor: 'Preto Grafite', armazenamento: '256GB', ram: '8GB' },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a2'),
      nome: 'Notebook Pro',
      descricao: 'Notebook de alta performance para profissionais criativos.',
      marca: 'PowerBook',
      preco: 1599.99,
      id_categoria: 8, // Notebooks
      estoque: 80,
      reservado: 0,
      disponivel: 80,
      atributos: { processador: 'M3 Pro', armazenamento: '512GB SSD', ram: '16GB' },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a3'),
      nome: 'Livro: Duna',
      descricao: 'Um clássico da ficção científica por Frank Herbert.',
      marca: 'Editora Aleph',
      preco: 49.9,
      id_categoria: 9,
      estoque: 200,
      reservado: 0,
      disponivel: 200,
      atributos: { autor: 'Frank Herbert', paginas: 680 },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a4'),
      nome: 'Camiseta Básica',
      descricao: 'Camiseta de algodão com corte clássico.',
      marca: 'Style Co.',
      preco: 79.9,
      id_categoria: 3,
      estoque: 500,
      reservado: 0,
      disponivel: 500,
      atributos: { cor: 'Branca', tamanho: 'M', material: 'Algodão' },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a5'),
      nome: 'Jogo de Toalhas',
      descricao: 'Jogo de toalhas de banho e rosto 100% algodão.',
      marca: 'Casa Conforto',
      preco: 99.9,
      id_categoria: 10,
      estoque: 120,
      reservado: 0,
      disponivel: 120,
      atributos: { pecas: 4, cor: 'Azul Marinho' },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a6'),
      nome: 'Whey Protein',
      descricao: 'Suplemento de proteína para atletas.',
      marca: 'FitLife',
      preco: 29.99,
      id_categoria: 6,
      estoque: 250,
      reservado: 0,
      disponivel: 250,
      atributos: { sabor: 'Chocolate', peso: '900g' },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a7'),
      nome: 'Tênis de Corrida',
      preco: 129.9,
      id_categoria: 5,
      estoque: 180,
      reservado: 0,
      disponivel: 180,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a8'),
      nome: 'Monitor Gamer 27"',
      preco: 349.0,
      id_categoria: 1,
      estoque: 90,
      reservado: 0,
      disponivel: 90,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4a9'),
      nome: 'Cadeira de Escritório Ergonômica',
      preco: 4500.0,
      id_categoria: 4,
      estoque: 60,
      reservado: 0,
      disponivel: 60,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      _id: ObjectId('60d5ec49e0d3f4a3c8a8b4aa'),
      nome: 'Caneca Personalizada',
      descricao: 'Caneca de cerâmica com design exclusivo.',
      marca: 'Artesanal',
      preco: 19.99,
      id_categoria: 4,
      estoque: 300,
      reservado: 0,
      disponivel: 300,
      atributos: { material: 'Cerâmica', capacidade: '325ml' },
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const insertResult = db.products.insertMany(products);
  print(
    `✅ ${insertResult.insertedIds.length} produtos inseridos com sucesso na collection "products".`,
  );
} catch (e) {
  print('❌ Erro ao popular a collection "products":');
  printjson(e);
}

print('\n🎉 Processo de seeding para o MongoDB concluído!');
