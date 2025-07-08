import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import {
  Address,
  CreateAddressInput,
  UpdateAddressInput,
  AddressWithCity,
} from './AddressInterfaces';

export class AddressRepository {
  private pg: Pool;

  constructor(fastify: FastifyInstance) {
    this.pg = fastify.pg;
  }

  async create(addressData: CreateAddressInput): Promise<Address> {
    const query = `
      INSERT INTO enderecos (
        id_cliente, id_cidade, logradouro, numero, complemento,
        bairro, cep, tipo_endereco
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pg.query<Address>(query, [
      addressData.id_cliente,
      addressData.id_cidade,
      addressData.logradouro,
      addressData.numero,
      addressData.complemento,
      addressData.bairro,
      addressData.cep,
      addressData.tipo_endereco,
    ]);

    return result.rows[0];
  }

  async findById(id_endereco: number): Promise<Address | null> {
    const query = `
      SELECT * FROM enderecos
      WHERE id_endereco = $1
    `;

    const result = await this.pg.query<Address>(query, [id_endereco]);
    return result.rows[0] || null;
  }

  async findByIdWithCity(id_endereco: number): Promise<AddressWithCity | null> {
    const query = `
      SELECT
        e.*,
        c.nome as cidade,
        est.nome as estado,
        est.uf
      FROM enderecos e
      JOIN cidades c ON e.id_cidade = c.id_cidade
      JOIN estados est ON c.id_estado = est.id_estado
      WHERE e.id_endereco = $1
    `;

    const result = await this.pg.query<AddressWithCity>(query, [id_endereco]);
    return result.rows[0] || null;
  }

  async findByClientId(id_cliente: number): Promise<AddressWithCity[]> {
    const query = `
      SELECT
        e.*,
        c.nome as cidade,
        est.nome as estado,
        est.uf
      FROM enderecos e
      JOIN cidades c ON e.id_cidade = c.id_cidade
      JOIN estados est ON c.id_estado = est.id_estado
      WHERE e.id_cliente = $1
      ORDER BY e.created_at DESC
    `;

    const result = await this.pg.query<AddressWithCity>(query, [id_cliente]);
    return result.rows;
  }

  async update(id_endereco: number, addressData: UpdateAddressInput): Promise<Address | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (addressData.id_cidade !== undefined) {
      fields.push(`id_cidade = $${paramIndex++}`);
      values.push(addressData.id_cidade);
    }
    if (addressData.logradouro !== undefined) {
      fields.push(`logradouro = $${paramIndex++}`);
      values.push(addressData.logradouro);
    }
    if (addressData.numero !== undefined) {
      fields.push(`numero = $${paramIndex++}`);
      values.push(addressData.numero);
    }
    if (addressData.complemento !== undefined) {
      fields.push(`complemento = $${paramIndex++}`);
      values.push(addressData.complemento);
    }
    if (addressData.bairro !== undefined) {
      fields.push(`bairro = $${paramIndex++}`);
      values.push(addressData.bairro);
    }
    if (addressData.cep !== undefined) {
      fields.push(`cep = $${paramIndex++}`);
      values.push(addressData.cep);
    }
    if (addressData.tipo_endereco !== undefined) {
      fields.push(`tipo_endereco = $${paramIndex++}`);
      values.push(addressData.tipo_endereco);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar foi fornecido');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id_endereco);

    const query = `
      UPDATE enderecos
      SET ${fields.join(', ')}
      WHERE id_endereco = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pg.query<Address>(query, values);
    return result.rows[0] || null;
  }

  async delete(id_endereco: number): Promise<boolean> {
    const query = `
      DELETE FROM enderecos
      WHERE id_endereco = $1
    `;

    const result = await this.pg.query(query, [id_endereco]);
    return (result.rowCount ?? 0) > 0;
  }

  async belongsToClient(id_endereco: number, id_cliente: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM enderecos
      WHERE id_endereco = $1 AND id_cliente = $2
    `;

    const result = await this.pg.query(query, [id_endereco, id_cliente]);
    return result.rows.length > 0;
  }
}
