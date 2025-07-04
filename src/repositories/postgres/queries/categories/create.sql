INSERT INTO Categorias (nome)
VALUES ($1)
RETURNING *;