import { FastifyInstance } from 'fastify';
import { CategoryRepository } from '../../repositories/postgres/CategoryRepository';

interface Category {
  id_categoria: number;
  nome: string;
  created_at: Date;
  updated_at: Date;
}

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor(fastify: FastifyInstance) {
    this.categoryRepository = new CategoryRepository(fastify);
  }

  async createCategory(nome: string): Promise<Category> {
    if (!nome || nome.trim() === '') {
      throw new Error('O nome da categoria não pode ser vazio.');
    }

    const newCategory = await this.categoryRepository.create(nome);

    return newCategory;
  }
}