import 'fastify';
import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';
import { Driver } from 'neo4j-driver';
import { Client } from 'cassandra-driver';

declare module 'fastify' {
  interface FastifyInstance {
    pg: Pool;
    mongodb: {
      client: MongoClient;
      db: Db;
    };
    redis: Redis;
    neo4j: Driver;
    cassandra: Client;
  }
}
