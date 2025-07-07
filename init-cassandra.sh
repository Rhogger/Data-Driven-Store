#!/bin/bash

echo "🔧 Inicializando Cassandra Keyspace..."

# Aguarda o Cassandra estar pronto
echo "⏳ Aguardando Cassandra estar pronto..."
sleep 30

# Executa o script de inicialização
echo "📊 Executando script de inicialização..."
docker exec cassandra_db cqlsh -f /docker-entrypoint-initdb.d/init.cql

echo "✅ Inicialização do Cassandra concluída!"
