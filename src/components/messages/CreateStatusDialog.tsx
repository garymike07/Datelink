import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Type, Image, Video, Upload } from "lucide-react";
import { toast } from "sonner";

interface CreateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BACKGROUND_COLORS = [
  "#667eea",
  "#f093fb",
  "#4facfe",
  "#43e97b",
  "#fa709a",
  "#feca57",
  "#ff6b6b",
  "#a29bfe",
];

const FONTS = [
  { name: "Default", value: "inherit" },
  { name: "Bold", value: "Arial Black, sans-serif" },
  { name: "Casual", value: "Comic Sans MS, cursive" },
  { name: "Elegant", value: "Georgia, serif" },
];

export function CreateStatusDialog({ open, onOpenChange }: CreateStatusDialogProps) {
  const { user } = useAuth();
  const [type, setType] = useState<"text" | "image" | "video">("text");
  const [textContent, setTextContent] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [font, setFont] = useState(FONTS[0].value);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createStatus = useMutation(api.statusPosts.createStatusPost);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    if (type === "image" && !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (type === "video" && !file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!user) {
        toast.error("You must be logged in to create a status");
        return;
      }

      if (type === "text" && !textContent.trim()) {
        toast.error("Please enter some text");
        return;
      }

      if ((type === "image" || type === "video") && !mediaFile) {
        toast.error(`Please select a ${type} file`);
        return;
      }

      // In a real app, you would upload the media file to a storage service
      // and get back a URL. For now, we'll use the base64 data URL
      const mediaUrl = mediaPreview || undefined;

      await createStatus({
        userId: user._id,
        type,
        content: type === "text" ? textContent : undefined,
        textContent: type !== "text" ? overlayText : undefined,
        backgroundColor: type === "text" ? backgroundColor : undefined,
        font: type === "text" ? font : undefined,
        mediaUrl,
        duration: type === "video" ? 15 : undefined, // Default 15 seconds
      });

      toast.success("Status posted successfully!");
      handleClose();
    } catch (error) {
      console.error("Error creating status:", error);
      toast.error("Failed to post status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTextContent("");
    setOverlayText("");
    setBackgroundColor(BACKGROUND_COLORS[0]);
    setFont(FONTS[0].value);
    setMediaFile(null);
    setMediaPreview(null);
    setType("text");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b">
          <DialogTitle className="text-base sm:text-lg">Create Status</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Share a text, image, or video status that disappears after 24 hours
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 mx-4 sm:mx-6 my-3 sm:my-4 shrink-0">
            <TabsTrigger value="text" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Type className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
            <TabsContent value="text" className="space-y-3 sm:space-y-4 mt-0">
              <div>
                <Label className="text-sm">Text</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-[100px] sm:min-h-[120px] text-base sm:text-lg mt-2"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {textContent.length}/300
                </p>
              </div>

              <div>
                <Label className="text-sm">Background Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform flex-shrink-0 ${
                        backgroundColor === color ? "scale-110 ring-2 ring-primary ring-offset-2" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Font Style</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FONTS.map((f) => (
                    <Button
                      key={f.value}
                      variant={font === f.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFont(f.value)}
                      className="text-xs h-8"
                    >
                      {f.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label className="text-sm">Preview</Label>
                <div
                  className="w-full h-28 sm:h-32 rounded-lg flex items-center justify-center p-4 mt-2"
                  style={{ backgroundColor }}
                >
                  <p
                    className="text-white text-base sm:text-lg font-bold text-center break-words max-w-full overflow-hidden"
                    style={{ fontFamily: font }}
                  >
                    {textContent || "Preview"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-3 sm:space-y-4 mt-0">
              <div>
                <Label className="text-sm">Select Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full mt-2 h-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 10MB
                </p>
              </div>

              {mediaPreview && (
                <>
                  <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Caption (Optional)</Label>
                    <Textarea
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Add a caption..."
                      className="mt-2 min-h-[80px]"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {overlayText.length}/100
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="video" className="space-y-3 sm:space-y-4 mt-0">
              <div>
                <Label className="text-sm">Select Video</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full mt-2 h-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Video
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 10MB
                </p>
              </div>

              {mediaPreview && (
                <>
                  <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Caption (Optional)</Label>
                    <Textarea
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Add a caption..."
                      className="mt-2 min-h-[80px]"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {overlayText.length}/100
                    </p>
                  </div>
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background shrink-0">
          <Button variant="outline" onClick={handleClose} className="flex-1 h-10 text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-10 text-sm"
          >
            {isSubmitting ? "Posting..." : "Post Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
