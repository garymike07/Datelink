import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_GIFS = [
  "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
];

export function GifPicker({
  isOpen,
  onClose,
  onPick,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPick: (gifUrl: string) => void;
}) {
  const [customUrl, setCustomUrl] = useState("");

  const validCustom = useMemo(() => {
    if (!customUrl.trim()) return false;
    try {
      const u = new URL(customUrl.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [customUrl]);

  const pick = (url: string) => {
    onPick(url);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send a GIF</DialogTitle>
          <DialogDescription>
            Choose a GIF or paste a custom URL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste a GIF URL (optional)"
            />
            <Button onClick={() => pick(customUrl.trim())} disabled={!validCustom}>
              Send
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PRESET_GIFS.map((url) => (
              <button
                key={url}
                type="button"
                className="aspect-square overflow-hidden rounded-md border hover:opacity-90"
                onClick={() => pick(url)}
              >
                <img src={url} alt="gif" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
