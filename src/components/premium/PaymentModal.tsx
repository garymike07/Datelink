import { useEffect, useState, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PREMIUM_SUBSCRIPTION_PLANS, type PremiumPlanDuration, getPremiumAmountKes, UNLOCK_COST_KES } from "@/lib/pricing";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export function PaymentModal({ userId, isOpen, onClose, mode = "subscription", itemType, targetId, defaultDuration = "1_week" }: any) {
  const initiatePayment = useAction(api.payments.initiatePayment);
  const refreshPaymentStatus = useAction(api.paymentsStatus.refreshPaymentStatus);
  const [duration] = useState<PremiumPlanDuration>("1_week");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("idle"); // idle, pending, completed, failed
  const pollingRef = useRef<any>(null);

  const amount = mode === "unlock" ? UNLOCK_COST_KES : getPremiumAmountKes(duration);

  // Stop polling on unmount or close
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

  const startPolling = (pid: any) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes (2s intervals)
    
    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollingRef.current);
        setPaymentStatus("failed");
        toast.error("Payment verification timed out. Please check your billing history later.");
        return;
      }

      try {
        const result = await refreshPaymentStatus({ paymentId: pid, userId });
        if (result.status === "completed") {
          clearInterval(pollingRef.current);
          setPaymentStatus("completed");
          toast.success("Payment successful!");
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
      const productType = mode === "subscription" ? "subscription" : `${itemType}_unlock`;
      const result = await initiatePayment({ 
        userId, 
        amount, 
        currency: "KES", 
        paymentMethod: "mpesa", 
        productType, 
        planDuration: mode === "subscription" ? duration : undefined, 
        metadata: { phoneNumber },
        targetUserId: mode === "unlock" ? targetId : undefined
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "subscription" ? "Upgrade to Premium" : "Unlock Profile"}</DialogTitle>
          <DialogDescription>
            {paymentStatus === "idle" && (mode === "subscription" ? "Get 10 more profile unlocks and 7 days of premium access." : "Pay 10 KES to unlock this profile.")}
            {paymentStatus === "pending" && "Waiting for payment confirmation..."}
            {paymentStatus === "completed" && "Payment confirmed!"}
            {paymentStatus === "failed" && "Payment failed."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {paymentStatus === "idle" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">M-Pesa Phone Number</label>
                <Input 
                  placeholder="07xxxxxxxx" 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)} 
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handlePay} 
                disabled={isSubmitting || !phoneNumber}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Pay KES {amount}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              {paymentStatus === "pending" && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-center font-medium">Processing payment...</p>
                  <p className="text-xs text-muted-foreground">Please check your phone for the M-Pesa prompt.</p>
                </>
              )}
              {paymentStatus === "completed" && (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="text-center font-medium">Success!</p>
                </>
              )}
              {paymentStatus === "failed" && (
                <>
                  <XCircle className="h-12 w-12 text-red-500" />
                  <p className="text-center font-medium">Payment Failed</p>
                  <Button variant="outline" onClick={() => setPaymentStatus("idle")}>Try Again</Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
