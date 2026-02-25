import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Shield } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <Link to="/help">
            <Button variant="outline">Help Center</Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">Contact Us</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            We’re here to help. For urgent safety concerns, please use the Safety Center guidance and contact local
            authorities if you’re in danger.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Support</h2>
            </div>
            <p className="text-sm text-muted-foreground">Account help, technical issues, billing questions.</p>
            <div className="mt-4">
              <a href="mailto:support@datelink.com"><Button>support@datelink.com</Button></a>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Safety</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Reporting harassment, scams, or safety concerns.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/safety-center"><Button variant="outline">Safety Center</Button></Link>
              <Link to="/report"><Button>Report a Problem</Button></Link>
            </div>
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold">Before you message us</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Include the email you signed up with.</li>
            <li>Share screenshots if relevant (avoid sending sensitive info like OTPs or passwords).</li>
            <li>Tell us what you expected vs what happened.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Contact;
