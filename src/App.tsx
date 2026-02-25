import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "./components/layout/MainLayout";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));
const Discover = lazy(() => import("./pages/Discover"));
const Likes = lazy(() => import("./pages/Likes"));
const Matches = lazy(() => import("./pages/Matches"));
const Messages = lazy(() => import("./pages/Messages"));
const Chat = lazy(() => import("./pages/Chat"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Safety = lazy(() => import("./pages/Safety"));
const Settings = lazy(() => import("./pages/Settings"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Subscription = lazy(() => import("./pages/Subscription"));
const TopPicks = lazy(() => import("./pages/TopPicks"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Guidelines = lazy(() => import("./pages/Guidelines"));
const SafetyCenter = lazy(() => import("./pages/SafetyCenter"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Contact = lazy(() => import("./pages/Contact"));
const ReportProblem = lazy(() => import("./pages/ReportProblem"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Refunds = lazy(() => import("./pages/Refunds"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PhotoVerification = lazy(() => import("./pages/PhotoVerification"));
const NotificationDebug = lazy(() => import("./pages/NotificationDebug"));
const Pricing = lazy(() => import("./pages/Pricing"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="animate-pulse-soft text-primary">Loading…</div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/safety-center" element={<SafetyCenter />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/report" element={<ReportProblem />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/refunds" element={<Refunds />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/pricing" element={<Pricing />} />
              
              {/* Onboarding - Semi-public (requires auth but not in MainLayout) */}
              <Route path="/onboarding" element={<OnboardingWizard />} />

              {/* Authenticated Routes wrapped in MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/profile/:userId" element={<PublicProfile />} />
                <Route path="/photo-verification" element={<PhotoVerification />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/top-picks" element={<TopPicks />} />
                <Route path="/likes" element={<Likes />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/chat/:matchId" element={<Chat />} />
                <Route path="/safety" element={<Safety />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/notification-debug" element={<NotificationDebug />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
