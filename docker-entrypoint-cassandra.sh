#!/bin/bash

echo "🔧 Inicializando Cassandra Keyspace..."

# Aguarda o Cassandra estar pronto de verdade
echo "⏳ Aguardando Cassandra estar pronto..."
until docker exec cassandra_db cqlsh -e "DESCRIBE KEYSPACES" >/dev/null 2>&1; do
  echo "⏳ Executando nova tentativa..."
  sleep 10
done

# Executa o script de inicialização
echo "📊 Executando script de inicialização..."
docker exec cassandra_db cqlsh -f /docker-entrypoint-initdb.d/init.cql

echo "✅ Inicialização do Cassandra concluída!"
