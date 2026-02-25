import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, Upload } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Step2Props {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveAndExit: () => void;
}

export const Step2Photos = ({ photos, onPhotosChange, onNext, onBack, onSaveAndExit }: Step2Props) => {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newPhotos: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === files.length) {
          onPhotosChange([...photos, ...newPhotos].slice(0, 6));
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const canProceed = photos.length >= 2;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Add Photos</CardTitle>
        </div>
        <CardDescription>
          Upload 2-6 photos. Your first photo will be your primary photo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                  Primary
                </div>
              )}
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {photos.length < 6 && (
            <label
              className={cn(
                "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors",
                uploading && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground text-center px-2">
                {uploading ? "Uploading..." : "Add Photo"}
              </span>
            </label>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Photo Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use clear, recent photos of yourself</li>
            <li>• Show your face in at least one photo</li>
            <li>• Include photos that show your interests</li>
            <li>• Avoid group photos or heavy filters</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button variant="outline" onClick={onSaveAndExit} className="flex-1">
            Save & Continue Later
          </Button>
          <Button onClick={onNext} disabled={!canProceed} className="flex-1">
            Next: About You
          </Button>
        </div>

        {!canProceed && (
          <p className="text-sm text-center text-muted-foreground">
            Please add at least 2 photos to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
};
