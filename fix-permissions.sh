#!/bin/bash

# Script para garantir permissões corretas nos diretórios de banco de dados
# antes de subir o docker-compose

echo "🔧 Verificando e corrigindo permissões dos diretórios de banco..."

# Diretório base dos bancos de dados
DB_DIR="./db"

# Garantir que o diretório Neo4j tenha as permissões corretas
if [ -d "$DB_DIR/neo4j" ]; then
    echo "📁 Corrigindo permissões do diretório Neo4j..."
    # Usar sudo apenas se necessário (se não for o dono)
    if [ "$(stat -c %U "$DB_DIR/neo4j")" != "$USER" ]; then
        echo "⚠️  Necessário sudo para corrigir propriedade do Neo4j..."
        sudo chown -R $USER:$USER "$DB_DIR/neo4j"
    fi
    chmod -R 755 "$DB_DIR/neo4j"
    echo "✅ Permissões do Neo4j corrigidas"
else
    echo "⚠️  Diretório $DB_DIR/neo4j não encontrado"
fi

# Garantir que outros diretórios tenham permissões adequadas
for dir in postgres mongodb cassandra; do
    if [ -d "$DB_DIR/$dir" ]; then
        echo "📁 Verificando permissões do diretório $dir..."
        chmod -R 755 "$DB_DIR/$dir" 2>/dev/null || {
            echo "⚠️  Necessário sudo para corrigir permissões do $dir..."
            sudo chmod -R 755 "$DB_DIR/$dir"
        }
        echo "✅ Permissões do $dir verificadas"
    fi
done

echo "🎉 Verificação de permissões concluída!"
