import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Quote } from "lucide-react";

const SuccessStories = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const stories = [
    {
      names: "Brian & Akinyi",
      location: "Nairobi",
      duration: "Together 2 years",
      quote: "We met on DateLink and now we are planning our wedding. The community made it easy to find someone serious about love.",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=faces",
    },
    {
      names: "Peter & Wanjiku",
      location: "Mombasa",
      duration: "Engaged",
      quote: "The verified profiles gave us confidence. We connected over shared goals and now we are engaged.",
      image: "https://images.unsplash.com/photo-1524503033411-c9566986fc8f?w=400&h=400&fit=crop&crop=faces",
    },
    {
      names: "David & Esther",
      location: "Kisumu",
      duration: "Married",
      quote: "The pricing was perfect for us. We met, dated, and now we are married. Thank you for bringing us together.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
    },
    {
      names: "Kevin & Wambui",
      location: "Nakuru",
      duration: "Together 1 year",
      quote: "Everyone is serious about real love here. We found each other quickly and the experience felt safe and respectful.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces",
    },
  ];

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <section id="success-stories" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 text-foreground rounded-full text-sm font-bold mb-6 border border-primary/15"
          >
            <Heart className="w-5 h-5 fill-primary text-primary" />
            Success Stories
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight">
            Real Love, Real <span className="text-gradient-love">Stories</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of singles who found their perfect match on DateLink.
          </p>
        </motion.div>

        {/* Stories Carousel */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Navigation Buttons */}
            <motion.button
              onClick={prevStory}
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 w-14 h-14 rounded-full bg-white/80 border-2 border-white/60 shadow-xl flex items-center justify-center text-primary hover:border-primary transition-colors z-10"
            >
              <ChevronLeft className="w-7 h-7" />
            </motion.button>
            
            <motion.button
              onClick={nextStory}
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 w-14 h-14 rounded-full bg-white/80 border-2 border-white/60 shadow-xl flex items-center justify-center text-primary hover:border-primary transition-colors z-10"
            >
              <ChevronRight className="w-7 h-7" />
            </motion.button>

            {/* Story Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
                
                {/* Card */}
                <div className="relative bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden">
                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />

                  <div className="relative flex flex-col md:flex-row items-center gap-8">
                    {/* Image */}
                    <motion.div 
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-primary/20">
                        <img
                          src={stories[currentIndex].image}
                          alt={stories[currentIndex].names}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <motion.div 
                        className="absolute -bottom-4 -right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <Heart className="w-7 h-7 text-white fill-white" />
                      </motion.div>
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 text-center md:text-left">
                      <Quote className="w-12 h-12 text-primary/30 mb-6 mx-auto md:mx-0" />
                      
                      <p className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed font-medium italic">
                        "{stories[currentIndex].quote}"
                      </p>

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-black text-foreground mb-2">
                            {stories[currentIndex].names}
                          </h4>
                          <p className="text-base text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            {stories[currentIndex].location} • {stories[currentIndex].duration}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-6 h-6 text-accent fill-accent" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 gradient-love" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex items-center justify-center gap-3 mt-10">
              {stories.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-12 h-3 gradient-love"
                      : "w-3 h-3 bg-muted hover:bg-muted/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { number: "1,000+", label: "Success Stories" },
            { number: "50,000+", label: "Happy Members" },
            { number: "100%", label: "Verified Profiles" },
            { number: "4.9/5", label: "User Rating" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-black text-foreground mb-2">{stat.number}</p>
              <p className="text-sm md:text-base text-muted-foreground font-semibold">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SuccessStories;
