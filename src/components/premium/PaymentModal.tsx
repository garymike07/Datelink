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

  const amount = mode === "unlock" ? UNLOCK_COST_KES : getPremiumAmountKes(duration);

  const handlePay = async () => {
    if (phoneNumber.trim().length < 9) return toast.error("Invalid phone number");
    setIsSubmitting(true);
    try {
      const productType = mode === "subscription" ? "subscription" : `${itemType}_unlock`;
      const { paymentId } = await initiatePayment({ userId, amount, currency: "KES", paymentMethod: "mpesa", productType, planDuration: mode === "subscription" ? duration : undefined, metadata: { phoneNumber } });
      toast.info("STK Push sent!");
      // simplified polling omitted for brevity in recovery
    } catch (e: any) { toast.error(e.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "subscription" ? "Upgrade" : "Unlock"}</DialogTitle></DialogHeader>
        <Input placeholder="M-Pesa Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
        <Button onClick={handlePay} disabled={isSubmitting}>Pay KES {amount}</Button>
      </DialogContent>
    </Dialog>
  );
}
