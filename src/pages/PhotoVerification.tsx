import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const poses = ["Look left", "Look right", "Smile", "Thumbs up"];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export default function PhotoVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id as string | undefined;

  const submitVerification = useMutation(api.verification.submitVerification);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [poseA] = useState(() => poses[Math.floor(Math.random() * poses.length)]);
  const [poseB] = useState(() => poses[Math.floor(Math.random() * poses.length)]);
  const [uploads, setUploads] = useState<{ pose: string; url: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const progress = useMemo(() => (step / 3) * 100, [step]);

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).slice(0, 3);
    try {
      const urls = await Promise.all(picked.map(readAsDataUrl));
      const next: { pose: string; url: string }[] = [];
      if (urls[0]) next.push({ pose: poseA, url: urls[0] });
      if (urls[1]) next.push({ pose: poseB, url: urls[1] });
      if (urls[2]) next.push({ pose: "Extra", url: urls[2] });
      setUploads(next);
    } catch {
      toast.error("Failed to read selected photos");
    }
  };

  const submit = async () => {
    if (!userId) {
      toast.error("Please log in again");
      navigate("/login");
      return;
    }
    if (uploads.length < 2) {
      toast.error("Please upload at least 2 photos");
      return;
    }

    setSubmitting(true);
    try {
      await submitVerification({
        userId: userId as any,
        photos: uploads.map((u) => ({ url: u.url, pose: u.pose })),
      } as any);
      setStep(3);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Photo verification</CardTitle>
            <CardDescription>Verify your profile to build trust and improve visibility.</CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You’ll upload 2 selfies following simple pose prompts. Your submission will be reviewed.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setStep(2)}>Start</Button>
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="font-semibold">Pose prompts</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5">
                    <li>{poseA}</li>
                    <li>{poseB}</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                  <p className="text-xs text-muted-foreground">Upload 2–3 photos (max 3).</p>
                </div>

                {uploads.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploads.map((u, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="aspect-square overflow-hidden rounded-md border">
                          <img src={u.url} alt={u.pose} className="h-full w-full object-cover" />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.pose}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={submit} disabled={submitting || uploads.length < 2}>
                    {submitting ? "Submitting…" : "Submit"}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="font-semibold">Submitted</p>
                <p className="text-sm text-muted-foreground">
                  Your verification is under review. We’ll update your status in Profile settings.
                </p>
                <Button onClick={() => navigate("/profile-setup")}>Back to profile</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
