import lighthouse from '@lighthouse-web3/sdk';
import { type DatasetMetadata } from '@shared/schema';

// Get Lighthouse API key
const getLighthouseApiKey = (): string => {
  const apiKey = import.meta.env.VITE_LIGHTHOUSE_API_KEY;
  if (!apiKey) {
    throw new Error('Lighthouse API key is required');
  }
  return apiKey;
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

// Upload dataset files to Lighthouse (Filecoin/IPFS)
export const uploadDataset = async (
  files: File[],
  metadata: DatasetMetadata
): Promise<{ cid: string; size: string }> => {
  try {
    const apiKey = getLighthouseApiKey();
    
    // Add metadata file
    const metadataFile = createMetadataFile(metadata);
    const allFiles = [...files, metadataFile];
    
    // Calculate total size
    const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
    const formattedSize = formatFileSize(totalSize);
    
    // Upload files to Lighthouse
    const uploadResponse = await lighthouse.upload(
      allFiles, 
      apiKey, 
      false, // If false, uses IPFS, if true - tries to make Filecoin deal
      metadata.name // Optional name
    );
    
    if (!uploadResponse.data || !uploadResponse.data.Hash) {
      throw new Error('Failed to get CID from Lighthouse');
    }
    
    return { cid: uploadResponse.data.Hash, size: formattedSize };
  } catch (error) {
    console.error('Failed to upload to Lighthouse', error);
    throw new Error('Failed to upload dataset to Filecoin/IPFS');
  }
};

// Retrieve a dataset from Lighthouse by CID
export const retrieveDataset = async (cid: string): Promise<any> => {
  try {
    // Get file download links
    const apiKey = getLighthouseApiKey();
    const fileInfoResponse = await lighthouse.getUploads(apiKey);
    
    // Find the files with matching CID
    const matchingFiles = fileInfoResponse.data.uploads.filter(
      (file: any) => file.cid === cid
    );
    
    if (!matchingFiles || matchingFiles.length === 0) {
      throw new Error('No files found with the specified CID');
    }
    
    // Return file information
    return matchingFiles;
  } catch (error) {
    console.error('Failed to retrieve from Lighthouse', error);
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

// Helper to check if cid exists on Lighthouse
export const checkCidExists = async (cid: string): Promise<boolean> => {
  try {
    const apiKey = getLighthouseApiKey();
    const fileInfoResponse = await lighthouse.getUploads(apiKey);
    
    // Check if any file has the matching CID
    return fileInfoResponse.data.uploads.some((file: any) => file.cid === cid);
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
