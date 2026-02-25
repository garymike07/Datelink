import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Step1BasicInfo } from "@/components/onboarding/Step1BasicInfo";
import { Step2Photos } from "@/components/onboarding/Step2Photos";
import { Step3AboutYou } from "@/components/onboarding/Step3AboutYou";
import { Step4Goals } from "@/components/onboarding/Step4Goals";
import { Step5Preferences } from "@/components/onboarding/Step5Preferences";

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id;

  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    location: "",
    bio: "",
    jobTitle: "",
    education: "",
    relationshipGoal: "",
    minAge: "",
    maxAge: "",
    maxDistance: "50",
    genderPreference: [] as string[],
  });
  const [photos, setPhotos] = useState<string[]>([]);

  // Mutations
  const updateProgress = useMutation(api.onboarding.updateProgress);
  const completeStep = useMutation(api.onboarding.completeStep);
  const skipStep = useMutation(api.onboarding.skipStep);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);
  const createProfile = useMutation(api.profiles.createProfile);
  const uploadPhoto = useMutation(api.profiles.uploadPhoto);
  const updatePreferences = useMutation(api.profiles.updatePreferences);
  const activateFreeTrial = useMutation(api.freeTrial.activateFreeTrial);

  // Query existing progress
  const existingProgress = useQuery(
    api.onboarding.getProgress,
    userId ? { userId } : "skip"
  );

  // Load existing progress or initialize it
  useEffect(() => {
    const initializeProgress = async () => {
      if (!userId) return;

      if (existingProgress) {
        setCurrentStep(existingProgress.currentStep);
        setCompletedSteps(existingProgress.completedSteps);
        setShowWelcome(false);
      } else if (userId && existingProgress === null) {
        // No progress exists, create initial progress record
        try {
          await updateProgress({
            userId,
            currentStep: 1,
            completedSteps: [],
          });
        } catch (error) {
          console.error("Error initializing onboarding progress:", error);
        }
      }
    };

    initializeProgress();
  }, [existingProgress, userId, updateProgress]);

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async (stepNumber: number) => {
    if (!userId) return;

    try {
      // Update completed steps state first
      const newCompletedSteps = [...completedSteps, stepNumber];
      setCompletedSteps(newCompletedSteps);

      // Move to next step
      const nextStep = stepNumber + 1;
      setCurrentStep(nextStep);

      // Mark current step as completed and update progress in one call
      await completeStep({ userId, stepNumber });
      
      // Update progress to move to next step
      await updateProgress({
        userId,
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
      });
    } catch (error) {
      console.error("Error progressing to next step:", error);
      toast.error("Failed to save progress");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSkip = async (stepNumber: number) => {
    if (!userId) return;

    try {
      await skipStep({ userId, stepNumber });
      const nextStep = stepNumber + 1;
      setCurrentStep(nextStep);
      await updateProgress({
        userId,
        currentStep: nextStep,
        skippedSteps: [stepNumber],
      });
      toast.info("Step skipped");
    } catch (error) {
      console.error("Error skipping step:", error);
      toast.error("Failed to skip step");
    }
  };

  const handleSaveAndExit = async () => {
    if (!userId) return;

    try {
      await updateProgress({
        userId,
        currentStep,
        completedSteps,
      });
      toast.success("Progress saved! You can continue anytime.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    }
  };

  const handleComplete = async () => {
    if (!userId) return;

    try {
      // Create profile
      const profileId = await createProfile({
        userId,
        age: parseInt(formData.age),
        gender: formData.gender,
        location: formData.location,
        bio: formData.bio || undefined,
        jobTitle: formData.jobTitle || undefined,
        education: formData.education || undefined,
        relationshipGoal: formData.relationshipGoal || undefined,
      });

      // Upload photos
      for (let i = 0; i < photos.length; i++) {
        await uploadPhoto({
          userId,
          url: photos[i],
          order: i,
        });
      }

      // Set preferences
      await updatePreferences({
        userId,
        minAge: parseInt(formData.minAge),
        maxAge: parseInt(formData.maxAge),
        maxDistance: parseInt(formData.maxDistance),
        genderPreference: formData.genderPreference,
      });

      // Complete onboarding
      await completeOnboarding({ userId });

      // Activate free trial
      try {
        const trialResult = await activateFreeTrial({ userId });
        toast.success("Profile created successfully! 🎉", {
          description: trialResult.message,
        });
      } catch (error: any) {
        // If trial already used, just show success
        toast.success("Profile created successfully! 🎉");
      }

      navigate("/discover");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup");
    }
  };

  if (showWelcome) {
    return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <StepIndicator currentStep={currentStep} totalSteps={5} completedSteps={completedSteps} />

      <div className="max-w-4xl mx-auto mt-8">
        {currentStep === 1 && (
          <Step1BasicInfo
            formData={{
              age: formData.age,
              gender: formData.gender,
              location: formData.location,
            }}
            onChange={handleChange}
            onNext={() => handleNext(1)}
            onSaveAndExit={handleSaveAndExit}
          />
        )}

        {currentStep === 2 && (
          <Step2Photos
            photos={photos}
            onPhotosChange={setPhotos}
            onNext={() => handleNext(2)}
            onBack={handleBack}
            onSaveAndExit={handleSaveAndExit}
          />
        )}

        {currentStep === 3 && (
          <Step3AboutYou
            formData={{
              bio: formData.bio,
              jobTitle: formData.jobTitle,
              education: formData.education,
            }}
            onChange={handleChange}
            onNext={() => handleNext(3)}
            onBack={handleBack}
            onSkip={() => handleSkip(3)}
            onSaveAndExit={handleSaveAndExit}
          />
        )}

        {currentStep === 4 && (
          <Step4Goals
            formData={{
              relationshipGoal: formData.relationshipGoal,
            }}
            onChange={handleChange}
            onNext={() => handleNext(4)}
            onBack={handleBack}
            onSkip={() => handleSkip(4)}
            onSaveAndExit={handleSaveAndExit}
          />
        )}

        {currentStep === 5 && (
          <Step5Preferences
            formData={{
              minAge: formData.minAge,
              maxAge: formData.maxAge,
              maxDistance: formData.maxDistance,
              genderPreference: formData.genderPreference,
            }}
            onChange={handleChange}
            onComplete={handleComplete}
            onBack={handleBack}
            onSaveAndExit={handleSaveAndExit}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
