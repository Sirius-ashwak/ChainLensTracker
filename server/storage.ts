import {
  users, type User, type InsertUser,
  datasets, type Dataset, type InsertDataset,
  models, type Model, type InsertModel,
  datasetModelRelationships, type Relationship, type InsertRelationship
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Dataset methods
  getDatasets(): Promise<Dataset[]>;
  getDataset(id: number): Promise<Dataset | undefined>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  updateDatasetStatus(id: number, status: string): Promise<Dataset | undefined>;
  
  // Model methods
  getModels(): Promise<Model[]>;
  getModel(id: number): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  
  // Relationship methods
  getRelationships(): Promise<Relationship[]>;
  getRelationshipsByDataset(datasetId: number): Promise<Relationship[]>;
  getRelationshipsByModel(modelId: number): Promise<Relationship[]>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  updateRelationshipStatus(id: number, status: string): Promise<Relationship | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Dataset methods
  async getDatasets(): Promise<Dataset[]> {
    return await db.select().from(datasets);
  }

  async getDataset(id: number): Promise<Dataset | undefined> {
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
    return dataset;
  }

  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const [dataset] = await db.insert(datasets).values(insertDataset).returning();
    return dataset;
  }

  async updateDatasetStatus(id: number, status: string): Promise<Dataset | undefined> {
    const [updatedDataset] = await db
      .update(datasets)
      .set({ status })
      .where(eq(datasets.id, id))
      .returning();
    return updatedDataset;
  }

  // Model methods
  async getModels(): Promise<Model[]> {
    return await db.select().from(models);
  }

  async getModel(id: number): Promise<Model | undefined> {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model;
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const [model] = await db.insert(models).values(insertModel).returning();
    return model;
  }

  // Relationship methods
  async getRelationships(): Promise<Relationship[]> {
    return await db.select().from(datasetModelRelationships);
  }

  async getRelationshipsByDataset(datasetId: number): Promise<Relationship[]> {
    return await db
      .select()
      .from(datasetModelRelationships)
      .where(eq(datasetModelRelationships.datasetId, datasetId));
  }

  async getRelationshipsByModel(modelId: number): Promise<Relationship[]> {
    return await db
      .select()
      .from(datasetModelRelationships)
      .where(eq(datasetModelRelationships.modelId, modelId));
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const [relationship] = await db
      .insert(datasetModelRelationships)
      .values(insertRelationship)
      .returning();
    return relationship;
  }

  async updateRelationshipStatus(id: number, status: string): Promise<Relationship | undefined> {
    const [updatedRelationship] = await db
      .update(datasetModelRelationships)
      .set({ status })
      .where(eq(datasetModelRelationships.id, id))
      .returning();
    return updatedRelationship;
  }
}

// Create a demo user if one doesn't exist
const initializeDatabase = async () => {
  const demoUser = await db
    .select()
    .from(users)
    .where(eq(users.username, "demo"))
    .limit(1);
    
  if (demoUser.length === 0) {
    await db.insert(users).values({
      username: "demo",
      password: "password"
    });
  }
};

// Initialize database with demo user
initializeDatabase().catch(console.error);

// Use the database storage implementation
export const storage = new DatabaseStorage();
