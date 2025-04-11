import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Upload, Database, Brain, GitBranch, HardDrive, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import DatasetCard from "@/components/DatasetCard";
import RelationshipTable from "@/components/RelationshipTable";
import DatasetLineage from "@/components/DatasetLineage";
import UploadForm from "@/components/UploadForm";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const Dashboard = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Fetch datasets
  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ["/api/datasets"],
  });

  // Fetch models
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/models"],
  });

  // Fetch relationships
  const { data: relationships, isLoading: relationshipsLoading } = useQuery({
    queryKey: ["/api/relationships"],
  });

  const formatStorageUsed = () => {
    if (!datasets || datasets.length === 0) return "0 GB";
    
    // This is a simplified calculation - in a real app you'd need to get actual storage used
    let totalSize = 0;
    datasets.forEach(dataset => {
      const match = dataset.size.match(/(\d+\.?\d*)\s*(\w+)/);
      if (match) {
        const [, size, unit] = match;
        const value = parseFloat(size);
        if (unit === "GB") totalSize += value;
        else if (unit === "MB") totalSize += value / 1024;
        else if (unit === "KB") totalSize += value / (1024 * 1024);
      }
    });
    
    return `${totalSize.toFixed(1)} GB`;
  };

  // Calculate stats
  const totalDatasets = datasets?.length || 0;
  const linkedModels = models?.length || 0;
  const verifiedLineages = relationships?.filter(r => r.status === "verified").length || 0;
  const storageUsed = formatStorageUsed();

  return (
    <div>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your AI datasets and models</p>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Dataset</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] p-0">
                <UploadForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Datasets"
            value={totalDatasets}
            icon={<Database className="h-5 w-5" />}
            color="primary"
          />
          <StatsCard
            title="Linked Models"
            value={linkedModels}
            icon={<Brain className="h-5 w-5" />}
            color="accent"
          />
          <StatsCard
            title="Verified Lineages"
            value={verifiedLineages}
            icon={<GitBranch className="h-5 w-5" />}
            color="success"
          />
          <StatsCard
            title="Storage Used"
            value={storageUsed}
            icon={<HardDrive className="h-5 w-5" />}
            color="warning"
          />
        </section>

        {/* Recent Datasets */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Datasets</h2>
            <Link href="/datasets" className="text-primary hover:text-primary/80 text-sm flex items-center">
              View all <span className="ml-1">→</span>
            </Link>
          </div>
          
          {datasetsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-card border border-border rounded-lg p-4 h-64"></div>
              ))}
            </div>
          ) : datasets && datasets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.slice(0, 3).map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <p className="text-muted-foreground">No datasets found. Upload your first dataset to get started.</p>
              <Button onClick={() => setUploadDialogOpen(true)} className="mt-4">
                Upload Dataset
              </Button>
            </div>
          )}
        </section>

        {/* Dataset Lineage */}
        <section className="mb-8">
          {datasets && datasets.length > 0 && (
            <DatasetLineage datasets={datasets} />
          )}
        </section>

        {/* Dataset-Model Relationships */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Dataset-Model Relationships</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {relationshipsLoading ? (
            <div className="animate-pulse bg-card border border-border rounded-lg p-4 h-64"></div>
          ) : (
            <RelationshipTable />
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
