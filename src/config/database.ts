interface PostgresConfig {
  user?: string;
  host?: string;
  database?: string;
  password?: string;
  port?: number;
}

interface MongoDBConfig {
  uri: string;
  database: string;
}

interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

interface DatabaseConfig {
  postgres: PostgresConfig;
  mongodb: MongoDBConfig;
  redis: RedisConfig;
  // cassandra: CassandraConfig;
  // neo4j: Neo4jConfig;
}

export const databaseConfig: DatabaseConfig = {
  postgres: {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_DATABASE || 'data_driven_store',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
};
