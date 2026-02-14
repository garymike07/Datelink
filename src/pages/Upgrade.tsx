import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, Sparkles, RotateCcw, Zap, Eye, Infinity, Check, X, Clock, Shield, Users, TrendingUp } from "lucide-react";
import { PaymentModal } from "@/components/premium/PaymentModal";

const Upgrade = () => {
  const { user } = useAuth();
  const userId = user?._id;
  const entitlements = useQuery(api.subscriptions.getMyEntitlements, userId ? { userId } : "skip");
  const likesData = useQuery(api.matching.getWhoLikedYous, userId ? { userId, sortBy: "recent" } : "skip");
  const quotaStats = useQuery(api.profileUnlocks.getQuotaStats, userId ? { userId } : "skip");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<any>("1_month");

  const isPremium = !!entitlements?.isPremium;
  const likesCount = likesData?.count || 0;

  const features = [
    { icon: Heart, title: "Likes Quota", free: "10 total", premium: "20 total" },
    { icon: Users, title: "Profile Unlocks", free: "10 total", premium: "20 total" },
    { icon: Eye, title: "See Who Likes You", free: false, premium: true },
    { icon: Sparkles, title: "Super Likes/Day", free: "0", premium: "5" },
    { icon: RotateCcw, title: "Rewinds", free: "1/day", premium: "Unlimited" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-12 pb-12">
      <div className="text-center space-y-4 pt-8">
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-1">Limited Time Offer</Badge>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Upgrade to Premium</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Join 5,000+ members finding love faster with increased quotas.</p>
      </div>

      {quotaStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['profiles', 'likes', 'matches'].map((k: any) => (
                <Card key={k} className="glass-panel">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1 capitalize">{k}</p>
                        <p className="text-2xl font-bold">{(quotaStats as any)[k].used} / {quotaStats.totalQuota}</p>
                        <div className="w-full bg-secondary/20 h-1.5 rounded-full mt-2">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, ((quotaStats as any)[k].used / quotaStats.totalQuota) * 100)}%` }} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
        <Card><CardContent className="p-6">
            <table className="w-full">
                <thead><tr className="border-b"><th className="text-left py-4 px-4">Feature</th><th className="text-center py-4 px-4">Free</th><th className="text-center py-4 px-4 font-bold">Premium</th></tr></thead>
                <tbody>{features.map((f, i) => (
                    <tr key={i} className="border-b last:border-0">
                        <td className="py-4 px-4"><div className="flex items-center gap-2"><f.icon className="h-5 w-5 text-muted-foreground" /><span>{f.title}</span></div></td>
                        <td className="text-center py-4 px-4">{typeof f.free === "boolean" ? (f.free ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : f.free}</td>
                        <td className="text-center py-4 px-4 font-semibold">{typeof f.premium === "boolean" ? (f.premium ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : f.premium}</td>
                    </tr>
                ))}</tbody>
            </table>
        </CardContent></Card>
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={() => setPaymentOpen(true)}>Choose a Plan</Button>
      </div>

      {userId && <PaymentModal userId={userId} isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} defaultDuration={selectedDuration} />}
    </div>
  );
};

export default Upgrade;
