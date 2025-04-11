import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDatasetSchema, insertModelSchema, insertRelationshipSchema, datasetMetadataSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Datasets endpoints
  apiRouter.get("/datasets", async (req, res) => {
    try {
      const datasets = await storage.getDatasets();
      res.json(datasets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch datasets" });
    }
  });

  apiRouter.get("/datasets/:id", async (req, res) => {
    try {
      const dataset = await storage.getDataset(Number(req.params.id));
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found" });
      }
      res.json(dataset);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dataset" });
    }
  });

  apiRouter.post("/datasets", async (req, res) => {
    try {
      const validation = insertDatasetSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid dataset data", errors: validation.error.format() });
      }
      
      const dataset = await storage.createDataset(validation.data);
      res.status(201).json(dataset);
    } catch (error) {
      res.status(500).json({ message: "Failed to create dataset" });
    }
  });

  apiRouter.patch("/datasets/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const dataset = await storage.updateDatasetStatus(Number(req.params.id), status);
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found" });
      }
      
      res.json(dataset);
    } catch (error) {
      res.status(500).json({ message: "Failed to update dataset status" });
    }
  });

  // Models endpoints
  apiRouter.get("/models", async (req, res) => {
    try {
      const models = await storage.getModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  apiRouter.get("/models/:id", async (req, res) => {
    try {
      const model = await storage.getModel(Number(req.params.id));
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch model" });
    }
  });

  apiRouter.post("/models", async (req, res) => {
    try {
      const validation = insertModelSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid model data", errors: validation.error.format() });
      }
      
      const model = await storage.createModel(validation.data);
      res.status(201).json(model);
    } catch (error) {
      res.status(500).json({ message: "Failed to create model" });
    }
  });

  // Relationships endpoints
  apiRouter.get("/relationships", async (req, res) => {
    try {
      const relationships = await storage.getRelationships();
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  apiRouter.get("/relationships/dataset/:datasetId", async (req, res) => {
    try {
      const relationships = await storage.getRelationshipsByDataset(Number(req.params.datasetId));
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch relationships by dataset" });
    }
  });

  apiRouter.get("/relationships/model/:modelId", async (req, res) => {
    try {
      const relationships = await storage.getRelationshipsByModel(Number(req.params.modelId));
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch relationships by model" });
    }
  });

  apiRouter.post("/relationships", async (req, res) => {
    try {
      const validation = insertRelationshipSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid relationship data", errors: validation.error.format() });
      }
      
      // Verify that the dataset and model exist
      const dataset = await storage.getDataset(validation.data.datasetId);
      if (!dataset) {
        return res.status(400).json({ message: "Dataset not found" });
      }
      
      const model = await storage.getModel(validation.data.modelId);
      if (!model) {
        return res.status(400).json({ message: "Model not found" });
      }
      
      const relationship = await storage.createRelationship(validation.data);
      res.status(201).json(relationship);
    } catch (error) {
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  apiRouter.patch("/relationships/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const relationship = await storage.updateRelationshipStatus(Number(req.params.id), status);
      if (!relationship) {
        return res.status(404).json({ message: "Relationship not found" });
      }
      
      res.json(relationship);
    } catch (error) {
      res.status(500).json({ message: "Failed to update relationship status" });
    }
  });

  // Validate dataset metadata
  apiRouter.post("/validate/metadata", (req, res) => {
    try {
      const validation = datasetMetadataSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid metadata", 
          errors: validation.error.format() 
        });
      }
      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate metadata" });
    }
  });

  // Mount all routes under /api
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
