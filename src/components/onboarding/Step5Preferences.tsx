import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sliders } from "lucide-react";

interface Step5Props {
  formData: {
    minAge: string;
    maxAge: string;
    maxDistance: string;
    genderPreference: string[];
  };
  onChange: (field: string, value: string | string[]) => void;
  onComplete: () => void;
  onBack: () => void;
  onSaveAndExit: () => void;
}

export const Step5Preferences = ({ formData, onChange, onComplete, onBack, onSaveAndExit }: Step5Props) => {
  const canProceed =
    formData.minAge &&
    formData.maxAge &&
    formData.maxDistance &&
    formData.genderPreference.length > 0;

  const toggleGenderPreference = (gender: string) => {
    const current = formData.genderPreference;
    if (current.includes(gender)) {
      onChange("genderPreference", current.filter((g) => g !== gender));
    } else {
      onChange("genderPreference", [...current, gender]);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle>Matching Preferences</CardTitle>
        </div>
        <CardDescription>Set your preferences for discovering matches</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Gender Preference *</Label>
          <div className="space-y-2">
            {["woman", "man", "non-binary"].map((gender) => (
              <div key={gender} className="flex items-center space-x-2">
                <Checkbox
                  id={gender}
                  checked={formData.genderPreference.includes(gender)}
                  onCheckedChange={() => toggleGenderPreference(gender)}
                />
                <Label htmlFor={gender} className="cursor-pointer capitalize font-normal">
                  {gender === "non-binary" ? "Non-binary" : gender}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minAge">Min Age *</Label>
            <Input
              id="minAge"
              type="number"
              min="18"
              max="100"
              placeholder="18"
              value={formData.minAge}
              onChange={(e) => onChange("minAge", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAge">Max Age *</Label>
            <Input
              id="maxAge"
              type="number"
              min="18"
              max="100"
              placeholder="35"
              value={formData.maxAge}
              onChange={(e) => onChange("maxAge", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxDistance">Maximum Distance (km) *</Label>
          <Input
            id="maxDistance"
            type="number"
            min="1"
            max="500"
            placeholder="50"
            value={formData.maxDistance}
            onChange={(e) => onChange("maxDistance", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Show me people within {formData.maxDistance || "50"} km
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">🎉 Almost Done!</h4>
          <p className="text-sm text-muted-foreground">
            You can always update these preferences later in your settings
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button variant="outline" onClick={onSaveAndExit} className="flex-1">
            Save & Exit
          </Button>
          <Button onClick={onComplete} disabled={!canProceed} className="flex-1">
            Complete Setup
          </Button>
        </div>

        {!canProceed && (
          <p className="text-sm text-center text-muted-foreground">
            Please fill in all required fields to complete
          </p>
        )}
      </CardContent>
    </Card>
  );
};
