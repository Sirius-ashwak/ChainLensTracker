import { Web3Storage } from 'web3.storage';
import { type DatasetMetadata } from '@shared/schema';

// Initialize Web3Storage client
const getWeb3StorageClient = () => {
  const token = process.env.WEB3STORAGE_TOKEN || import.meta.env.VITE_WEB3STORAGE_TOKEN;
  if (!token) {
    throw new Error('Web3Storage token is required');
  }
  return new Web3Storage({ token });
};

// Convert a File to a blob
const fileToBlob = async (file: File): Promise<Blob> => {
  return new Blob([await file.arrayBuffer()], { type: file.type });
};

// Create metadata JSON file
const createMetadataFile = (metadata: DatasetMetadata): File => {
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: 'application/json',
  });
  return new File([metadataBlob], 'metadata.json');
};

// Upload dataset files to Web3Storage
export const uploadDataset = async (
  files: File[],
  metadata: DatasetMetadata
): Promise<{ cid: string; size: string }> => {
  try {
    const client = getWeb3StorageClient();
    
    // Add metadata file
    const metadataFile = createMetadataFile(metadata);
    const allFiles = [...files, metadataFile];
    
    // Calculate total size
    const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
    const formattedSize = formatFileSize(totalSize);
    
    // Upload files
    const cid = await client.put(allFiles, {
      name: metadata.name,
      wrapWithDirectory: true,
    });
    
    return { cid, size: formattedSize };
  } catch (error) {
    console.error('Failed to upload to Web3Storage', error);
    throw new Error('Failed to upload dataset to Filecoin/IPFS');
  }
};

// Retrieve a dataset from Web3Storage by CID
export const retrieveDataset = async (cid: string): Promise<any> => {
  try {
    const client = getWeb3StorageClient();
    const res = await client.get(cid);
    
    if (!res || !res.ok) {
      throw new Error('Failed to retrieve dataset');
    }
    
    // Get all files from the response
    const files = await res.files();
    return files;
  } catch (error) {
    console.error('Failed to retrieve from Web3Storage', error);
    throw new Error('Failed to retrieve dataset from Filecoin/IPFS');
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to check if cid exists
export const checkCidExists = async (cid: string): Promise<boolean> => {
  try {
    const client = getWeb3StorageClient();
    const status = await client.status(cid);
    return !!status;
  } catch {
    return false;
  }
};

// Verify the lineage between dataset and model
export const verifyLineage = async (
  datasetCid: string,
  processingCid: string | undefined,
  modelCid: string
): Promise<boolean> => {
  try {
    const client = getWeb3StorageClient();
    
    // Check if all CIDs exist
    const datasetExists = await checkCidExists(datasetCid);
    const modelExists = await checkCidExists(modelCid);
    
    if (!datasetExists || !modelExists) {
      return false;
    }
    
    // If there's a processing step, check that too
    if (processingCid) {
      const processingExists = await checkCidExists(processingCid);
      if (!processingExists) {
        return false;
      }
    }
    
    // For a real implementation, additional verification would be needed
    // such as checking hash references within the model to the dataset
    
    return true;
  } catch (error) {
    console.error('Failed to verify lineage', error);
    return false;
  }
};
