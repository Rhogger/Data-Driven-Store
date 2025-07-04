interface PostgresConfig {
  user?: string;
  host?: string;
  database?: string;
  password?: string;
  port?: number;
}

interface DatabaseConfig {
  postgres: PostgresConfig;
  // cassandra: CassandraConfig; 
  // neo4j: Neo4jConfig;
  // redis: RedisConfig;
  // mongodb: MongoDBConfig;
}

export const databaseConfig: DatabaseConfig = {
    postgres: {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    }
}

// ADICIONE ESTES LOGS TEMPORÁRIOS PARA DEPURAR
console.log('--- Debugging Database Config ---');
console.log('PG_USER:', databaseConfig.postgres.user);
console.log('POSTGRES_HOST:', databaseConfig.postgres.host);
console.log('PG_DB:', databaseConfig.postgres.database);
console.log('PG_PASSWORD:', databaseConfig.postgres.password); // <-- MUITO IMPORTANTE
console.log('POSTGRES_PORT:', databaseConfig.postgres.port);
console.log('-------------------------------');