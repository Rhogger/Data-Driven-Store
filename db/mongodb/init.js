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
db.products.createIndex({ categorias: 1 }, { name: 'idx_products_categorias' });
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
      required: ['nome', 'preco', 'categorias', 'estoque'],
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
        categorias: {
          bsonType: 'array',
          minItems: 1,
          description: 'Deve conter um array de IDs de categoria',
          items: {
            bsonType: 'int',
            minimum: 1,
            description: 'ID da categoria deve ser um inteiro positivo',
          },
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
          bsonType: 'array',
          description: 'Array de avaliações do produto',
          items: {
            bsonType: 'object',
            required: ['id_cliente', 'nota', 'data_avaliacao'],
            properties: {
              id_cliente: {
                bsonType: 'int',
                description: 'ID do cliente que avaliou',
              },
              nota: {
                bsonType: 'int',
                minimum: 1,
                maximum: 5,
                description: 'Nota da avaliação (1 a 5)',
              },
              comentario: {
                bsonType: 'string',
                maxLength: 500,
                description: 'Comentário opcional da avaliação',
              },
              data_avaliacao: {
                bsonType: 'date',
                description: 'Data em que a avaliação foi feita.',
              },
            },
          },
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
// Collection: user_preferences
// ===============================================================================
print('👤 Configurando collection user_preferences...');

// Indexes para preferências de usuário
db.user_preferences.createIndex(
  { id_cliente: 1 },
  { unique: true, name: 'idx_preferences_id_cliente' },
);
db.user_preferences.createIndex({ preferencias: 1 }, { name: 'idx_preferences_categorias' });

// Validação de schema para user_preferences
db.runCommand({
  collMod: 'user_preferences',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id_cliente', 'preferencias'],
      properties: {
        id_cliente: {
          bsonType: 'int',
          description: 'ID do cliente (do PostgreSQL) é obrigatório e único.',
        },
        preferencias: {
          bsonType: 'array',
          minItems: 1,
          description: 'Array de IDs de categoria (do PostgreSQL) que o usuário prefere.',
          items: {
            bsonType: 'int',
            minimum: 1,
            description: 'ID da categoria deve ser um inteiro positivo.',
          },
        },
        created_at: {
          bsonType: 'date',
          description: 'Data de criação do registro de preferência.',
        },
        updated_at: {
          bsonType: 'date',
          description: 'Data da última atualização do registro de preferência.',
        },
      },
    },
  },
  validationLevel: 'moderate',
  validationAction: 'warn',
});

print('✅ Collection user_preferences configurada');

// ===============================================================================
// FINALIZANDO CONFIGURAÇÃO
// ===============================================================================

// Exibir estatísticas finais
print('\n📊 ESTATÍSTICAS DO BANCO:');
print(`Products collection - Indexes: ${db.products.getIndexes().length}`);
print(`User_preferences collection - Indexes: ${db.user_preferences.getIndexes().length}`);

print('\n🎉 Inicialização do MongoDB concluída com sucesso!');
print('\n📋 INFORMAÇÕES DE CONEXÃO:');
print(`- Banco de dados: ${dbName}`);
print(`- Usuário da aplicação: ${appUser}`);
print('\n⚡ O banco está pronto para uso!');
