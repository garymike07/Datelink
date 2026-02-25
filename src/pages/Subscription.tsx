import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/premium/PaymentModal";
import { Check, Calendar, CreditCard, History, Clock, CheckCircle2, XCircle, AlertCircle, Star, Zap, Gift } from "lucide-react";
import { TrialBanner } from "@/components/premium/TrialBanner";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";

export default function Subscription() {
  const { user } = useAuth();
  const userId = user?._id;
  const [searchParams] = useSearchParams();
  const subscription = useQuery(api.subscriptions.getMySubscription, userId ? { userId: userId as any } : "skip");
  const payments = useQuery(api.payments.getMyBillingHistory, userId ? { userId: userId as any, limit: 50 } : "skip");
  const [payOpen, setPayOpen] = useState(false);

  // Handle loading and error states
  if (userId && (subscription === undefined || payments === undefined)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Clock className="h-12 w-12 text-primary animate-spin opacity-20" />
        <p className="text-muted-foreground animate-pulse">Loading subscription details...</p>
      </div>
    );
  }

  // If not logged in, show a simple message or redirect (though usually handled by higher-level route)
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">Please log in to view your subscription.</p>
      </div>
    );
  }

  const [payMode, setPayMode] = useState<"subscription" | "daily_unlock">("subscription");
  const [defaultDuration, setDefaultDuration] = useState<"1_week" | "1_month">("1_week");
  const isActive = !!subscription && subscription.status === "active";
  const refreshPaymentStatus = useMutation(api.paymentsStatus.refreshPaymentStatus);

  // Auto-open daily unlock modal when ?daily=1 is in URL
  useEffect(() => {
    if (searchParams.get("daily") === "1") {
      setPayMode("daily_unlock");
      setPayOpen(true);
    }
  }, [searchParams]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending": case "processing": return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProductLabel = (payment: any) => {
    const type = payment.productType ?? "";
    const duration = payment.metadata?.planDuration ?? payment.planDuration ?? "";
    if (type === "subscription") {
      if (duration === "1_week") return "Weekly Plan (KES 100)";
      if (duration === "1_month") return "Monthly Plan (KES 350)";
      return "Subscription";
    }
    if (type === "daily_unlock") return "Daily Unlock (24h Access)";
    if (type.includes("unlock")) return "Profile Unlock";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  useEffect(() => {
    if (!userId || !payments || !Array.isArray(payments)) return;
    const interval = setInterval(() => {
      const pending = payments.filter(p => p && (p.status === "pending" || p.status === "processing"));
      pending.forEach(p => {
        if (p?._id) {
          refreshPaymentStatus({ paymentId: p._id, userId: userId as any }).catch(console.error);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, payments, refreshPaymentStatus]);

  const openWeekly = () => { setPayMode("subscription"); setDefaultDuration("1_week"); setPayOpen(true); };
  const openMonthly = () => { setPayMode("subscription"); setDefaultDuration("1_month"); setPayOpen(true); };
  const openDailyUnlock = () => { setPayMode("daily_unlock"); setPayOpen(true); };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8 pb-12">
      <div className="mt-8 space-y-2">
        <TrialBanner />
        <h1 className="text-3xl font-bold font-heading">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your plan and view your payment history.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
          <CardDescription>Your current subscription status</CardDescription>
        </CardHeader>
        <CardContent>
          {!subscription || subscription.status !== "active" ? (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <p className="font-medium">Free / Restricted Plan</p>
                <p className="text-sm text-muted-foreground">
                  Limited to 10 profile views and 20 messages per day. Upgrade for unlimited access.
                </p>
              </div>
              <Button className="w-full" onClick={openWeekly}>Upgrade Now</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-primary uppercase">{subscription.plan} — {subscription.billingCycle}</p>
                    <p className="text-xs text-muted-foreground">Started: {subscription.startedAt ? format(subscription.startedAt, "MMM dd, yyyy") : "N/A"}</p>
                  </div>
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>{subscription.status}</Badge>
                </div>
                {subscription.endsAt && (
                  <p className="text-sm">Expires on: <span className="font-medium">{subscription.endsAt ? format(subscription.endsAt, "MMM dd, yyyy") : "N/A"}</span></p>
                )}
              </div>
              <Button variant="outline" className="w-full" onClick={openWeekly}>Change Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-2 gap-6 md:grid-rows-[auto_auto]">
          {/* Weekly Plan — KES 100 */}
          <Card className="relative border-2 border-primary/30 bg-primary/5 hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Plan
                </CardTitle>
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              </div>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-primary">KES 100</span>
                <span className="text-muted-foreground">/week</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>7 days of full premium access</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Unlimited profile views</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Unlimited messaging</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>See who likes you</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Advanced filters</span></li>
              </ul>
              <Button className="w-full" onClick={openWeekly} disabled={isActive && subscription?.billingCycle === "weekly"}>
                {isActive && subscription?.billingCycle === "weekly" ? "Current Plan" : "Subscribe Now — KES 100"}
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Plan — KES 350 */}
          <Card className="relative border-2 border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10 hover:border-amber-400 transition-colors">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3" /> Best Value
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Monthly Plan
                </CardTitle>
                <Badge className="bg-amber-400 text-amber-900 text-xs">Save 30%</Badge>
              </div>
              <CardDescription>Best value for serious daters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-amber-600">KES 350</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>30 days of full premium access</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Unlimited profile views</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Unlimited messaging</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>See who likes you</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Advanced filters</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Priority profile visibility</span></li>
              </ul>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={openMonthly} disabled={isActive && subscription?.billingCycle === "monthly"}>
                {isActive && subscription?.billingCycle === "monthly" ? "Current Plan" : "Subscribe Now — KES 350"}
              </Button>
            </CardContent>
          </Card>
          {/* Daily Unlock — KES 10 */}
          <Card className="relative border-2 border-blue-300/50 bg-blue-50/30 dark:bg-blue-950/10 hover:border-blue-400 transition-colors md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Daily Access — KES 10
                </CardTitle>
                <Badge variant="outline" className="border-blue-400 text-blue-600 text-xs">No Commitment</Badge>
              </div>
              <CardDescription>Get 24 hours of full access — perfect for trying before subscribing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-blue-600">KES 10</span>
                <span className="text-muted-foreground">/day</span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>24 hours of full access</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Unlimited profile views</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>Unlimited messaging</span></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500 flex-shrink-0" /><span>No recurring charges</span></li>
              </ul>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={openDailyUnlock}>
                Unlock for 24 Hours — KES 10
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Billing History
            </CardTitle>
          </div>
          <CardDescription>Complete record of all your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No billing history yet.</p>
              <p className="text-sm mt-1">Your transactions will appear here once you make a payment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Date & Time</th>
                    <th className="text-left py-3 px-2 font-medium">Plan / Service Purchased</th>
                    <th className="text-left py-3 px-2 font-medium">Amount Paid</th>
                    <th className="text-left py-3 px-2 font-medium">Transaction Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(payments as any[]).map((payment: any) => (
                    <tr key={payment._id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 whitespace-nowrap">
                        {payment.createdAt ? format(payment.createdAt, "MMM dd, yyyy HH:mm") : "N/A"}
                      </td>
                      <td className="py-3 px-2">{getProductLabel(payment)}</td>
                      <td className="py-3 px-2 font-medium">{payment.currency ?? "KES"} {payment.amount ?? 0}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span className={`capitalize font-medium ${payment.status === "completed" ? "text-green-600" : payment.status === "failed" ? "text-red-600" : "text-yellow-600"}`}>
                            {payment.status === "completed" ? "✅ Successful" : payment.status === "failed" ? "❌ Failed" : (payment.status || "Pending")}
                          </span>
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

      {userId && (
        <PaymentModal
          userId={userId}
          isOpen={payOpen}
          onClose={() => setPayOpen(false)}
          mode={payMode}
          defaultDuration={defaultDuration}
        />
      )}
    </div>
  );
}
