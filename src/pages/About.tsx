import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartHandshake, ShieldCheck, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-white">Get Started</Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">About DateLink</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            DateLink helps genuine people meet safely and respectfully. We focus on verified profiles, clear boundaries,
            and a community built on kindness.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <HeartHandshake className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Real Connections</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              A modern dating experience designed for people who want authentic conversations and intentional dating.
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Safety First</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Clear safety guidance, robust reporting tools, and community standards that keep the platform respectful.
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Community Values</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              We’re building a welcoming space that celebrates diversity and expects mutual respect.
            </p>
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-2">What we stand for</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Be kind. Be honest. Be safe.</li>
            <li>Consent and boundaries are non‑negotiable.</li>
            <li>Harassment, hate, scams, and exploitation are not tolerated.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/guidelines"><Button variant="outline">Community Guidelines</Button></Link>
            <Link to="/safety-center"><Button variant="outline">Safety Center</Button></Link>
            <Link to="/contact"><Button variant="outline">Contact Us</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default About;
