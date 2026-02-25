import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileJson, Clock, CheckCircle2, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

export function DataExportDialog() {
  const [open, setOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { token } = useAuth();

  const dataExport = useQuery(api.dataExport.getDataExport, token ? { token } : "skip");
  const requestExport = useMutation(api.dataExport.requestDataExport);
  const markDownloaded = useMutation(api.dataExport.markExportDownloaded);

  const handleRequestExport = async () => {
    if (!token) {
      toast.error("You must be logged in to request an export");
      return;
    }
    setIsRequesting(true);
    try {
      const result = await requestExport({ token });
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to request data export");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDownload = async () => {
    if (!dataExport || !dataExport.fileUrl) return;
    if (!token) {
      toast.error("You must be logged in to download exports");
      return;
    }

    try {
      // Create a blob from the data URL
      const response = await fetch(dataExport.fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `datelink-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Mark as downloaded
      await markDownloaded({ exportId: dataExport._id, token });
      toast.success("Data export downloaded successfully");
    } catch (error: any) {
      toast.error("Failed to download export");
    }
  };

  const getExpiresInDays = () => {
    if (!dataExport?.expiresAt) return 0;
    return Math.ceil((dataExport.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download My Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Download Your Data
          </DialogTitle>
          <DialogDescription>
            Export all your personal data in JSON format for GDPR compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">What's included:</p>
              <ul className="text-sm space-y-1 list-disc pl-4">
                <li>Account information and profile data</li>
                <li>Photos and verification status</li>
                <li>Matches and messages (anonymized)</li>
                <li>Likes sent and received</li>
                <li>Settings and preferences</li>
                <li>Subscription and payment history</li>
                <li>Activity logs and gamification data</li>
              </ul>
            </AlertDescription>
          </Alert>

          {dataExport?.status === "processing" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing your data...
                </span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          )}

          {dataExport?.status === "completed" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-800">
                    Your data export is ready!
                  </p>
                  <div className="text-sm space-y-1">
                    <p>File size: {formatFileSize(dataExport.fileSize)}</p>
                    <p>Created: {new Date(dataExport.completedAt!).toLocaleString()}</p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires in {getExpiresInDays()} days
                    </p>
                    {dataExport.downloadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last downloaded:{" "}
                        {new Date(dataExport.downloadedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {dataExport?.status === "expired" && (
            <Alert variant="destructive">
              <AlertDescription>
                Your previous data export has expired. Request a new one below.
              </AlertDescription>
            </Alert>
          )}

          {dataExport?.status === "failed" && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to generate data export. Please try again or contact support.
              </AlertDescription>
            </Alert>
          )}

          {!dataExport && (
            <p className="text-sm text-muted-foreground">
              No data export requested yet. Click below to generate your export.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {dataExport?.status === "completed" && (
            <Button onClick={handleDownload} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
          )}
          
          {(!dataExport || 
            dataExport.status === "expired" || 
            dataExport.status === "failed") && (
            <Button
              onClick={handleRequestExport}
              disabled={isRequesting}
              className="w-full sm:w-auto"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Generate Export
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
