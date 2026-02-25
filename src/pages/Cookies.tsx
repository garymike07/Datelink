import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Cookie } from "lucide-react";

const Cookies = () => {
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
            <Cookie className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Last updated: January 14, 2026</p>

          <div className="space-y-6 text-sm">
            <section>
              <h2 className="text-lg font-semibold mb-2">What are cookies?</h2>
              <p className="text-muted-foreground">
                Cookies are small text files stored on your device that help websites remember preferences and understand
                how the site is used.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">How we use cookies</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Essential: authentication, security, and core site functionality</li>
                <li>Preferences: language, theme, and other settings</li>
                <li>Analytics: understanding usage to improve performance and features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">Managing cookies</h2>
              <p className="text-muted-foreground">
                You can control cookies through your browser settings. Disabling some cookies may affect site
                functionality.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">Contact</h2>
              <p className="text-muted-foreground">Questions? Email privacy@datelink.com</p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Cookies;
