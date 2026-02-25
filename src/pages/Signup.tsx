import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import authImage from "@/assets/auth-side-image.png";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service to continue");
      return;
    }
    
    setIsLoading(true);

    try {
      await signup(formData.name, formData.email, formData.password);
      toast.success("Account created successfully! Welcome to DateLink. ❤️");
      // Redirect to new onboarding wizard instead of old profile setup
      navigate('/onboarding');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background max-w-[100vw] overflow-hidden">
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden order-2">
        {/* Order-2 to put image on right for signup, or left if we prefer consistency. Let's keep consistency: Left. So remove order-2. Wait, Login had image on Left. Let's put image on Right for Signup for variety? No, consistency is key. Left it is. */}
        {/* Actually, let's keep consistency. Image on Left. */}
        <div className="absolute inset-0 bg-black/20 z-10" />
        <img
          src={authImage}
          alt="Couple in love"
          className="w-full h-full object-cover scale-x-[-1]" // Flip for variety
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-4">Start your love story.</h2>
            <p className="text-lg text-white/90 max-w-md leading-relaxed">
              Create an account today and meet genuine people looking for real connections.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative order-1">
        <div className="absolute inset-0 bg-hero-pattern opacity-30 pointer-events-none lg:hidden" />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] z-10 glass-panel rounded-3xl p-6 md:p-8 shadow-glass-sm"
        >
          <div className="text-center lg:text-left mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="rounded-xl bg-transparent flex items-center justify-center">
                <img src="/logo.png" alt="DateLink" className="w-10 h-auto object-contain" />
              </div>
              <span className="font-heading font-bold text-2xl">DateLink</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-3">Create Account</h1>
            <p className="text-muted-foreground">Fill in your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 flex items-center justify-center w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-12 bg-white/50 dark:bg-black/20 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 flex items-center justify-center w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 bg-white/50 dark:bg-black/20 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-3.5 flex items-center justify-center w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 bg-white/50 dark:bg-black/20 border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl shadow-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator (Simple) */}
                <div className="flex gap-1 h-1 mt-2">
                  <div className={`flex-1 rounded-full transition-colors ${formData.password.length > 0 ? 'bg-red-400' : 'bg-muted'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${formData.password.length > 5 ? 'bg-yellow-400' : 'bg-muted'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${formData.password.length > 8 ? 'bg-green-400' : 'bg-muted'}`} />
                </div>
                <p className="text-xs text-muted-foreground text-right pt-1">Must be at least 6 characters long</p>
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start space-x-3 py-3 px-4 rounded-lg bg-primary/5 border border-primary/10">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed text-foreground cursor-pointer"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold rounded-xl btn-primary-glow gradient-love border-0 mt-2 hover:scale-[1.01] transition-transform"
              size="lg"
              disabled={isLoading || !agreedToTerms}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" /> Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Join Now <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-primary hover:underline underline-offset-4 transition-all">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
