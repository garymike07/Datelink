import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, MessageCircle, Shield } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full mb-4">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Welcome to DateLink!
            </h1>
            <p className="text-lg text-muted-foreground">
              Let's create your profile and start your journey to finding meaningful connections
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Discover Matches</h3>
                <p className="text-sm text-muted-foreground">
                  Find people who share your interests and values
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Connect Instantly</h3>
                <p className="text-sm text-muted-foreground">
                  Chat, call, and build real connections
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Safe & Secure</h3>
                <p className="text-sm text-muted-foreground">
                  Your privacy and safety are our top priority
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Authentic Profiles</h3>
                <p className="text-sm text-muted-foreground">
                  Verified users looking for genuine relationships
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button onClick={onStart} size="lg" className="w-full text-lg h-12">
              Let's Get Started
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Takes about 5 minutes to complete • You can save and continue later
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
