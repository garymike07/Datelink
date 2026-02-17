import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/premium/PaymentModal";
import { Check, Calendar, CreditCard, History, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function Subscription() {
  const { user } = useAuth();
  const userId = user?._id;
  const subscription = useQuery(api.subscriptions.getMySubscription, userId ? { userId: userId as any } : "skip");
  const payments = useQuery(api.payments.getMyPayments, userId ? { userId: userId as any, limit: 10 } : "skip");
  const [payOpen, setPayOpen] = useState(false);
  
  const isActive = subscription?.status === "active";

  const refreshPaymentStatus = useMutation(api.paymentsStatus.refreshPaymentStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
      case "processing": return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Real-time status update for pending payments
  useEffect(() => {
    if (!userId || !payments) return;
    const interval = setInterval(() => {
      const pendingPayments = (payments as any[]).filter(p => p.status === "pending" || p.status === "processing");
      pendingPayments.forEach(p => {
        refreshPaymentStatus({ paymentId: p._id, userId: userId as any }).catch(console.error);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, payments, refreshPaymentStatus]);

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8 pb-12">
      <div className="mt-8 space-y-2">
        <h1 className="text-3xl font-bold font-heading">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your plan and view your payment history.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Current Plan
            </CardTitle>
            <CardDescription>Your current subscription status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {!subscription || subscription.status !== "active" ? (
              <div className="space-y-4">
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-muted-foreground">Limited to 10 free profile unlocks.</p>
                </div>
                <Button className="w-full" onClick={() => setPayOpen(true)}>Upgrade Now</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-primary uppercase">{subscription.plan} {subscription.billingCycle}</p>
                      <p className="text-xs text-muted-foreground">
                        Started: {format(subscription.startedAt, "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  {subscription.endsAt && (
                    <p className="text-sm">
                      Renews on: <span className="font-medium">{format(subscription.endsAt, "MMM dd, yyyy")}</span>
                    </p>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setPayOpen(true)}>Change Plan</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Plan
            </CardTitle>
            <CardDescription>Most popular for new members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">KES 100</span>
              <span className="text-muted-foreground">/week</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>7 days of premium access & login</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>10 FREE profile unlocks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>+10 More profiles after payment</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>See who likes you</span>
              </li>
            </ul>
            <Button className="w-full" onClick={() => setPayOpen(true)} disabled={isActive && subscription?.billingCycle === "weekly"}>
              {isActive && subscription?.billingCycle === "weekly" ? "Current Plan" : "Select Weekly"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Billing History
          </CardTitle>
          <CardDescription>Real-time record of your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No payment history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Description</th>
                    <th className="text-left py-3 px-2 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((payment: any) => (
                    <tr key={payment._id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        {format(payment.createdAt, "MMM dd, HH:mm")}
                      </td>
                      <td className="py-3 px-2 capitalize">
                        {payment.productType.replace("_", " ")}
                        {payment.planDuration && ` (${payment.planDuration.replace("_", " ")})`}
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {payment.currency} {payment.amount}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">{payment.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {userId && <PaymentModal userId={userId} isOpen={payOpen} onClose={() => setPayOpen(false)} />}
    </div>
  );
}
// Update forced at Tue Feb 17 06:16:22 EST 2026
