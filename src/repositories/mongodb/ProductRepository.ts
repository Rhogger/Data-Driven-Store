import { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';

export interface Product {
  _id?: ObjectId;
  nome: string;
  descricao?: string;
  marca?: string;
  preco: number;
  id_categoria: number;
  estoque: number;
  reservado?: number;
  disponivel?: number;
  atributos?: Record<string, any>;
  avaliacoes?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export class ProductRepository {
  constructor(private fastify: FastifyInstance) {}

  private get collection() {
    return this.fastify.mongodb.db.collection<Product>('products');
  }

  async create(
    product: Omit<
      Product,
      '_id' | 'created_at' | 'updated_at' | 'disponivel' | 'reservado' | 'avaliacoes'
    >,
  ): Promise<Product> {
    const now = new Date();
    const reservado = 0; // Sempre começar com 0 na criação
    const disponivel = product.estoque - reservado;

    // Debug: verificar dados de entrada
    this.fastify.log.info({ product }, 'Produto recebido no repositório');
    this.fastify.log.info({ atributos: product.atributos }, 'Atributos específicos');

    const productToInsert: Omit<Product, '_id'> = {
      nome: product.nome,
      descricao: product.descricao,
      marca: product.marca,
      preco: product.preco,
      id_categoria: product.id_categoria,
      estoque: product.estoque,
      atributos: product.atributos || {}, // Preservar atributos enviados ou objeto vazio
      reservado,
      disponivel,
      avaliacoes: {}, // Sempre começar com objeto vazio
      created_at: now,
      updated_at: now,
    };

    // Debug: verificar dados antes da inserção
    this.fastify.log.info({ productToInsert }, 'Produto a ser inserido');

    const result = await this.collection.insertOne(productToInsert);

    return {
      _id: result.insertedId,
      ...productToInsert,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.collection.findOne({ _id: new ObjectId(id) });
    this.fastify.log.info({ product }, 'Produto encontrado no banco');
    return product;
  }

  async findAll(limit = 10, skip = 0): Promise<Product[]> {
    return await this.collection
      .find({})
      .limit(limit)
      .skip(skip)
      .sort({ created_at: -1 })
      .toArray();
  }

  async findByCategoryId(id_categoria: number, limit = 10): Promise<Product[]> {
    return await this.collection
      .find({ id_categoria })
      .limit(limit)
      .sort({ created_at: -1 })
      .toArray();
  }

  async update(
    id: string,
    update: Partial<Omit<Product, '_id' | 'disponivel'>>,
  ): Promise<Product | null> {
    // Se estoque ou reservado for alterado, recalcular disponivel
    const updateData: any = { ...update, updated_at: new Date() };

    if (update.estoque !== undefined || update.reservado !== undefined) {
      // Buscar produto atual para obter valores existentes
      const currentProduct = await this.collection.findOne({ _id: new ObjectId(id) });
      if (currentProduct) {
        const novoEstoque = update.estoque ?? currentProduct.estoque;
        const novoReservado = update.reservado ?? currentProduct.reservado ?? 0;
        updateData.disponivel = novoEstoque - novoReservado;
      }
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' },
    );

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  async searchByName(searchTerm: string, limit = 10): Promise<Product[]> {
    return await this.collection
      .find({
        nome: { $regex: searchTerm, $options: 'i' },
      })
      .limit(limit)
      .sort({ created_at: -1 })
      .toArray();
  }

  async findByTags(tags: string[], limit = 10): Promise<Product[]> {
    return await this.collection
      .find({
        tags: { $in: tags },
      })
      .limit(limit)
      .sort({ created_at: -1 })
      .toArray();
  }

  async countByCategory(): Promise<Array<{ _id: number; count: number }>> {
    const result = await this.collection
      .aggregate([
        {
          $group: {
            _id: '$id_categoria',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ])
      .toArray();

    return result as Array<{ _id: number; count: number }>;
  }

  // Método específico para atualizar quantidade reservada (para pedidos)
  async updateReservedQuantity(id: string, quantidadeReservada: number): Promise<Product | null> {
    const currentProduct = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!currentProduct) {
      return null;
    }

    const novoReservado = quantidadeReservada;
    const disponivel = currentProduct.estoque - novoReservado;

    if (disponivel < 0) {
      throw new Error('Quantidade reservada não pode ser maior que o estoque disponível');
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          reservado: novoReservado,
          disponivel: disponivel,
          updated_at: new Date(),
        },
      },
      { returnDocument: 'after' },
    );

    return result;
  }
}
