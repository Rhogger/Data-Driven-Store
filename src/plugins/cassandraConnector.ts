import { Client } from 'cassandra-driver';
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

const cassandraConnector = fp(
  async (fastify: FastifyInstance) => {
    const cassandraClient = new Client({
      contactPoints: [process.env.CASSANDRA_HOST || 'cassandra'],
      localDataCenter: 'datacenter1',
      credentials: {
        username: process.env.CASSANDRA_USER || 'cassandra',
        password: process.env.CASSANDRA_PASSWORD || 'cassandra',
      },
      protocolOptions: { port: Number(process.env.CASSANDRA_PORT) || 9042 },
    });

    try {
      fastify.log.info('Conectando ao Cassandra...');
      await cassandraClient.connect();
      fastify.log.info('Cassandra connected successfully');
    } catch (error: any) {
      fastify.log.error('Failed to connect to Cassandra:', error?.message || 'Unknown error');
      throw error;
    }

    fastify.decorate('cassandra', cassandraClient);

    fastify.addHook('onClose', async () => {
      await cassandraClient.shutdown();
    });
  },
  {
    name: 'cassandra-connector',
    fastify: '>=5.0.0',
  },
);

export default cassandraConnector;
