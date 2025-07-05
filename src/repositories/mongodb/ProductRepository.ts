import { FastifyInstance } from 'fastify';
import { ObjectId, Document } from 'mongodb';

export class ProductRepository {
  constructor(private fastify: FastifyInstance) {}

  private get collection() {
    return this.fastify.mongodb.db.collection('products');
  }

  async findLowStock(limiar: number) {
    return this.collection.find({ estoque: { $lt: limiar } }).toArray();
  }

  async findAll(limit = 20, skip = 0) {
    return this.collection.find({}).skip(skip).limit(limit).toArray();
  }

  async findById(id: string) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  async create(product: Document) {
    const result = await this.collection.insertOne(product);
    return { ...product, _id: result.insertedId };
  }

  async update(id: string, update: Partial<Document>) {
    await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return this.findById(id);
  }
}
