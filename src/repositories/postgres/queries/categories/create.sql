INSERT INTO categorias (nome)
VALUES ($1)
RETURNING *;
