import { motion } from "framer-motion";
import { Heart, Sparkles, Shield, Users, ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-couple-kenyan.png";

const HeroSimple = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Happy Kenyan Couple"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Animated Gradient Orbs - Adjusted for visibility */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl mix-blend-screen"
      />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center space-y-8">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-xl"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-accent" />
            </motion.div>
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Premium Kenyan Dating
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black tracking-tight mb-6 leading-[1.1] text-white drop-shadow-lg">
              <span className="block mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/80">
                Connect. Love. Unite.
              </span>
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-accent via-white to-accent">
                Perfect Match
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-2 bg-accent/50 rounded-full blur-sm"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
              Connect with singles in Nairobi and across Kenya. Serious relationships, genuine connections, and true love await.
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 text-white"
          >
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-xs">Verified Profiles</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
              <Users className="w-4 h-4 text-accent" />
              <span className="font-semibold text-xs">Safe Community</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base rounded-full bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-300"
              >
                <Heart className="w-5 h-5 mr-2 fill-white animate-pulse" />
                Start Dating Now
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white hover:text-black hover:border-white transition-all duration-300"
              >
                Member Log In
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSimple;
