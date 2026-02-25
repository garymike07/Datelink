import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Calendar, MapPin, Heart, Coffee, Music, Film } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface IcebreakerSuggestionsProps {
    matchId: Id<"matches">;
    otherUserId: Id<"users">;
    viewerId: Id<"users">;
    onSelect: (message: string) => void;
}

// Kenya-specific conversation starters
const KENYA_ICEBREAKERS = [
    "Samosa or mandazi for a first date snack? 😄",
    "Favorite spot in Nairobi for a chill hangout?",
    "What's your go-to meal at your local kibanda?",
    "Team pilau or team biryani? 🍛",
    "Best matatu route you've ever been on? 😂",
    "Which Kenyan musician is on your playlist right now?",
    "If we could hang out anywhere in Kenya, where would you pick?",
    "Chai or kahawa? ☕",
    "What's your favorite thing about Kenyan culture?",
    "Ever been to the coast? What's your favorite beach?",
];

// Kiswahili greetings
const KISWAHILI_GREETINGS = [
    "Mambo! How's your day going? 😊",
    "Vipi! What's been the highlight of your week?",
    "Sasa! Tell me something interesting about yourself",
    "Habari! What do you love doing on weekends?",
];

const IcebreakerSuggestions = ({ matchId, otherUserId, viewerId, onSelect }: IcebreakerSuggestionsProps) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [category, setCategory] = useState<"smart" | "kenya" | "fun" | "kiswahili">("smart");
    const promptAnswers = useQuery(api.prompts.getUserPromptAnswers, { userId: otherUserId });
    const otherProfile = useQuery(api.profiles.getProfileById, { userId: otherUserId, viewerId });

    useEffect(() => {
        let generated: string[] = [];

        if (category === "smart") {
            // Generate smart suggestions based on profile data
            if (otherProfile?.interests && otherProfile.interests.length > 0) {
                const interest = otherProfile.interests[0];
                generated.push(`I saw you love ${interest}! Have you tried any new ${interest.toLowerCase()}-related activities recently?`);
            }

            // Based on prompt answers
            if (promptAnswers && promptAnswers.length > 0) {
                promptAnswers.slice(0, 2).forEach((answer) => {
                    if (answer.promptText.includes("looking for")) {
                        generated.push(`I saw you're looking for ${answer.answer.toLowerCase()}. Tell me more!`);
                    } else if (answer.promptText.includes("Sunday")) {
                        generated.push(`Your ideal Sunday sounds amazing! ${answer.answer}`);
                    } else if (answer.promptText.includes("geek out")) {
                        generated.push(`I love that you geek out on ${answer.answer}! What got you into it?`);
                    } else {
                        generated.push(`Your answer to "${answer.promptText}" made me smile! Tell me more...`);
                    }
                });
            }

            // Location-based
            if (otherProfile?.location) {
                generated.push(`Any recommendations for fun things to do in ${otherProfile.location}?`);
            }

            // Time-based greetings
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) {
                generated.push("Good morning! How do you usually start your day? ☀️");
            } else if (hour >= 12 && hour < 17) {
                generated.push("Hey! How's your day going so far?");
            } else if (hour >= 17 && hour < 22) {
                generated.push("Good evening! Any plans for tonight? 🌙");
            }

            // Weekend-specific
            const day = new Date().getDay();
            if (day === 5) {
                generated.push("Happy Friday! What are your weekend plans? 🎉");
            } else if (day === 6 || day === 0) {
                generated.push("How's your weekend going?");
            }

            // Default fallbacks
            if (generated.length < 3) {
                generated.push(
                    "Hey! I loved your profile. What's something that always makes you smile? 😊",
                    "Hi there! What's been the highlight of your week?",
                    "Hey! If you could travel anywhere right now, where would you go? ✈️"
                );
            }
        } else if (category === "kenya") {
            // Kenya-specific icebreakers
            generated = [...KENYA_ICEBREAKERS];
        } else if (category === "kiswahili") {
            // Kiswahili greetings
            generated = [...KISWAHILI_GREETINGS];
        } else if (category === "fun") {
            // Fun and playful questions
            generated = [
                "If you could only eat one food for the rest of your life, what would it be? 🍕",
                "What's the most spontaneous thing you've ever done? 😄",
                "Coffee date or sunset walk? ☕🌅",
                "What's your go-to karaoke song? 🎤",
                "If we were planning a perfect weekend together, what would we do?",
                "What's your hidden talent? 🌟",
                "Best movie you've watched recently? 🎬",
                "What's on your bucket list? 📝",
            ];
        }

        setSuggestions(generated.slice(0, 5));
    }, [promptAnswers, otherProfile, category]);

    if (suggestions.length === 0) return null;

    return (
        <Card className="p-4 mb-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-l-4 border-primary">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-medium">Conversation Starters</h4>
                </div>
                <Badge variant="secondary" className="text-xs">
                    New Match! 🎉
                </Badge>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                <Button
                    size="sm"
                    variant={category === "smart" ? "default" : "outline"}
                    onClick={() => setCategory("smart")}
                    className="text-xs"
                >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Smart
                </Button>
                <Button
                    size="sm"
                    variant={category === "kenya" ? "default" : "outline"}
                    onClick={() => setCategory("kenya")}
                    className="text-xs"
                >
                    <MapPin className="w-3 h-3 mr-1" />
                    Kenya
                </Button>
                <Button
                    size="sm"
                    variant={category === "kiswahili" ? "default" : "outline"}
                    onClick={() => setCategory("kiswahili")}
                    className="text-xs"
                >
                    <Coffee className="w-3 h-3 mr-1" />
                    Kiswahili
                </Button>
                <Button
                    size="sm"
                    variant={category === "fun" ? "default" : "outline"}
                    onClick={() => setCategory("fun")}
                    className="text-xs"
                >
                    <Heart className="w-3 h-3 mr-1" />
                    Fun
                </Button>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        className="w-full text-left justify-start h-auto py-3 px-3 text-sm hover:bg-primary/10 hover:border-primary transition-all"
                        onClick={() => onSelect(suggestion)}
                    >
                        <span className="flex-1">{suggestion}</span>
                    </Button>
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-3">
                💡 Tip: Personalized messages get 3x more replies!
            </p>
        </Card>
    );
};

export default IcebreakerSuggestions;
