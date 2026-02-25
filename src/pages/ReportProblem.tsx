import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const ReportProblem = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline">Contact Support</Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">Report a Problem</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Use in-app reporting wherever possible (profiles and chats). If you can’t access the app, you can report here.
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h2 className="text-xl font-semibold">How to report</h2>
              <ul className="mt-3 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>If it’s an emergency, contact local authorities immediately.</li>
                <li>For scams, harassment, or suspicious behavior, include the user’s name and what happened.</li>
                <li>Attach screenshots if you have them (remove any sensitive info).</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="mailto:safety@datelink.com?subject=Report%20a%20Problem"><Button>Send report via email</Button></a>
                <Link to="/safety-center"><Button variant="outline">Safety Center</Button></Link>
                <Link to="/guidelines"><Button variant="outline">Community Guidelines</Button></Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportProblem;
