import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Heart, Upload, User, Target } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ReviewStatus } from "@/components/profile/ReviewStatus";
import { useAuth } from "@/contexts/AuthContext";

const ProfileSetup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        age: "",
        gender: "",
        location: "",
        bio: "",
        jobTitle: "",
        education: "",
        minAge: "",
        maxAge: "",
        maxDistance: "50",
        genderPreference: [] as string[],
    });
    const [photos, setPhotos] = useState<string[]>([]);

    const { user } = useAuth();
    const userId = user?._id as string | undefined;

    const createProfile = useMutation(api.profiles.createProfile);
    const updateProfile = useMutation(api.profiles.updateProfile);
    const uploadPhoto = useMutation(api.profiles.uploadPhoto);
    const updatePreferences = useMutation(api.profiles.updatePreferences);

    const progress = (step / 4) * 100;

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setPhotos((prev) => [...prev, base64]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async () => {
        try {
            // User is already available from useAuth hook
            const userId = user._id;

            if (!userId) {
                toast.error("User not found. Please log in again.");
                navigate("/login");
                return;
            }

            // Create profile
            const profileId = await createProfile({
                userId,
                age: parseInt(formData.age),
                gender: formData.gender,
                location: formData.location,
                bio: formData.bio || undefined,
            });

            // Upload photos
            for (let i = 0; i < photos.length; i++) {
                await uploadPhoto({
                    userId,
                    url: photos[i],
                    order: i,
                });
            }

            // Update additional profile info
            if (formData.jobTitle || formData.education) {
                await updateProfile({
                    userId,
                    jobTitle: formData.jobTitle || undefined,
                    education: formData.education || undefined,
                });
            }

            // Update preferences
            await updatePreferences({
                userId,
                minAge: parseInt(formData.minAge) || undefined,
                maxAge: parseInt(formData.maxAge) || undefined,
                maxDistance: parseInt(formData.maxDistance) || undefined,
                genderPreference: formData.genderPreference.length > 0 ? formData.genderPreference : undefined,
            });

            toast.success("Profile created successfully!");
            navigate("/discover");
        } catch (error: any) {
            toast.error(error.message || "Failed to create profile");
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.age && formData.gender && formData.location;
            case 2:
                return photos.length > 0;
            case 3:
                return true; // Optional step
            case 4:
                return formData.minAge && formData.maxAge && formData.genderPreference.length > 0;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-2 sm:p-3 md:p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center justify-center mb-4">
                        <Heart className="w-12 h-12 text-primary fill-primary" />
                    </div>
                    <CardTitle className="text-center text-2xl">Complete Your Profile</CardTitle>
                    <CardDescription className="text-center">
                        Step {step} of 4 - {["Basic Info", "Photos", "About You", "Preferences"][step - 1]}
                    </CardDescription>
                    <Progress value={progress} className="mt-4" />
                </CardHeader>

                <CardContent className="space-y-6">
                    {userId && <ReviewStatus userId={userId} />}
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Tell us about yourself</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="age">Age *</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    min="18"
                                    max="100"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    placeholder="25"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                                    <SelectTrigger>
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
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Your City, Country"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Photos */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Upload className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Add your photos</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {photos.map((photo, index) => (
                                    <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-border">
                                        <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                {photos.length < 6 && (
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                        <div className="text-center">
                                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                            <span className="text-sm text-muted-foreground">Add Photo</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handlePhotoUpload}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Add at least 1 photo (up to 6)</p>
                        </div>
                    )}

                    {/* Step 3: About You */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">About You (Optional)</h3>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jobTitle">Job Title</Label>
                                <Input
                                    id="jobTitle"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    placeholder="Software Engineer"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="education">Education</Label>
                                <Input
                                    id="education"
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    placeholder="Your University"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Preferences */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">Who are you looking for?</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minAge">Min Age *</Label>
                                    <Input
                                        id="minAge"
                                        type="number"
                                        min="18"
                                        max="100"
                                        value={formData.minAge}
                                        onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                                        placeholder="22"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxAge">Max Age *</Label>
                                    <Input
                                        id="maxAge"
                                        type="number"
                                        min="18"
                                        max="100"
                                        value={formData.maxAge}
                                        onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                                        placeholder="35"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxDistance">Max Distance (km)</Label>
                                <Input
                                    id="maxDistance"
                                    type="number"
                                    min="5"
                                    max="500"
                                    value={formData.maxDistance}
                                    onChange={(e) => setFormData({ ...formData, maxDistance: e.target.value })}
                                    placeholder="50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Interested in *</Label>
                                <div className="flex flex-wrap gap-2">
                                    {["man", "woman", "non-binary"].map((gender) => (
                                        <Button
                                            key={gender}
                                            type="button"
                                            variant={formData.genderPreference.includes(gender) ? "default" : "outline"}
                                            onClick={() => {
                                                const current = formData.genderPreference;
                                                if (current.includes(gender)) {
                                                    setFormData({ ...formData, genderPreference: current.filter((g) => g !== gender) });
                                                } else {
                                                    setFormData({ ...formData, genderPreference: [...current, gender] });
                                                }
                                            }}
                                        >
                                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6">
                        <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                            Back
                        </Button>
                        <Button onClick={handleNext} disabled={!canProceed()}>
                            {step === 4 ? "Complete Profile" : "Next"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSetup;
