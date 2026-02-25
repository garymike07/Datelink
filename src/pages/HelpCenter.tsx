import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <Link to="/contact">
            <Button>Contact Support</Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Quick answers to common questions, plus links to safety, policies, and support.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-semibold">Getting started</h2>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Create an account and complete your profile</li>
              <li>Add clear, recent photos</li>
              <li>Use Discover to start matching</li>
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Account & privacy</h2>
            <ul className="mt-3 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Review what we collect and how we use it</li>
              <li>Learn how to export or delete your data</li>
              <li>Understand cookies and preferences</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/privacy"><Button size="sm" variant="outline">Privacy Policy</Button></Link>
              <Link to="/cookies"><Button size="sm" variant="outline">Cookie Policy</Button></Link>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Safety & reporting</h2>
            <p className="text-sm text-muted-foreground mt-2">
              If someone makes you uncomfortable, trust your instincts and report them.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/safety-center"><Button size="sm" variant="outline">Safety Center</Button></Link>
              <Link to="/guidelines"><Button size="sm" variant="outline">Community Guidelines</Button></Link>
              <Link to="/report"><Button size="sm">Report a Problem</Button></Link>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Billing</h2>
            <p className="text-sm text-muted-foreground mt-2">Questions about payments, refunds, or subscriptions?</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/refunds"><Button size="sm" variant="outline">Refund Policy</Button></Link>
              <Link to="/contact"><Button size="sm">Contact Support</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
