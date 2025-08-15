import { ClientSession } from 'mongodb';
import { Transaction } from 'neo4j-driver';

// Shared transaction types for all repositories
export type MongoSession = ClientSession;
export type Neo4jTransaction = Transaction;
