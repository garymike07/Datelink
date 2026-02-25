import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface Step1Props {
  formData: {
    age: string;
    gender: string;
    location: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onSaveAndExit: () => void;
}

export const Step1BasicInfo = ({ formData, onChange, onNext, onSaveAndExit }: Step1Props) => {
  const canProceed = formData.age && formData.gender && formData.location;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <CardTitle>Basic Information</CardTitle>
        </div>
        <CardDescription>Tell us a bit about yourself</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="100"
            placeholder="25"
            value={formData.age}
            onChange={(e) => onChange("age", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">You must be 18 or older</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select value={formData.gender} onValueChange={(value) => onChange("gender", value)}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="man">Man</SelectItem>
              <SelectItem value="woman">Woman</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            placeholder="e.g., Nairobi, Kenya"
            value={formData.location}
            onChange={(e) => onChange("location", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This helps us show you people nearby
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSaveAndExit} className="flex-1">
            Save & Continue Later
          </Button>
          <Button onClick={onNext} disabled={!canProceed} className="flex-1">
            Next: Photos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
