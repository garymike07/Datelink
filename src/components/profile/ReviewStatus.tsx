import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Hourglass } from "lucide-react";

export function ReviewStatus(props: { userId: string }) {
  const navigate = useNavigate();
  const status = useQuery(api.verification.getVerificationStatus, props.userId ? { userId: props.userId as any } : "skip");

  if (!status) return null;

  const s = (status as any).status as string;
  if (s === "none") {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Get verified</p>
            <p className="text-sm text-muted-foreground">Verified profiles get more trust and visibility.</p>
          </div>
          <Button size="sm" onClick={() => navigate("/photo-verification")}>Verify</Button>
        </div>
      </Card>
    );
  }

  if (s === "pending") {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-semibold">Under review</p>
            <p className="text-sm text-muted-foreground">We’re reviewing your verification submission.</p>
          </div>
        </div>
      </Card>
    );
  }

  if (s === "approved") {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <div>
            <p className="font-semibold">Verified</p>
            <p className="text-sm text-muted-foreground">Your profile is verified.</p>
          </div>
        </div>
      </Card>
    );
  }

  if (s === "rejected") {
    const reason = (status as any).reviewNotes as string | undefined;
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Verification failed</p>
              <p className="text-sm text-muted-foreground">{reason ? reason : "Please try again."}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/photo-verification")}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
