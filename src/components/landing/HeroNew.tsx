import { motion } from "framer-motion";
import { Heart, Sparkles, Users, Shield, ArrowRight, Star, BadgeCheck, Zap, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroNew = () => {
  const stats = [
    { icon: Users, value: "50K+", label: "Active Users", color: "from-blue-500 to-cyan-500" },
    { icon: Shield, value: "100%", label: "Verified", color: "from-green-500 to-emerald-500" },
    { icon: Heart, value: "1K+", label: "Daily Matches", color: "from-purple-500 to-fuchsia-500" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Ultra Premium Gradient Mesh */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-600/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-600/15 via-transparent to-transparent" />
      </div>
      
      {/* Animated Premium Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/30 via-fuchsia-500/20 to-transparent rounded-full blur-3xl -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-transparent rounded-full blur-3xl -z-10" 
      />

      {/* Elegant Floating Hearts */}
      <div className="absolute inset-0 -z-10 opacity-40">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 6 + 5) % 95}%`,
              top: `${(i * 7 + 10) % 85}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 5 + (i % 3) * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut",
            }}
          >
            <Heart className="w-4 h-4 text-purple-400/50 fill-purple-500/30" />
          </motion.div>
        ))}
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-purple-500/10 to-emerald-500/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-purple-500/30 shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Award className="w-5 h-5 text-purple-300" />
              </motion.div>
              <span className="text-sm font-black bg-gradient-to-r from-purple-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                The Most Trusted Dating Platform
              </span>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </motion.div>

            {/* Hero Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.1] tracking-tight mb-6">
                <span className="block text-white mb-2">
                  Discover Your
                </span>
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">
                    Perfect Match
                  </span>
                  <motion.div
                    className="absolute -bottom-3 left-0 right-0 h-3 bg-gradient-to-r from-purple-500/30 via-fuchsia-500/25 to-emerald-500/25 rounded-full blur-sm"
                    animate={{ scaleX: [0.8, 1, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </span>
                <motion.div
                  className="inline-block ml-4"
                  animate={{ 
                    rotate: [0, 14, -14, 0],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="w-12 h-12 lg:w-16 lg:h-16 text-purple-400 fill-purple-500 inline-block drop-shadow-2xl" />
                </motion.div>
              </h1>
            </motion.div>

            {/* Compelling Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Join <span className="text-white font-extrabold bg-gradient-to-r from-purple-300 to-emerald-300 bg-clip-text text-transparent">50,000+ verified singles</span> who are finding genuine, meaningful connections every day.
            </motion.p>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              <div className="flex items-center gap-2 bg-emerald-950/40 px-4 py-2.5 rounded-full border border-emerald-700/50 backdrop-blur-sm">
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-emerald-300">100% Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-950/40 px-4 py-2.5 rounded-full border border-blue-700/50 backdrop-blur-sm">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm text-blue-300">Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-950/40 px-4 py-2.5 rounded-full border border-purple-700/50 backdrop-blur-sm">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm text-purple-300">Affordable pricing</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <Link to="/signup" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-16 px-12 text-lg rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-emerald-500 hover:shadow-[0_20px_60px_-15px_rgba(244,63,94,0.5)] hover:scale-105 text-white font-black transition-all duration-300 group border-0 relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-200%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <Heart className="w-6 h-6 mr-3 fill-white group-hover:animate-pulse relative z-10" />
                  <span className="relative z-10">Start Free Today</span>
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform relative z-10" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto h-16 px-12 text-lg rounded-2xl border-2 border-gray-700 hover:bg-gray-800/80 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 font-bold backdrop-blur-sm bg-gray-900/60 text-white"
                >
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Trust Line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-sm text-gray-400 flex items-center justify-center lg:justify-start gap-3 flex-wrap"
            >
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Free to join
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Cancel anytime
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                Secure payments
              </span>
            </motion.p>
          </div>

          {/* Right Visual - Stats Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 w-full max-w-md lg:max-w-lg"
          >
            <div className="grid grid-cols-1 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative"
                >
                  <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl overflow-hidden">
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    <div className="relative z-10 flex items-center gap-6">
                      <motion.div 
                        className={`p-5 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: index * 0.3 }}
                      >
                        <stat.icon className="w-10 h-10 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-5xl font-black text-white mb-1">{stat.value}</p>
                        <p className="text-base text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroNew;
