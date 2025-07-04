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
db.products.createIndex({ id_categoria: 1 }, { name: 'idx_products_id_categoria' });
db.products.createIndex({ nome: 'text', descricao: 'text' }, { name: 'idx_products_text_search' });
db.products.createIndex({ marca: 1 }, { name: 'idx_products_marca' });
db.products.createIndex({ preco: 1 }, { name: 'idx_products_preco' });
db.products.createIndex({ estoque: 1 }, { name: 'idx_products_estoque' });
db.products.createIndex({ disponivel: 1 }, { name: 'idx_products_disponivel' });
db.products.createIndex({ created_at: -1 }, { name: 'idx_products_created_desc' });

// Validação de schema para products
db.runCommand({
  collMod: 'products',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['nome', 'preco', 'id_categoria', 'estoque'],
      properties: {
        nome: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Nome do produto é obrigatório e deve ter entre 1 e 200 caracteres',
        },
        descricao: {
          bsonType: 'string',
          maxLength: 1000,
          description: 'Descrição opcional com máximo de 1000 caracteres',
        },
        marca: {
          bsonType: 'string',
          maxLength: 100,
          description: 'Marca do produto',
        },
        preco: {
          bsonType: ['double', 'decimal'],
          minimum: 0,
          description: 'Preço deve ser um número positivo',
        },
        id_categoria: {
          bsonType: 'int',
          minimum: 1,
          description: 'ID da categoria é obrigatório e deve ser um inteiro positivo',
        },
        estoque: {
          bsonType: 'int',
          minimum: 0,
          description: 'Quantidade total de produtos no estoque',
        },
        reservado: {
          bsonType: 'int',
          minimum: 0,
          description: 'Quantidade de produtos reservados por clientes',
        },
        disponivel: {
          bsonType: 'int',
          minimum: 0,
          description: 'Quantidade disponível (estoque - reservado) - calculado automaticamente',
        },
        atributos: {
          bsonType: 'object',
          description: 'Documento com atributos específicos do produto (ex: cor, tamanho, etc)',
        },
        avaliacoes: {
          bsonType: 'object',
          description: 'Documento com informações de avaliações do produto',
        },
        created_at: {
          bsonType: 'date',
          description: 'Data de criação',
        },
        updated_at: {
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
