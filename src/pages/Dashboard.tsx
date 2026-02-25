import { useEffect } from "react";
import { Heart, MessageCircle, Star, Search, Shield, User, Sparkles, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Progress } from "@/components/ui/progress";
import DailyQuests from "@/components/gamification/DailyQuests";
import BadgeDisplay from "@/components/profile/BadgeDisplay";
import NewInAreaCarousel from "@/components/discovery/NewInAreaCarousel";
import TopCompatibleCarousel from "@/components/discovery/TopCompatibleCarousel";
import { ProfileCompletionScore } from "@/components/profile/ProfileCompletionScore";
import { DailyStreakWidget } from "@/components/gamification/DailyStreakWidget";
import { ProfileViewsCounter } from "@/components/profile/ProfileViewsCounter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?._id;
  
  const profile = useQuery(api.profiles.getMyProfile, userId ? { userId } : "skip");
  const matches = useQuery(api.matching.getMatches, userId ? { userId } : "skip");
  const conversations = useQuery(api.messages.getConversations, userId ? { userId } : "skip");
  const profileStats = useQuery(api.analytics.getProfileStats, userId ? { userId } : "skip");
  const activityFeed = useQuery(api.analytics.getActivityFeed, userId ? { userId, limit: 5 } : "skip");
  const userBadges = useQuery(api.badges.getUserBadges, userId ? { userId } : "skip");
  const profileStrength = useQuery(api.analytics.getProfileStrength, userId ? { userId } : "skip");

  const updateLastActive = useMutation(api.activityTracking.updateLastActive);

  // Update last active on mount and redirect to profile setup if no profile exists
  useEffect(() => {
    if (userId && profile === null) {
      navigate('/profile-setup');
    }

    // Update user's last active status
    if (userId) {
      updateLastActive({ userId });
    }
  }, [userId, profile, navigate, updateLastActive]);

  if (authLoading || (userId && profile === undefined)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center animate-pulse-soft">
          <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {authLoading ? "Authenticating..." : "Loading your profile..."}
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    useEffect(() => {
      navigate("/login");
    }, [navigate]);
    return null;
  }

  const unreadCount = conversations?.reduce((sum, conv) => sum + conv.unreadCount, 0) || 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="space-y-6 pb-20 md:pb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6 rounded-2xl border-white/60 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-foreground">
            Jambo, <span className="text-gradient-love">{user.name}</span>! 👋
          </h2>
          <p className="text-muted-foreground">Ready to find your match today?</p>
        </div>
        {profile && (
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-semibold mb-2 text-foreground/80">
              <span>Profile Completion</span>
              <span>{profile.completeness}%</span>
            </div>
            <Progress value={profile.completeness} className="h-3 rounded-full bg-muted" indicatorClassName="bg-gradient-kenya" />
          </div>
        )}
      </motion.div>

      {/* Daily Streak Banner - Show only if can claim today */}
      {userId && (
        <motion.div variants={itemVariants}>
          <DailyStreakWidget userId={userId} variant="banner" />
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="text-center glass-panel border-white/40 hover:border-primary/30 hover:translate-y-[-2px] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Heart className="w-6 h-6 text-primary fill-primary/20 animate-pulse-soft" />
            </div>
            <p className="text-2xl font-bold text-foreground">{matches?.length || 0}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Matches</p>
          </CardContent>
        </Card>

        <Card className="text-center glass-panel border-white/40 hover:border-blue-500/30 hover:translate-y-[-2px] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="w-12 h-12 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profileStats?.viewsToday || 0}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Views Today</p>
          </CardContent>
        </Card>

        <Card className="text-center glass-panel border-white/40 hover:border-green-500/30 hover:translate-y-[-2px] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="w-12 h-12 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profileStats?.likesReceivedToday || 0}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Likes Received</p>
          </CardContent>
        </Card>

        <Card className="text-center glass-panel border-white/40 hover:border-accent/30 hover:translate-y-[-2px] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-accent fill-accent/20" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.completeness || 0}%</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Complete</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Actions Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Picks Card */}
        <Card
          className="glass-panel border-white/40 hover:shadow-lg hover:shadow-amber-500/10 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer group bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-950/25 dark:to-orange-950/25"
          onClick={() => navigate('/top-picks')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              Top Picks
            </CardTitle>
            <CardDescription>
              Daily curated matches just for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-black bg-gray-200" />
                ))}
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 shadow-md">
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Discover Card */}
        <Card
          className="glass-panel border-white/40 hover:shadow-lg hover:shadow-primary/10 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer group relative overflow-hidden"
          onClick={() => navigate('/discover')}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Search className="w-5 h-5 text-primary" />
              </div>
              Discover
            </CardTitle>
            <CardDescription>
              Find your perfect match nearby
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Swipe through profiles in your area.
            </p>
            <Button className="w-full btn-primary-glow gradient-love border-0 rounded-xl font-bold">
              Start Swiping
            </Button>
          </CardContent>
        </Card>

        {/* Messages Card */}
        <Card
          className="glass-panel border-white/40 hover:shadow-lg hover:translate-y-[-4px] transition-all duration-300 cursor-pointer group"
          onClick={() => navigate('/messages')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              Messages
              {unreadCount > 0 && (
                <span className="ml-auto bg-primary text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-[10px] px-1 font-bold animate-pulse-soft">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Chat with your matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {unreadCount > 0
                ? `${unreadCount} unread message(s) waiting.`
                : 'Start a conversation today.'}
            </p>
            <Button className="w-full border-2 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-xl" variant="outline">
              Open Chat
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Carousels */}
      {userId && (
        <>
          <motion.div variants={itemVariants}>
            <TopCompatibleCarousel userId={userId} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <NewInAreaCarousel userId={userId} />
          </motion.div>
        </>
      )}

      {/* Daily Quests & Profile Strength */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <DailyQuests userId={userId} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProfileCompletionScore userId={userId} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
