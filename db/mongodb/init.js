// MongoDB Initialization Script
// Este script é executado quando o MongoDB inicia pela primeira vez

// Conectar ao banco da aplicação usando variável padrão do MongoDB
const dbName = 'datadriven_store';
db = db.getSiblingDB(dbName);

// Criar usuário específico para a aplicação
// Nota: Este script usa valores fixos porque o MongoDB não expõe variáveis
// customizadas (como MONGO_APP_USER) para scripts de inicialização.
// Apenas MONGO_INITDB_DATABASE, MONGO_INITDB_ROOT_USERNAME e MONGO_INITDB_ROOT_PASSWORD
// estão disponíveis por padrão.
const appUser = 'app_user';
const appPassword = 'app_password123';

db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [
    {
      role: 'readWrite',
      db: dbName,
    },
  ],
});

print(`✅ Usuário da aplicação '${appUser}' criado com sucesso no banco '${dbName}'`);

// Collection: products
print('📦 Configurando collection products...');

// Criar indexes para otimizar consultas
db.products.createIndex({ categoryId: 1 }, { name: 'idx_products_categoryId' });
db.products.createIndex(
  { name: 'text', description: 'text' },
  { name: 'idx_products_text_search' },
);
db.products.createIndex({ tags: 1 }, { name: 'idx_products_tags' });
db.products.createIndex({ price: 1 }, { name: 'idx_products_price' });
db.products.createIndex({ stock: 1 }, { name: 'idx_products_stock' });
db.products.createIndex({ createdAt: -1 }, { name: 'idx_products_created_desc' });

// Validação de schema para products
db.runCommand({
  collMod: 'products',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price', 'categoryId', 'stock'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Nome do produto é obrigatório e deve ter entre 1 e 200 caracteres',
        },
        description: {
          bsonType: 'string',
          maxLength: 1000,
          description: 'Descrição opcional com máximo de 1000 caracteres',
        },
        price: {
          bsonType: 'double',
          minimum: 0,
          description: 'Preço deve ser um número positivo',
        },
        categoryId: {
          bsonType: 'string',
          minLength: 1,
          description: 'ID da categoria é obrigatório',
        },
        stock: {
          bsonType: 'int',
          minimum: 0,
          description: 'Estoque deve ser um número inteiro não negativo',
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string',
          },
          description: 'Tags devem ser um array de strings',
        },
        createdAt: {
          bsonType: 'date',
          description: 'Data de criação',
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Data de atualização',
        },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

print('✅ Collection products configurada com indexes e validação');

// ===============================================================================
// Collection: perfis_usuario (para o futuro)
// ===============================================================================
print('👤 Configurando collection perfis_usuario...');

// Indexes para perfis de usuário
db.perfis_usuario.createIndex({ id_cliente: 1 }, { unique: true, name: 'idx_perfis_id_cliente' });
db.perfis_usuario.createIndex(
  { 'preferencias.categorias_favoritas': 1 },
  { name: 'idx_perfis_categorias_favoritas' },
);
db.perfis_usuario.createIndex(
  { historico_navegacao_recente: -1 },
  { name: 'idx_perfis_historico_recente' },
);

// Validação de schema para perfis_usuario
db.runCommand({
  collMod: 'perfis_usuario',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id_cliente'],
      properties: {
        id_cliente: {
          bsonType: 'int',
          description: 'ID do cliente é obrigatório',
        },
        preferencias: {
          bsonType: 'object',
          description: 'Documento com preferências do usuário',
        },
        dados_demograficos_complementares: {
          bsonType: 'object',
          description: 'Dados demográficos adicionais',
        },
        historico_navegacao_recente: {
          bsonType: 'array',
          items: {
            bsonType: 'objectId',
          },
          description: 'Array de ObjectIds dos produtos visualizados recentemente',
        },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

print('✅ Collection perfis_usuario configurada');

// ===============================================================================
// FINALIZANDO CONFIGURAÇÃO
// ===============================================================================

// Exibir estatísticas finais
print('\n📊 ESTATÍSTICAS DO BANCO:');
print(`Products collection - Indexes: ${db.products.getIndexes().length}`);
print(`Perfis_usuario collection - Indexes: ${db.perfis_usuario.getIndexes().length}`);

print('\n🎉 Inicialização do MongoDB concluída com sucesso!');
print('\n📋 INFORMAÇÕES DE CONEXÃO:');
print(`- Banco de dados: ${dbName}`);
print(`- Usuário da aplicação: ${appUser}`);
print('\n⚡ O banco está pronto para uso!');
