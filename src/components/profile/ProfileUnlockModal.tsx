import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Sparkles, CreditCard, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName?: string;
  onUnlockSuccess?: () => void;
}

export function ProfileUnlockModal({
  isOpen,
  onClose,
  targetUserId,
  targetUserName = "this profile",
  onUnlockSuccess,
}: ProfileUnlockModalProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"trial" | "weekly" | "monthly" | "once" | null>(null);

  const freeTrialStatus = useQuery(
    api.freeTrial.getFreeTrialStatus,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  const unlockProfile = useMutation(api.profileUnlocks.unlockProfile);
  const initiatePayment = useAction(api.payments.initiatePayment);
  const refreshPaymentStatus = useAction(api.paymentsStatus.refreshPaymentStatus);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const pollTimer = useRef<number | null>(null);

  const handleUnlock = async (method: "trial" | "weekly" | "monthly" | "once") => {
    if (!currentUser) return;

    // Paid options need a phone number for STK push
    if (method !== "trial" && phoneNumber.trim().length < 9) {
      toast({ title: "Phone number required", description: "Enter a valid M-Pesa phone number to pay." });
      return;
    }

    setIsUnlocking(true);
    // reset per-attempt state
    setPendingPaymentId(null);
    setVerificationStatus("idle");

    setSelectedOption(method);

    try {
      if (method === "trial") {
        // Use free trial
        const result = await unlockProfile({
          userId: currentUser._id,
          targetUserId: targetUserId as any,
          method: "free_trial",
        });

        if (result.success) {
          toast({
            title: "Profile Unlocked! 🎉",
            description: `You used 1 of your ${freeTrialStatus?.profileUnlocksRemaining} free trial unlocks.`,
          });
          onUnlockSuccess?.();
          onClose();
        }
      } else if (method === "weekly" || method === "monthly") {
        const amount = method === "weekly" ? 100 : 350;
        const planDuration = method === "weekly" ? "1_week" : "1_month";

        const { paymentId } = await initiatePayment({
          userId: currentUser._id as any,
          amount,
          currency: "KES",
          paymentMethod: "mpesa",
          productType: "subscription",
          plan: "premium",
          planDuration,
          metadata: { phoneNumber: phoneNumber.trim() },
        });

        setPendingPaymentId(paymentId);
        setVerificationStatus("pending");

        const tick = async () => {
          try {
            const res = await refreshPaymentStatus({ paymentId: paymentId as any, userId: currentUser._id as any });
            if (res.status === "completed") {
              setVerificationStatus("completed");
              await unlockProfile({
                userId: currentUser._id,
                targetUserId: targetUserId as any,
                method: "premium_subscription",
              });
              toast({ title: "Premium Activated! ✨", description: "Payment confirmed and profile unlocked." });
              setIsUnlocking(false);
              setSelectedOption(null);
              onUnlockSuccess?.();
              onClose();
              return;
            }
            if (res.status === "failed") {
              setVerificationStatus("failed");
              toast({ title: "Payment failed", description: "Transaction failed or timed out." });
              setIsUnlocking(false);
              setSelectedOption(null);
              return;
            }
          } catch {
            // keep polling
          }
          pollTimer.current = window.setTimeout(tick, 3000);
        };

        pollTimer.current = window.setTimeout(tick, 2000);
      } else if (method === "once") {
        const { paymentId } = await initiatePayment({
          userId: currentUser._id as any,
          amount: 10,
          currency: "KES",
          paymentMethod: "mpesa",
          productType: "profile_unlock",
          targetUserId: targetUserId as any,
          metadata: { phoneNumber: phoneNumber.trim() },
        });

        setPendingPaymentId(paymentId);
        setVerificationStatus("pending");

        const tick = async () => {
          try {
            const res = await refreshPaymentStatus({ paymentId: paymentId as any, userId: currentUser._id as any });
            if (res.status === "completed") {
              setVerificationStatus("completed");
              await unlockProfile({
                userId: currentUser._id,
                targetUserId: targetUserId as any,
                method: "paid_unlock",
                paymentId: paymentId as any,
              });
              toast({ title: "Profile Unlocked! 🔓", description: "Payment confirmed and profile unlocked." });
              setIsUnlocking(false);
              setSelectedOption(null);
              onUnlockSuccess?.();
              onClose();
              return;
            }
            if (res.status === "failed") {
              setVerificationStatus("failed");
              toast({ title: "Payment failed", description: "Transaction failed or timed out." });
              setIsUnlocking(false);
              setSelectedOption(null);
              return;
            }
          } catch {
            // keep polling
          }
          pollTimer.current = window.setTimeout(tick, 3000);
        };

        pollTimer.current = window.setTimeout(tick, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Unlock Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      // For paid flows we keep the UI in "pending" while we poll.
      if (method === "trial") {
        setIsUnlocking(false);
        setSelectedOption(null);
      }
    }
  };

  const showFreeTrial = freeTrialStatus?.trialActive && freeTrialStatus?.canUnlockMore;

  useEffect(() => {
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Unlock {targetUserName}'s Profile
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to unlock this profile and view full details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            placeholder="M-Pesa phone e.g. 0712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isUnlocking || verificationStatus === "pending"}
          />
          <p className="text-xs text-muted-foreground">We’ll send an STK push to this number for paid options.</p>
        </div>

        {verificationStatus === "pending" && pendingPaymentId && (
          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            Waiting for payment confirmation…
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={async () => {
                try {
                  const res = await refreshPaymentStatus({
                    paymentId: pendingPaymentId as any,
                    userId: currentUser?._id as any,
                  });
                  if (res.status === "completed") {
                    toast({ title: "Payment confirmed", description: "You can proceed." });
                  } else if (res.status === "failed") {
                    toast({ title: "Payment failed", description: "Transaction failed or timed out." });
                  } else {
                    toast({ title: "Still pending", description: "Please complete the STK prompt on your phone." });
                  }
                } catch (e: any) {
                  toast({ title: "Could not refresh", description: e?.message ?? "Try again" });
                }
              }}
            >
              Check payment status
            </Button>
          </div>
        )}

        <div className="space-y-3 py-4">
          {/* Free Trial Option */}
          {showFreeTrial && (
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="bg-primary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Free Trial
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {freeTrialStatus.profileUnlocksRemaining} left
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">Use Free Trial Unlock</p>
                    <p className="text-xs text-muted-foreground">
                      You have {freeTrialStatus.profileUnlocksRemaining} free unlocks remaining
                    </p>
                    {freeTrialStatus.trialEnds && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Trial ends in {Math.ceil((freeTrialStatus.trialEnds - Date.now()) / (60 * 60 * 1000))} hours
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleUnlock("trial")}
                    disabled={isUnlocking}
                    size="sm"
                    className="ml-4"
                  >
                    {isUnlocking && selectedOption === "trial" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Unlock Free"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Premium Subscription Options */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="mb-3">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 mb-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
                <p className="text-sm font-semibold">Go Premium - Unlimited Unlocks</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unlock unlimited profiles + all premium features
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handleUnlock("weekly")}
                  disabled={isUnlocking}
                >
                  <span className="text-sm">
                    <span className="font-semibold">KES 100</span> / week
                  </span>
                  {isUnlocking && selectedOption === "weekly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs text-muted-foreground">~KES 14/day</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handleUnlock("monthly")}
                  disabled={isUnlocking}
                >
                  <span className="text-sm">
                    <span className="font-semibold">KES 350</span> / month
                  </span>
                  {isUnlocking && selectedOption === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant="secondary" className="text-xs">Save 12%</Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Single Unlock Option */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">Unlock Once</p>
                  <p className="text-xs text-muted-foreground">
                    Pay per profile unlock
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleUnlock("once")}
                  disabled={isUnlocking}
                  size="sm"
                >
                  {isUnlocking && selectedOption === "once" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  KES 10
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          All unlocked profiles remain accessible forever
        </div>
      </DialogContent>
    </Dialog>
  );
}
