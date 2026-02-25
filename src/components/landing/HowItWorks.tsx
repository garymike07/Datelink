import { UserPlus, Search, Heart, MessageCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Register Free",
      description: "Create your profile with photos and bio. It takes less than 5 minutes to get started.",
    },
    {
      icon: Search,
      step: "02", 
      title: "Subscribe to Premium",
      description: "Unlock full platform access with advanced search, see who liked you, and browse all profiles.",
    },
    {
      icon: Heart,
      step: "03",
      title: "Unlock Profiles",
      description: "Found someone special? Unlock their full profile to see their photos and start a conversation.",
    },
    {
      icon: MessageCircle,
      step: "04",
      title: "Find Love",
      description: "Message your matches, plan dates, and build meaningful connections with real people.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3 text-foreground">
            How DateLink Works
          </h2>
          <p className="text-sm md:text-base font-body text-muted-foreground max-w-3xl mx-auto">
            Finding love has never been this easy or affordable
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="space-y-4 glass-card p-6 rounded-2xl border border-white/60 dark:border-white/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary/60">{step.step}</div>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
