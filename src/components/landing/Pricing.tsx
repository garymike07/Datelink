import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Heart, Star, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const primaryPlan = {
    name: "Premium Access",
    price: "100",
    period: "/week",
    features: [
      "10 More Profile Unlocks",
      "See Who Liked You",
      "5 Super Likes Daily",
      "Unlimited Rewinds",
      "Passport Mode",
      "Priority Customer Support"
    ]
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-black">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-6 text-white">
              Ready to find your <span className="text-primary italic">Perfect Match?</span>
            </h2>
            <p className="text-xl text-gray-400">
              Upgrade to Premium and get 10 more profile unlocks plus exclusive features to help you stand out.
            </p>
          </motion.div>
        </div>

        <div className="max-w-lg mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            {/* Animated Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x" />
            
            <div className="relative bg-zinc-900 rounded-3xl p-8 md:p-10 border border-white/10 overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-gold px-6 py-2 rounded-bl-2xl text-kenya-black font-bold text-sm flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-current" />
                  MOST POPULAR
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-heading font-bold text-white mb-2">{primaryPlan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-heading font-black text-white">KES {primaryPlan.price}</span>
                  <span className="text-gray-400 font-medium">{primaryPlan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {primaryPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-base text-gray-300">{feature}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-base text-gray-300">Access remains while subscribed</span>
                </div>
              </div>

              {/* CTA Button */}
              <Link to="/signup" className="block">
                <Button className="w-full h-16 text-lg font-black rounded-2xl gradient-gold hover:scale-105 transition-all duration-300 border-0 text-kenya-black">
                  <Crown className="w-6 h-6 mr-2" />
                  Start Unlocking
                </Button>
              </Link>

              {/* Bottom Accent */}
              <div className="absolute bottom-0 left-0 right-0 h-2 gradient-gold" />
            </div>
          </motion.div>
        </div>

        {/* Extended Subscription Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-base font-heading font-bold text-center mb-5 text-white">
            Simple & Affordable Premium Access
          </h3>
          
          <div className="max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl p-[2px]"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 gradient-love rounded-full text-[10px] font-bold text-primary-foreground flex items-center gap-1 z-10">
                <Crown className="w-2.5 h-2.5" />
                PREMIUM ACCESS
              </div>
              
              <div className="bg-black/70 rounded-xl p-6 text-center border border-white/10">
                <p className="text-xs text-white/70 mb-1.5">Choose a plan: 100/week • 350/month</p>
                <div className="mb-2">
                  <span className="text-4xl font-heading font-bold text-white">
                    KES {primaryPlan.price}
                  </span>
                </div>
                <p className="text-xs text-white/70 mb-4">
                  Unlock all premium features
                </p>
                <Link to="/signup">
                  <Button 
                    size="sm" 
                    className="w-full btn-gradient font-semibold"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-secondary" /> Secure Payments
            </span>
            <span className="mx-1">•</span>
            <span className="inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-secondary" /> Instant Activation
            </span>
            <span className="mx-1">•</span>
            <span className="inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-secondary" /> Cancel Anytime
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
