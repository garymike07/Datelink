import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface PromptSelectorProps {
    userId: Id<"users">;
    onUpdate?: () => void;
}

const PromptSelector = ({ userId, onUpdate }: PromptSelectorProps) => {
    const [selectedPrompts, setSelectedPrompts] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showPromptLibrary, setShowPromptLibrary] = useState(false);

    const prompts = useQuery(api.prompts.getActivePrompts);
    const userAnswers = useQuery(api.prompts.getUserPromptAnswers, { userId });
    const addAnswer = useMutation(api.prompts.addPromptAnswer);
    const updateAnswer = useMutation(api.prompts.updatePromptAnswer);
    const deleteAnswer = useMutation(api.prompts.deletePromptAnswer);

    useEffect(() => {
        if (userAnswers) {
            const selected = userAnswers.map((a) => ({
                _id: a.promptId,
                text: a.promptText,
                category: a.promptCategory,
                answerId: a._id,
            }));
            setSelectedPrompts(selected);

            const answerMap: Record<string, string> = {};
            userAnswers.forEach((a) => {
                answerMap[a.promptId] = a.answer;
            });
            setAnswers(answerMap);
        }
    }, [userAnswers]);

    const handleSelectPrompt = (prompt: any) => {
        if (selectedPrompts.length >= 5) {
            toast.error("You can select up to 5 prompts");
            return;
        }

        if (selectedPrompts.find((p) => p._id === prompt._id)) {
            toast.error("You've already selected this prompt");
            return;
        }

        setSelectedPrompts([...selectedPrompts, prompt]);
        setShowPromptLibrary(false);
    };

    const handleRemovePrompt = async (prompt: any) => {
        if (prompt.answerId) {
            try {
                await deleteAnswer({ answerId: prompt.answerId, userId });
                toast.success("Prompt removed");
            } catch (error) {
                toast.error("Failed to remove prompt");
            }
        }
        setSelectedPrompts(selectedPrompts.filter((p) => p._id !== prompt._id));
        const newAnswers = { ...answers };
        delete newAnswers[prompt._id];
        setAnswers(newAnswers);
    };

    const handleSaveAnswer = async (promptId: string) => {
        const answer = answers[promptId];
        if (!answer || answer.trim().length === 0) {
            toast.error("Please write an answer");
            return;
        }

        if (answer.length > 300) {
            toast.error("Answer must be 300 characters or less");
            return;
        }

        try {
            const prompt = selectedPrompts.find((p) => p._id === promptId);
            const order = selectedPrompts.indexOf(prompt);

            await addAnswer({
                userId,
                promptId: promptId as Id<"prompts">,
                answer,
                order,
            });

            toast.success("Answer saved!");
            onUpdate?.();
        } catch (error: any) {
            toast.error(error.message || "Failed to save answer");
        }
    };

    const promptsByCategory = prompts?.reduce((acc: any, prompt: any) => {
        if (!acc[prompt.category]) {
            acc[prompt.category] = [];
        }
        acc[prompt.category].push(prompt);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Profile Prompts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Answer 3-5 prompts to help others get to know you better
                </p>
            </div>

            {/* Selected Prompts */}
            <div className="space-y-4">
                {selectedPrompts.map((prompt, index) => (
                    <Card key={prompt._id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <Badge variant="secondary" className="mb-2">
                                    {prompt.category}
                                </Badge>
                                <h4 className="font-medium">{prompt.text}</h4>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePrompt(prompt)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <Textarea
                            placeholder="Your answer..."
                            value={answers[prompt._id] || ""}
                            onChange={(e) =>
                                setAnswers({ ...answers, [prompt._id]: e.target.value })
                            }
                            onBlur={() => handleSaveAnswer(prompt._id)}
                            maxLength={300}
                            className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {(answers[prompt._id] || "").length}/300
                        </p>
                    </Card>
                ))}
            </div>

            {/* Add Prompt Button */}
            {selectedPrompts.length < 5 && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPromptLibrary(!showPromptLibrary)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Prompt
                </Button>
            )}

            {/* Prompt Library */}
            {showPromptLibrary && (
                <Card className="p-4">
                    <h4 className="font-semibold mb-4">Choose a Prompt</h4>
                    <div className="space-y-4">
                        {promptsByCategory &&
                            Object.entries(promptsByCategory).map(([category, categoryPrompts]: [string, any]) => (
                                <div key={category}>
                                    <h5 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                                        {category}
                                    </h5>
                                    <div className="space-y-2">
                                        {categoryPrompts.map((prompt: any) => (
                                            <Button
                                                key={prompt._id}
                                                variant="ghost"
                                                className="w-full justify-start text-left h-auto py-3"
                                                onClick={() => handleSelectPrompt(prompt)}
                                                disabled={selectedPrompts.find((p) => p._id === prompt._id)}
                                            >
                                                {prompt.text}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>
            )}

            {selectedPrompts.length < 3 && (
                <p className="text-sm text-amber-600">
                    ⚠️ Add at least 3 prompts to increase your profile completeness
                </p>
            )}
        </div>
    );
};

export default PromptSelector;
