import {
  users, type User, type InsertUser,
  datasets, type Dataset, type InsertDataset,
  models, type Model, type InsertModel,
  datasetModelRelationships, type Relationship, type InsertRelationship
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private datasets: Map<number, Dataset>;
  private models: Map<number, Model>;
  private relationships: Map<number, Relationship>;
  
  private userCurrentId: number;
  private datasetCurrentId: number;
  private modelCurrentId: number;
  private relationshipCurrentId: number;

  constructor() {
    this.users = new Map();
    this.datasets = new Map();
    this.models = new Map();
    this.relationships = new Map();
    
    this.userCurrentId = 1;
    this.datasetCurrentId = 1;
    this.modelCurrentId = 1;
    this.relationshipCurrentId = 1;

    // Initialize with sample user
    this.createUser({
      username: "demo",
      password: "password"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Dataset methods
  async getDatasets(): Promise<Dataset[]> {
    return Array.from(this.datasets.values());
  }

  async getDataset(id: number): Promise<Dataset | undefined> {
    return this.datasets.get(id);
  }

  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const id = this.datasetCurrentId++;
    const now = new Date();
    const dataset: Dataset = { 
      ...insertDataset, 
      id, 
      uploadedAt: now 
    };
    this.datasets.set(id, dataset);
    return dataset;
  }

  async updateDatasetStatus(id: number, status: string): Promise<Dataset | undefined> {
    const dataset = this.datasets.get(id);
    if (dataset) {
      const updatedDataset = { ...dataset, status };
      this.datasets.set(id, updatedDataset);
      return updatedDataset;
    }
    return undefined;
  }

  // Model methods
  async getModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }

  async getModel(id: number): Promise<Model | undefined> {
    return this.models.get(id);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.modelCurrentId++;
    const now = new Date();
    const model: Model = { 
      ...insertModel, 
      id, 
      createdAt: now 
    };
    this.models.set(id, model);
    return model;
  }

  // Relationship methods
  async getRelationships(): Promise<Relationship[]> {
    return Array.from(this.relationships.values());
  }

  async getRelationshipsByDataset(datasetId: number): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      relationship => relationship.datasetId === datasetId
    );
  }

  async getRelationshipsByModel(modelId: number): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      relationship => relationship.modelId === modelId
    );
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const id = this.relationshipCurrentId++;
    const now = new Date();
    const relationship: Relationship = {
      ...insertRelationship,
      id,
      usageDate: now
    };
    this.relationships.set(id, relationship);
    return relationship;
  }

  async updateRelationshipStatus(id: number, status: string): Promise<Relationship | undefined> {
    const relationship = this.relationships.get(id);
    if (relationship) {
      const updatedRelationship = { ...relationship, status };
      this.relationships.set(id, updatedRelationship);
      return updatedRelationship;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
