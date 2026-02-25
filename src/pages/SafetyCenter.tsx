import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Heart, Lock, Phone, Shield } from "lucide-react";

const SafetyCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
          <div className="flex gap-2">
            <Link to="/report"><Button variant="outline">Report a Problem</Button></Link>
            <Link to="/guidelines"><Button>Community Guidelines</Button></Link>
          </div>
        </div>

        <div className="mb-8 text-center">
          <Shield className="w-14 h-14 mx-auto text-primary mb-3" />
          <h1 className="text-3xl font-bold">Safety Center</h1>
          <p className="text-muted-foreground mt-2">
            Practical guidance to help you stay safe—online and in person.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Meeting Safely
              </CardTitle>
              <CardDescription>Tips for safe in‑person meetings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">For first dates, keep it simple and public.</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Meet in a public place and tell a friend where you’re going.</li>
                <li>Arrange your own transport and keep your phone charged.</li>
                <li>Trust your instincts—leave if anything feels off.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Protecting Personal Information
              </CardTitle>
              <CardDescription>Keep your data secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Don’t share your home address, workplace, or financial details.</li>
                <li>Be cautious about sharing your phone number too early.</li>
                <li>Watch out for anyone asking for money or “help” with payments.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Recognizing Red Flags
              </CardTitle>
              <CardDescription>Warning signs to watch out for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Pressure to move off-platform quickly.</li>
                <li>Requests for money, gifts, or “emergency” help.</li>
                <li>Inconsistent stories or refusal to meet in safe, public places.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Reporting
              </CardTitle>
              <CardDescription>Help keep the community safe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                If you see harassment, scams, or threatening behavior, report it. Reports are confidential.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/report"><Button>Report a Problem</Button></Link>
                <Link to="/contact"><Button variant="outline">Contact Support</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Phone className="w-5 h-5" />
                Emergency
              </CardTitle>
              <CardDescription className="text-red-700/80">If you are in immediate danger</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">Contact local emergency services immediately.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SafetyCenter;
