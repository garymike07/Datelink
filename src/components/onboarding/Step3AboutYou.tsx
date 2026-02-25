import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface Step3Props {
  formData: {
    bio: string;
    jobTitle: string;
    education: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onSaveAndExit: () => void;
}

export const Step3AboutYou = ({ formData, onChange, onNext, onBack, onSkip, onSaveAndExit }: Step3Props) => {
  const canProceed = formData.bio.trim().length >= 20;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>About You</CardTitle>
        </div>
        <CardDescription>Share more about yourself to help others get to know you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio *</Label>
          <Textarea
            id="bio"
            placeholder="Tell people about yourself, your interests, what makes you unique..."
            value={formData.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            rows={5}
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum 20 characters</span>
            <span>{formData.bio.length}/500</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title (Optional)</Label>
          <Input
            id="jobTitle"
            placeholder="e.g., Software Engineer, Teacher, Entrepreneur"
            value={formData.jobTitle}
            onChange={(e) => onChange("jobTitle", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="education">Education (Optional)</Label>
          <Input
            id="education"
            placeholder="e.g., University of Nairobi, Bachelor's in Business"
            value={formData.education}
            onChange={(e) => onChange("education", e.target.value)}
          />
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">💡 Profile Tip</h4>
          <p className="text-sm text-muted-foreground">
            Profiles with detailed bios get 3x more matches! Share your hobbies, passions, and what you're looking for.
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
            Next: Goals
          </Button>
        </div>

        {!canProceed && formData.bio.length > 0 && (
          <p className="text-sm text-center text-amber-600 dark:text-amber-400">
            Please write at least {20 - formData.bio.length} more characters
          </p>
        )}
      </CardContent>
    </Card>
  );
};
