import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PaymentModal } from "@/components/premium/PaymentModal";
import { Check, Star, Calendar, History, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function Subscription() {
  const { user } = useAuth();
  const userId = user?._id;
  const subscription = useQuery(api.subscriptions.getMySubscription, userId ? { userId: userId as any } : "skip");
  const payments = useQuery(api.payments.getMyPayments, userId ? { userId: userId as any } : "skip");
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No recent transactions found.</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: any) => (
                <div key={payment._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium capitalize">
                      {payment.productType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(payment.createdAt, "PPP 'at' p")}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      ID: {payment.transactionId || payment._id.toString().slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-bold">
                      {payment.currency} {payment.amount}
                    </p>
                    <div className="flex items-center justify-end gap-1.5">
                      {payment.status === "completed" && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Successful
                        </Badge>
                      )}
                      {payment.status === "failed" && (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                      {(payment.status === "pending" || payment.status === "processing") && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1 animate-pulse">
                          <Clock className="h-3 w-3" />
                          {payment.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
