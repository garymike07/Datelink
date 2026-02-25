import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Shield, Users } from "lucide-react";

const Guidelines = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-2 sm:px-3 md:px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <Card className="p-8">
                    <h1 className="text-3xl font-bold mb-6">Community Guidelines</h1>
                    <p className="text-muted-foreground mb-8">
                        DateLink is built on respect, kindness, and authenticity. These guidelines help create a safe and welcoming community for everyone.
                    </p>

                    <div className="space-y-8">
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Heart className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-semibold">Be Respectful</h2>
                            </div>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Treat others with kindness and respect</li>
                                <li>Accept rejection gracefully</li>
                                <li>Respect people's boundaries and preferences</li>
                                <li>Use appropriate language in messages</li>
                                <li>Don't make assumptions based on appearance or background</li>
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-semibold">Be Authentic</h2>
                            </div>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Use real, recent photos of yourself</li>
                                <li>Be honest about your age, location, and intentions</li>
                                <li>Don't impersonate others or create fake profiles</li>
                                <li>Represent yourself accurately in your bio and prompts</li>
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-6 h-6 text-primary" />
                                <h2 className="text-2xl font-semibold">Be Safe</h2>
                            </div>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Don't share personal information too quickly (phone number, address, financial details)</li>
                                <li>Meet in public places for first dates</li>
                                <li>Tell a friend or family member about your plans</li>
                                <li>Trust your instincts - if something feels off, it probably is</li>
                                <li>Report suspicious behavior immediately</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Prohibited Content & Behavior</h2>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <p className="font-medium mb-2">The following are strictly prohibited:</p>
                                <ul className="list-disc pl-6 space-y-2 text-sm">
                                    <li>Harassment, bullying, or threatening behavior</li>
                                    <li>Hate speech or discrimination</li>
                                    <li>Sexually explicit content or solicitation</li>
                                    <li>Spam or commercial solicitation</li>
                                    <li>Scams or fraudulent activity</li>
                                    <li>Sharing others' private information</li>
                                    <li>Violence or self-harm content</li>
                                    <li>Illegal activities</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Photo Guidelines</h2>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Photos must clearly show your face</li>
                                <li>No group photos as your primary photo</li>
                                <li>No children in photos (even if they're yours)</li>
                                <li>No nudity or sexually suggestive content</li>
                                <li>No photos with weapons or illegal substances</li>
                                <li>No copyrighted images or celebrity photos</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">Reporting & Enforcement</h2>
                            <p className="text-muted-foreground mb-3">
                                If you encounter behavior that violates these guidelines:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>Use the Report button on profiles or messages</li>
                                <li>Block users who make you uncomfortable</li>
                                <li>Contact our support team for serious issues</li>
                            </ul>
                            <p className="mt-4 text-muted-foreground">
                                Violations may result in warnings, temporary suspension, or permanent ban from the platform.
                            </p>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-6 mt-8">
                            <p className="text-center font-medium">
                                Together, we can build a community where everyone feels safe, respected, and valued. Thank you for being part of DateLink.
                            </p>
                        </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Guidelines;
