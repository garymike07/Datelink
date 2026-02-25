import { motion } from "framer-motion";
import { Heart, Sparkles, Shield, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
// Use a placeholder if local image is missing, or rely on public folder
// Assuming src/assets/hero-couple.jpg exists, but fallback is safer
const heroCoupleImage = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2070&auto=format&fit=crop";

const Hero = () => {
  const stats = [
    { icon: Users, value: "50,000+", label: "Singles" },
    { icon: Shield, value: "100%", label: "Verified" },
    { icon: Heart, value: "1,000+", label: "Matches" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 lg:pt-24 pb-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-hero-pattern opacity-60 -z-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/40 to-white/10 dark:from-black/60 dark:via-black/40 dark:to-black/20 -z-10" />
      
      {/* Organic Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[80px] -z-10 -translate-x-1/3 translate-y-1/3" 
      />

      {/* Floating Hearts Animation */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none z-0"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        >
          <Heart className={`w-${Math.floor(Math.random() * 6) + 4} h-${Math.floor(Math.random() * 6) + 4} text-primary/20 fill-primary/10`} />
        </motion.div>
      ))}

      <div className="container-wide relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Text Content */}
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full mb-6 border border-primary/20 shadow-sm hover:shadow-md transition-shadow cursor-default"
            >
              <Sparkles className="w-3 h-3 text-primary animate-pulse-soft" />
              <span className="text-[10px] font-semibold text-foreground tracking-wide">Kenya's Premier Dating Experience</span>
            </motion.div>

            {/* Main Heading - Enhanced */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-heading font-extrabold mb-4 leading-[1.05] text-foreground tracking-tight"
            >
              Discover Love <br />
              <span className="relative inline-block">
                <span className="text-gradient-love relative z-10 animate-shimmer bg-[length:200%_100%]" style={{
                  backgroundImage: 'linear-gradient(90deg, hsl(356, 85%, 55%) 0%, hsl(345, 80%, 45%) 25%, hsl(356, 85%, 55%) 50%, hsl(345, 80%, 45%) 75%, hsl(356, 85%, 55%) 100%)'
                }}>Naturally</span>
                <span className="absolute bottom-1.5 left-0 w-full h-2.5 bg-primary/20 -rotate-1 -z-0 rounded-full blur-[1px]"></span>
                <motion.span
                  className="absolute -right-4 -top-3"
                  animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary fill-primary opacity-80" />
                </motion.span>
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xs md:text-sm text-muted-foreground mb-5 font-light max-w-2xl mx-auto leading-relaxed"
            >
              Join Kenya's most trusted community of singles. Safe, verified, and designed for meaningful connections that last.
            </motion.p>

            {/* Pricing/Value Prop */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 text-[10px] font-medium text-muted-foreground bg-white/50 dark:bg-black/20 p-2.5 rounded-2xl backdrop-blur-sm border border-border/50 max-w-fit mx-auto"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span>Premium features available</span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>Verified Profiles Only</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
            >
              <Link to="/signup">
                <Button className="h-10 px-7 text-xs rounded-full btn-gradient border-0 hover:scale-105 transition-transform duration-300 shadow-glow-strong group">
                  <Heart className="w-4 h-4 fill-white mr-1.5 group-hover:animate-pulse-soft" />
                  Find My Match
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" className="h-10 px-7 text-xs rounded-full border-2 bg-white/60 dark:bg-black/40 border-primary/20 hover:border-secondary hover:text-secondary transition-all hover:scale-105 duration-300">
                How It Works <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-5 md:gap-8 border-t border-border pt-5 max-w-2xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <p className="text-xl font-heading font-bold text-foreground mb-0.5">
                    {stat.value}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
