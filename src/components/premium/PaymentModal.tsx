import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PREMIUM_SUBSCRIPTION_PLANS, type PremiumPlanDuration, getPremiumAmountKes, UNLOCK_COST_KES } from "@/lib/pricing";

export function PaymentModal({ userId, isOpen, onClose, mode = "subscription", itemType, targetId, defaultDuration = "1_week" }: any) {
  const initiatePayment = useAction(api.payments.initiatePayment);
  const refreshPaymentStatus = useAction(api.paymentsStatus.refreshPaymentStatus);
  const [duration, setDuration] = useState<PremiumPlanDuration>(defaultDuration);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const amount = mode === "unlock" ? UNLOCK_COST_KES : getPremiumAmountKes(duration);

  const handlePay = async () => {
    if (phoneNumber.trim().length < 9) return toast.error("Invalid phone number");
    setIsSubmitting(true);
    setPaymentStatus("initiating");
    try {
      const productType = mode === "subscription" ? "subscription" : `${itemType}_unlock`;
      const { paymentId } = await initiatePayment({
        userId,
        amount,
        currency: "KES",
        paymentMethod: "mpesa",
        productType,
        planDuration: mode === "subscription" ? duration : undefined,
        metadata: { phoneNumber },
        targetUserId: targetId // For profile unlocks
      });

      toast.info("STK Push sent! Please check your phone.");
      setPaymentStatus("pending");

      // Polling for status
      let attempts = 0;
      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const result = await refreshPaymentStatus({ paymentId, userId });
          if (result.status === "completed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setPaymentStatus("completed");
            toast.success("Payment successful! Your features are now active.");
            setTimeout(() => {
              onClose();
              setPaymentStatus(null);
              setIsSubmitting(false);
            }, 2000);
          } else if (result.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setPaymentStatus("failed");
            toast.error("Payment failed. Please try again.");
            setIsSubmitting(false);
          } else if (attempts > 30) { // ~90 seconds
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setPaymentStatus("timeout");
            toast.error("Payment verification timed out. If you've paid, it will reflect in your history shortly.");
            setIsSubmitting(false);
          }
        } catch (pollError) {
          console.error("Polling error:", pollError);
        }
      }, 3000);

    } catch (e: any) {
      toast.error(e.message);
      setIsSubmitting(false);
      setPaymentStatus(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{mode === "subscription" ? "Upgrade to Premium" : "Unlock Item"}</DialogTitle>
          <DialogDescription>
            {mode === "subscription"
              ? `Get ${duration === "1_week" ? "Weekly" : "Monthly"} access for KES ${amount}`
              : `Pay KES ${amount} to unlock this ${itemType}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "subscription" && (
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <RadioGroup
                value={duration}
                onValueChange={(val: any) => setDuration(val)}
                className="grid grid-cols-2 gap-2"
                disabled={isSubmitting}
              >
                {PREMIUM_SUBSCRIPTION_PLANS.map((plan) => (
                  <div key={plan.duration}>
                    <RadioGroupItem
                      value={plan.duration}
                      id={plan.duration}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={plan.duration}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-sm font-medium">{plan.label}</span>
                      <span className="text-xs text-muted-foreground">KES {plan.amountKes}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">M-Pesa Number</Label>
            <Input
              id="phone"
              placeholder="e.g. 0712345678"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button
            onClick={handlePay}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {paymentStatus === "pending" ? "Verifying..." : "Sending STK Push..."}
              </span>
            ) : (
              `Pay KES ${amount}`
            )}
          </Button>

          {paymentStatus === "completed" && (
            <p className="text-center text-sm text-green-600 font-medium animate-in fade-in zoom-in">
              ✓ Payment successful!
            </p>
          )}
          {paymentStatus === "failed" && (
            <p className="text-center text-sm text-red-600 font-medium">
              ✗ Payment failed. Please try again.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
