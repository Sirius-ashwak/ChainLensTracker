import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDatasetSchema, insertModelSchema, insertRelationshipSchema, datasetMetadataSchema } from "@shared/schema";
import { z } from "zod";
import lighthouse from '@lighthouse-web3/sdk';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

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

  // Configure multer for file uploads
  const upload = multer({ 
    dest: path.join(os.tmpdir(), 'uploads'),
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
  });

  // Lighthouse IPFS endpoints
  // Upload files to IPFS via Lighthouse
  apiRouter.post("/ipfs/upload", upload.array('files'), async (req, res) => {
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const apiKey = process.env.LIGHTHOUSE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Lighthouse API key not configured" });
      }

      // Create metadata file if metadata is provided
      let allFiles = Array.isArray(req.files) ? [...req.files] : [req.files];
      
      if (req.body.metadata) {
        let metadata;
        try {
          metadata = JSON.parse(req.body.metadata);
          // Create a metadata file
          const metadataPath = path.join(os.tmpdir(), 'metadata.json');
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
          
          // Add metadata file (with required multer fields)
          allFiles.push({
            path: metadataPath,
            originalname: 'metadata.json',
            mimetype: 'application/json',
            fieldname: 'files',
            encoding: '7bit',
            size: fs.statSync(metadataPath).size,
            destination: os.tmpdir(),
            filename: 'metadata.json',
            buffer: Buffer.from(JSON.stringify(metadata, null, 2))
          } as any);
        } catch (err) {
          return res.status(400).json({ message: "Invalid metadata JSON" });
        }
      }

      // Map files to paths for Lighthouse
      const filePaths = allFiles.map((file: any) => file.path);
      
      // Upload to Lighthouse
      const response = await lighthouse.upload(
        filePaths, 
        apiKey,
        undefined, // Use default deal parameters
        req.body.name // Optional name
      );
      
      // Calculate total size
      const totalSize = allFiles.reduce((acc: number, file: any) => acc + file.size, 0);
      
      // Clean up temporary files
      allFiles.forEach((file: any) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      });

      if (!response.data || !response.data.Hash) {
        return res.status(500).json({ message: "Failed to get CID from Lighthouse" });
      }
      
      // Return CID and size
      res.json({ 
        cid: response.data.Hash,
        size: formatFileSize(totalSize)
      });

    } catch (error) {
      console.error('Failed to upload to Lighthouse', error);
      res.status(500).json({ message: "Failed to upload to IPFS/Filecoin" });
    }
  });

  // Get uploads from Lighthouse
  apiRouter.get("/ipfs/uploads", async (req, res) => {
    try {
      const apiKey = process.env.LIGHTHOUSE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Lighthouse API key not configured" });
      }

      const response = await lighthouse.getUploads(apiKey);
      res.json(response.data);
    } catch (error) {
      console.error('Failed to get uploads from Lighthouse', error);
      res.status(500).json({ message: "Failed to retrieve uploads from IPFS/Filecoin" });
    }
  });

  // Check if a CID exists in Lighthouse
  apiRouter.get("/ipfs/check/:cid", async (req, res) => {
    try {
      const { cid } = req.params;
      const apiKey = process.env.LIGHTHOUSE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Lighthouse API key not configured" });
      }

      const response = await lighthouse.getUploads(apiKey);
      const exists = response.data.fileList.some((file: any) => file.cid === cid);
      
      res.json({ exists });
    } catch (error) {
      console.error('Failed to check CID in Lighthouse', error);
      res.status(500).json({ message: "Failed to check if CID exists in IPFS/Filecoin" });
    }
  });

  // Format file size helper
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Mount all routes under /api
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
