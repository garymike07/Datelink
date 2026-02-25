import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Receipt } from "lucide-react";

const Refunds = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <Receipt className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Refund Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: January 14, 2026</p>

          <div className="space-y-6 text-sm">
            <section>
              <h2 className="text-lg font-semibold mb-2">Overview</h2>
              <p className="text-muted-foreground">
                If you experience an issue with a paid subscription, contact support and we’ll review your request.
                Refund eligibility may depend on your payment method, local laws, and usage.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">How to request a refund</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Email support@datelink.com with your account email and payment reference.</li>
                <li>Describe the problem and when it occurred.</li>
                <li>We may request additional details to verify the transaction.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">Non-refundable cases</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Abuse of the refund process or policy violations</li>
                <li>Requests without transaction details we can verify</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">Contact</h2>
              <p className="text-muted-foreground">Email support@datelink.com for billing help.</p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Refunds;
