import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Target, Heart, Users, Coffee, Church } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step4Props {
  formData: {
    relationshipGoal: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onSaveAndExit: () => void;
}

const goals = [
  {
    value: "serious",
    label: "Long-term Relationship",
    description: "Looking for something serious",
    icon: Heart,
    color: "rose",
  },
  {
    value: "marriage",
    label: "Marriage",
    description: "Ready to settle down",
    icon: Church,
    color: "purple",
  },
  {
    value: "casual",
    label: "Casual Dating",
    description: "Keeping it light and fun",
    icon: Coffee,
    color: "blue",
  },
  {
    value: "friendship",
    label: "New Friends",
    description: "Making connections first",
    icon: Users,
    color: "green",
  },
];

export const Step4Goals = ({ formData, onChange, onNext, onBack, onSkip, onSaveAndExit }: Step4Props) => {
  const canProceed = formData.relationshipGoal !== "";

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle>Relationship Goals</CardTitle>
        </div>
        <CardDescription>What are you looking for on DateLink?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select your goal</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = formData.relationshipGoal === goal.value;

              return (
                <button
                  key={goal.value}
                  onClick={() => onChange("relationshipGoal", goal.value)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all hover:scale-105",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        goal.color === "rose" && "bg-rose-100 dark:bg-rose-900/30",
                        goal.color === "purple" && "bg-purple-100 dark:bg-purple-900/30",
                        goal.color === "blue" && "bg-blue-100 dark:bg-blue-900/30",
                        goal.color === "green" && "bg-green-100 dark:bg-green-900/30"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          goal.color === "rose" && "text-rose-600 dark:text-rose-400",
                          goal.color === "purple" && "text-purple-600 dark:text-purple-400",
                          goal.color === "blue" && "text-blue-600 dark:text-blue-400",
                          goal.color === "green" && "text-green-600 dark:text-green-400"
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{goal.label}</h3>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 Being clear about your intentions helps you find compatible matches
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button variant="outline" onClick={onSaveAndExit} className="flex-1">
            Save & Exit
          </Button>
          <Button onClick={onNext} disabled={!canProceed} className="flex-1">
            Next: Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
