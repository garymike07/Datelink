import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PaymentModal } from "@/components/premium/PaymentModal";
import { Check, Star, Calendar } from "lucide-react";

export default function Subscription() {
  const { user } = useAuth();
  const userId = user?._id;
  const subscription = useQuery(api.subscriptions.getMySubscription, userId ? { userId: userId as any } : "skip");
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);
  const [payOpen, setPayOpen] = useState(false);
  const isActive = subscription?.status === "active";

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8 pb-12">
      <h1 className="text-3xl font-bold font-heading mt-8">Subscription</h1>
      <Card>
        <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
        <CardContent>
          {!subscription ? <p>You are on Free plan. Upgrade for more quota!</p> : (
            <div className="flex justify-between items-center">
              <div><span className="font-bold uppercase">{subscription.plan}</span> <Badge>{subscription.status}</Badge></div>
              <Button variant="outline" onClick={() => setPayOpen(true)}>Change Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-bold">Weekly Plan - KES 100</h3>
            <ul className="space-y-2 text-sm"><li><Check className="inline h-4 w-4 mr-2" /> +10 Profiles, Likes & Matches</li></ul>
            <Button className="w-full" onClick={() => setPayOpen(true)}>Select Weekly</Button>
          </CardContent>
        </Card>
      </div>
      {userId && <PaymentModal userId={userId} isOpen={payOpen} onClose={() => setPayOpen(false)} />}
    </div>
  );
}
