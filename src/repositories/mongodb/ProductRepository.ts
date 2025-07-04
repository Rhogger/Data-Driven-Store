import { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';

export interface Product {
  _id?: ObjectId;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  stock: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductRepository {
  constructor(private fastify: FastifyInstance) {}

  private get collection() {
    return this.fastify.mongodb.db.collection<Product>('products');
  }

  async create(product: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date();
    const productToInsert: Omit<Product, '_id'> = {
      ...product,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(productToInsert);

    return {
      _id: result.insertedId,
      ...productToInsert,
    };
  }

  async findById(id: string): Promise<Product | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findAll(limit = 10, skip = 0): Promise<Product[]> {
    return await this.collection.find({}).limit(limit).skip(skip).sort({ createdAt: -1 }).toArray();
  }

  async findByCategoryId(categoryId: string, limit = 10): Promise<Product[]> {
    return await this.collection
      .find({ categoryId })
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async update(id: string, update: Partial<Omit<Product, '_id'>>): Promise<Product | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...update,
          updatedAt: new Date(),
        },
      },
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
        name: { $regex: searchTerm, $options: 'i' },
      })
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async findByTags(tags: string[], limit = 10): Promise<Product[]> {
    return await this.collection
      .find({
        tags: { $in: tags },
      })
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async countByCategory(): Promise<Array<{ _id: string; count: number }>> {
    const result = await this.collection
      .aggregate([
        {
          $group: {
            _id: '$categoryId',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ])
      .toArray();

    return result as Array<{ _id: string; count: number }>;
  }
}
