import {
  Shield,
  MapPin,
  MessageCircle,
  BadgeCheck,
  Heart,
  Smartphone,
  Users,
  Lock
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "All users verify via phone. Optional ID verification for extra trust and a verified badge.",
    },
    {
      icon: MapPin,
      title: "Global Reach",
      description: "Find matches from anywhere in the world. Connect with people across cities and countries.",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp-Style Chat",
      description: "Familiar messaging experience with read receipts, typing indicators, and photo sharing.",
    },
    {
      icon: BadgeCheck,
      title: "Smart Matching",
      description: "Our algorithm considers location, interests, goals, and compatibility for better matches.",
    },
    {
      icon: Users,
      title: "Bilingual Platform",
      description: "Switch between English and Kiswahili anytime. Love is love, in any language!",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "Control who sees your profile. Block and report suspicious accounts instantly.",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Works perfectly on any device. Fast loading even on slow networks. Save data with lite mode.",
    },
    {
      icon: Heart,
      title: "Serious Connections",
      description: "We focus on meaningful relationships, not just swipes. Sweet love lasts!",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3 text-foreground">
            Built for meaningful connections
          </h2>
          <p className="text-sm md:text-base font-body text-muted-foreground max-w-3xl mx-auto">
            Every feature is designed to help you find genuine relationships
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="space-y-4 glass-card p-6 rounded-3xl border border-white/50 dark:border-white/5 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
