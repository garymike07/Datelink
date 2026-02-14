import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, Sparkles, Heart, Shield, Phone, MessageCircle, Eye, Infinity, TrendingUp, Users, Search, Award, Lock, Calendar, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PricingPage = () => {
  const freeFeatures = ["10 free profile unlocks", "10 free likes total", "10 free match accesses"];
  const weeklyFeatures = ["7 days full access", "10 EXTRA profile unlocks (20 total)", "10 EXTRA likes (20 total)", "10 EXTRA match accesses (20 total)"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 text-center">
        <h1 className="text-5xl font-black mb-12">Affordable Pricing</h1>
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
          <Card label="Free" price="0" features={freeFeatures} />
          <Card label="Weekly" price="100" features={weeklyFeatures} popular />
          <Card label="Monthly" price="350" features={weeklyFeatures} />
        </div>
      </section>
      <Footer />
    </div>
  );
};

const Card = ({ label, price, features, popular }: any) => (
  <div className={`p-8 border rounded-3xl flex flex-col ${popular ? 'border-primary shadow-xl' : ''}`}>
    <h3 className="text-2xl font-bold mb-4">{label}</h3>
    <div className="text-4xl font-black mb-8">KES {price}</div>
    <ul className="space-y-4 mb-8 flex-grow text-left">
      {features.map((f: any, i: any) => <li key={i}><Check className="inline w-4 h-4 mr-2" />{f}</li>)}
    </ul>
    <Link to="/signup"><Button className="w-full">{popular ? 'Get Started' : 'Select Plan'}</Button></Link>
  </div>
);

export default PricingPage;
