import { useEffect, useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  PREMIUM_SUBSCRIPTION_PLANS,
  type PremiumPlanDuration,
  getPremiumAmountKes,
} from "@/lib/pricing";
import { Loader2, CheckCircle2, XCircle, Check } from "lucide-react";

export function PaymentModal({
  userId,
  isOpen,
  onClose,
  mode = "subscription",
  itemType,
  targetId,
  defaultDuration = "1_week",
}: any) {
  const initiatePayment = useAction(api.payments.initiatePayment);
  const refreshPaymentStatus = useAction(api.paymentsStatus.refreshPaymentStatus);
  const [duration, setDuration] = useState<PremiumPlanDuration>(
    defaultDuration as PremiumPlanDuration
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("idle");
  const pollingRef = useRef<any>(null);

  // Determine amount: unlock modes use a fixed cost; subscription uses plan price
  const amount =
    mode === "unlock"
      ? 10 // profile/match unlock cost (KES 10 per item)
      : getPremiumAmountKes(duration);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPaymentStatus("idle");
      setPaymentId(null);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [isOpen]);

  // Sync duration when defaultDuration prop changes (e.g. user clicks Weekly vs Monthly button)
  useEffect(() => {
    if (defaultDuration) {
      setDuration(defaultDuration as PremiumPlanDuration);
    }
  }, [defaultDuration]);

  const startPolling = (pid: any) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;
    const maxAttempts = 60;
    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollingRef.current);
        setPaymentStatus("failed");
        toast.error(
          "Payment verification timed out. Please check your billing history later."
        );
        return;
      }
      try {
        const result = await refreshPaymentStatus({ paymentId: pid, userId });
        if (result.status === "completed") {
          clearInterval(pollingRef.current);
          setPaymentStatus("completed");
          toast.success("Payment successful! Your subscription is now active.");
          setTimeout(() => onClose(), 2000);
        } else if (result.status === "failed") {
          clearInterval(pollingRef.current);
          setPaymentStatus("failed");
          toast.error("Payment failed or was cancelled.");
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 2000);
  };

  const handlePay = async () => {
    if (phoneNumber.trim().length < 9) return toast.error("Invalid phone number");
    setIsSubmitting(true);
    setPaymentStatus("pending");
    try {
      let productType: string;
      let planDuration: string | undefined;

      if (mode === "unlock") {
        productType = `${itemType}_unlock`;
        planDuration = undefined;
      } else {
        // Default: subscription
        productType = "subscription";
        planDuration = duration;
      }

      const result = await initiatePayment({
        userId,
        amount,
        currency: "KES",
        paymentMethod: "mpesa",
        productType,
        planDuration,
        metadata: { phoneNumber },
        targetUserId: mode === "unlock" ? targetId : undefined,
      });
      setPaymentId(result.paymentId);
      toast.info("STK Push sent! Please enter your PIN on your phone.");
      startPolling(result.paymentId);
    } catch (e: any) {
      toast.error(e.message);
      setPaymentStatus("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === "unlock") return "Unlock Profile";
    return "Upgrade to Premium";
  };

  const getDescription = () => {
    if (paymentStatus === "idle") {
      if (mode === "unlock") return "Pay KES 10 to unlock this profile.";
      return "Choose a plan to get full premium access to all features.";
    }
    if (paymentStatus === "pending") return "Waiting for payment confirmation...";
    if (paymentStatus === "completed") return "Payment confirmed!";
    if (paymentStatus === "failed") return "Payment failed.";
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {paymentStatus === "idle" ? (
            <>
              {/* Subscription plan selector */}
              {mode === "subscription" && (
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {PREMIUM_SUBSCRIPTION_PLANS.map((plan) => (
                    <button
                      key={plan.duration}
                      type="button"
                      onClick={() => setDuration(plan.duration)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all focus:outline-none ${
                        duration === plan.duration
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {duration === plan.duration && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <p className="font-semibold text-sm">{plan.label}</p>
                      <p className="text-xl font-bold text-primary mt-1">
                        KES {plan.amountKes}
                      </p>
                      <p className="text-xs text-muted-foreground">per {plan.periodLabel}</p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {plan.duration === "1_week" ? (
                          <>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> 7 days premium access
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> Unlimited profile views
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> Unlimited messaging
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> See who likes you
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> 30 days premium access
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> Unlimited profile views
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> Unlimited messaging
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> See who likes you
                            </li>
                            <li className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" /> Best value — save 30%
                            </li>
                          </>
                        )}
                      </ul>
                    </button>
                  ))}
                </div>
              )}

              {/* Phone number input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">M-Pesa Phone Number</label>
                <Input
                  placeholder="07xxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Confirm payment button */}
              <Button
                className="w-full"
                onClick={handlePay}
                disabled={isSubmitting || !phoneNumber}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Payment — KES {amount}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              {paymentStatus === "pending" && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-center font-medium">Processing payment...</p>
                  <p className="text-xs text-muted-foreground">
                    Please check your phone for the M-Pesa prompt.
                  </p>
                </>
              )}
              {paymentStatus === "completed" && (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="text-center font-medium text-green-700">
                    Payment Successful! You now have full access to all premium features.
                  </p>
                </>
              )}
              {paymentStatus === "failed" && (
                <>
                  <XCircle className="h-12 w-12 text-red-500" />
                  <p className="text-center font-medium">Payment Failed</p>
                  <p className="text-xs text-muted-foreground text-center">
                    The payment was not completed. Please check your details and try again.
                  </p>
                  <Button variant="outline" onClick={() => setPaymentStatus("idle")}>
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
