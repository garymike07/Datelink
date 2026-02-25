import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 md:py-32 bg-secondary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
            Ready to Find Your Love?
          </h2>

          <p className="text-sm md:text-base font-body text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join DateLink today and start meeting amazing people who are serious about relationships
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-11 px-7 text-sm rounded-lg btn-gradient font-semibold"
              >
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-11 px-7 text-sm rounded-lg border-2 border-primary/30 text-primary hover:border-primary hover:text-primary font-semibold"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="text-xs text-muted-foreground mt-6">
            Secure M-Pesa Payment • Verified Profiles • Cancel Anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
