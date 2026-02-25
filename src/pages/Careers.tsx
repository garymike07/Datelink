import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <a href="mailto:careers@datelink.com">
            <Button variant="outline">Email Careers</Button>
          </a>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">Careers</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Help us build a safer, more respectful way for people to meet.
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Open roles</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We’re not hiring publicly right now. If you’re passionate about safety, trust, and great UX, email us and tell
            us how you’d like to contribute.
          </p>
          <div className="mt-4">
            <a href="mailto:careers@datelink.com"><Button>careers@datelink.com</Button></a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Careers;
