import { Client } from 'cassandra-driver';
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

const cassandraConnector: FastifyPluginAsync = async (fastify: FastifyInstance) => {
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

    const keyspace = process.env.CASSANDRA_KEYSPACE || 'datadriven_store';
    fastify.log.info(`Verificando keyspace: ${keyspace}`);

    const createKeyspaceQuery = `
        CREATE KEYSPACE IF NOT EXISTS ${keyspace}
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
      `;

    await cassandraClient.execute(createKeyspaceQuery);
    fastify.log.info(`Keyspace ${keyspace} verificado/criado com sucesso`);
  } catch (error: any) {
    fastify.log.error('Failed to connect to Cassandra:', error?.message || 'Unknown error');
    throw error;
  }

  fastify.decorate('cassandra', cassandraClient);

  fastify.addHook('onClose', async () => {
    await cassandraClient.shutdown();
  });
};

export default fp(cassandraConnector, {
  name: 'cassandra-connector',
});
