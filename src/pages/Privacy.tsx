import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Scale } from "lucide-react";

const Privacy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
                {/* Header with navigation */}
                <div className="flex items-center justify-between gap-3 mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="hover:bg-primary/10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2 text-primary">
                        <Lock className="w-5 h-5" />
                        <span className="text-sm font-semibold hidden sm:inline">Privacy</span>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">Privacy Policy</h1>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-3xl">
                        Your privacy and safety are our top priorities. This policy explains how we collect, use, and protect your 
                        personal information on DateLink.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                        <span>Last updated: January 16, 2026</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                            <Shield className="w-3 h-3" />
                            Kenya Data Protection Act Compliant
                        </span>
                    </p>
                </div>

                {/* Main Content Card */}
                <Card className="p-6 sm:p-8 shadow-xl border-primary/10">
                    <div className="prose prose-sm sm:prose-base max-w-none space-y-8">
                        <section>
                            <p className="mb-4">
                                At DateLink, your privacy and safety are our top priorities. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our dating platform. By using DateLink, you consent to the practices described in this policy.
                            </p>
                            <p className="text-sm italic">
                                We comply with the Kenya Data Protection Act, 2019 and are committed to transparent data handling practices.
                            </p>
                        </section>

                        <section className="bg-blue-50/50 dark:bg-blue-950/10 rounded-lg p-5 border-l-4 border-blue-500">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                                <span className="text-blue-600">1.</span> Information We Collect
                            </h2>
                            <p>We collect several types of information to provide and improve our dating service:</p>
                            
                            <h3 className="text-lg font-semibold mb-2 mt-4">A. Information You Provide Directly</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, gender, sexual orientation</li>
                                <li><strong>Profile Information:</strong> Photos (1-9 images), bio, job title, education, interests, relationship goals, lifestyle preferences (drinking, smoking, religion, etc.)</li>
                                <li><strong>Verification Data:</strong> Phone number for SMS verification, optional government ID or selfie for photo verification</li>
                                <li><strong>Preferences:</strong> Age range, distance radius, gender preferences, deal-breakers, saved searches</li>
                                <li><strong>Communication:</strong> Messages, voice notes, reactions, icebreakers, call history (metadata only, not content)</li>
                                <li><strong>Payment Information:</strong> M-Pesa phone number and transaction IDs (we do not store your M-Pesa PIN)</li>
                                <li><strong>Support Requests:</strong> When you contact us for help or report users</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">B. Information Collected Automatically</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Location Data:</strong> Approximate location from GPS/IP address to show distance to matches and local profiles</li>
                                <li><strong>Device Information:</strong> Device type, OS version, browser type, mobile carrier, IP address, unique device identifiers</li>
                                <li><strong>Usage Data:</strong> Features used, time spent, profiles viewed, swipes, likes, matches, login times, push notification interactions</li>
                                <li><strong>Performance Data:</strong> App crashes, load times, errors to improve service quality</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">C. Information from Third Parties</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Safaricom M-Pesa:</strong> Payment confirmation and transaction status</li>
                                <li><strong>Social Login (if used):</strong> Basic profile info if you sign in with Google/Facebook</li>
                                <li><strong>Analytics Providers:</strong> Aggregated usage trends (anonymized)</li>
                            </ul>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-5 border-l-4 border-primary">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-primary">2.</span> How We Use Your Information
                            </h2>
                            <p>We use your data to provide a safe, personalized dating experience:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Matchmaking:</strong> Show you compatible profiles based on location, preferences, interests, and compatibility algorithm</li>
                                <li><strong>Communication:</strong> Enable messaging, video/audio calls, and in-app notifications between matched users</li>
                                <li><strong>Safety & Moderation:</strong> Review photos, detect scams/harassment with AI, investigate reports, ban violators</li>
                                <li><strong>Verification:</strong> Confirm your phone number and identity (if you opt in) to build trust</li>
                                <li><strong>Personalization:</strong> Recommend profiles, customize your feed, remember preferences</li>
                                <li><strong>Payments:</strong> Process M-Pesa transactions, manage subscriptions, handle refunds, detect fraud</li>
                                <li><strong>Notifications:</strong> Send push notifications for matches, messages, likes, and important updates (you control these in Settings)</li>
                                <li><strong>Analytics:</strong> Understand usage patterns to improve features and fix bugs</li>
                                <li><strong>Marketing:</strong> Send promotional emails about new features or offers (you can opt out)</li>
                                <li><strong>Legal Compliance:</strong> Respond to legal requests, enforce Terms, prevent illegal activity</li>
                            </ul>
                        </section>

                        <section className="bg-orange-50/50 dark:bg-orange-950/10 rounded-lg p-5 border-l-4 border-orange-500">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <Shield className="w-5 h-5 text-orange-600" />
                                <span className="text-orange-600">3.</span> How We Share Your Information
                            </h2>
                            <p className="font-semibold mb-3">
                                We do NOT sell your personal information to third parties. Period.
                            </p>
                            <p>We share your information only in these situations:</p>
                            
                            <h3 className="text-lg font-semibold mb-2 mt-4">A. With Other Users (By Design)</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Profile Visibility:</strong> Your photos, bio, interests, and profile details are shown to users who match your criteria (and vice versa)</li>
                                <li><strong>Unlocked Profiles:</strong> Premium users who unlock your profile see full photos and details. You're notified when this happens</li>
                                <li><strong>Messages & Calls:</strong> Content you send is delivered to recipients</li>
                                <li><strong>Online Status:</strong> Other users see when you're active (you can hide this)</li>
                                <li><strong>Verification Badge:</strong> Users see if you're verified</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">B. With Service Providers</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Convex (Backend):</strong> Hosts our database and backend logic</li>
                                <li><strong>Safaricom M-Pesa:</strong> Processes payments (they have their own privacy policy)</li>
                                <li><strong>Cloud Storage:</strong> Stores photos on secure CDN</li>
                                <li><strong>SMS Provider:</strong> Sends verification codes</li>
                                <li><strong>Push Notification Service:</strong> Delivers notifications to your device</li>
                                <li><strong>Analytics Tools:</strong> Aggregated usage insights (anonymized where possible)</li>
                            </ul>
                            <p className="mt-2 text-sm italic">
                                All service providers are contractually required to protect your data and use it only for DateLink services.
                            </p>

                            <h3 className="text-lg font-semibold mb-2 mt-4">C. For Legal & Safety Reasons</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To comply with Kenyan laws, court orders, or government requests</li>
                                <li>To investigate fraud, scams, harassment, or Terms violations</li>
                                <li>To protect users' safety (e.g., credible threats, illegal activity)</li>
                                <li>To cooperate with law enforcement on criminal investigations</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">D. Business Transfers</h3>
                            <p>
                                If DateLink is acquired or merges with another company, your data may be transferred to the new entity (you'll be notified).
                            </p>
                        </section>

                        <section className="bg-green-50/50 dark:bg-green-950/10 rounded-lg p-5 border-l-4 border-green-500">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <Lock className="w-5 h-5 text-green-600" />
                                <span className="text-green-600">4.</span> Data Security
                            </h2>
                            <p>
                                We implement industry-standard security measures to protect your information:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Encryption:</strong> Data in transit uses HTTPS/TLS. Sensitive data at rest is encrypted</li>
                                <li><strong>Access Controls:</strong> Only authorized personnel can access personal data</li>
                                <li><strong>Photo Moderation:</strong> All photos reviewed before going live</li>
                                <li><strong>Secure Payments:</strong> M-Pesa integration with tokenization (we never see your PIN)</li>
                                <li><strong>Regular Audits:</strong> Security reviews and vulnerability testing</li>
                                <li><strong>Breach Response:</strong> In case of data breach, we'll notify you and authorities per Kenyan law</li>
                            </ul>
                            <p className="mt-3 text-sm italic">
                                However, no system is 100% secure. Use strong passwords, enable two-factor authentication, and report suspicious activity immediately.
                            </p>
                        </section>

                        <section className="bg-amber-50/50 dark:bg-amber-950/10 rounded-lg p-5 border-l-4 border-amber-500">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <Scale className="w-5 h-5 text-amber-600" />
                                <span className="text-amber-600">5.</span> Your Privacy Rights (Kenya Data Protection Act)
                            </h2>
                            <p>Under Kenyan law, you have the following rights:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Access:</strong> Request a copy of your personal data (free once per year)</li>
                                <li><strong>Correction:</strong> Update inaccurate or outdated information in Settings</li>
                                <li><strong>Deletion:</strong> Delete your account and request data erasure (some data retained for legal compliance)</li>
                                <li><strong>Portability:</strong> Export your data in machine-readable format (JSON)</li>
                                <li><strong>Objection:</strong> Object to certain data processing (e.g., marketing emails)</li>
                                <li><strong>Restriction:</strong> Request we limit processing in specific situations</li>
                                <li><strong>Withdraw Consent:</strong> Opt out of optional features like location tracking or marketing</li>
                                <li><strong>Lodge Complaint:</strong> File complaint with Kenya's Office of the Data Protection Commissioner</li>
                            </ul>
                            <p className="mt-3">
                                To exercise your rights, go to <strong>Settings → Account Management → Data & Privacy</strong> or email privacy@datelink.com
                            </p>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-5 border-l-4 border-primary">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-primary">6.</span> Location Data & Privacy
                            </h2>
                            <p>
                                Location is essential for dating apps. Here's how we handle it:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>What We Collect:</strong> Approximate location (city-level) from GPS or IP address</li>
                                <li><strong>Why:</strong> To show you nearby matches and display distance to other users</li>
                                <li><strong>Precision:</strong> We show approximate distance (e.g., "5 km away"), not exact GPS coordinates</li>
                                <li><strong>Control:</strong> You can disable location in device settings or use "Passport Mode" (Premium) to browse other cities</li>
                                <li><strong>Retention:</strong> Location history is not stored long-term, only current location for matching</li>
                            </ul>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-5 border-l-4 border-primary">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-primary">7.</span> Cookies & Tracking Technologies
                            </h2>
                            <p>
                                We use cookies and similar technologies to improve your experience:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Essential Cookies:</strong> Keep you logged in, remember settings</li>
                                <li><strong>Analytics Cookies:</strong> Understand usage patterns and improve features</li>
                                <li><strong>Advertising Cookies:</strong> Show relevant ads (if you see ads as a free user)</li>
                            </ul>
                            <p className="mt-3">
                                You can control cookies in your browser settings. Disabling cookies may limit functionality. See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for details.
                            </p>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-5 border-l-4 border-primary">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-primary">8.</span> Data Retention
                            </h2>
                            <p>
                                We retain your data for different periods based on type and purpose:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Active Accounts:</strong> Data kept as long as your account is active</li>
                                <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days. Some data retained for:</li>
                                <ul className="list-circle pl-8 space-y-1 mt-2">
                                    <li>Legal compliance (e.g., payment records for 7 years per tax law)</li>
                                    <li>Safety investigations (e.g., banned users' info to prevent re-registration)</li>
                                    <li>Backup systems (purged within 90 days)</li>
                                </ul>
                                <li><strong>Messages:</strong> Deleted when you delete them (but recipient still has their copy)</li>
                                <li><strong>Photos:</strong> Removed from profile when deleted, but may remain in backups temporarily</li>
                                <li><strong>Analytics:</strong> Aggregated anonymized data retained indefinitely for product improvement</li>
                            </ul>
                        </section>

                        <section className="bg-red-50/50 dark:bg-red-950/10 rounded-lg p-5 border-l-4 border-red-500">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-600" />
                                <span className="text-red-600">9.</span> Children's Privacy
                            </h2>
                            <p>
                                DateLink is strictly for users <strong>18 years and older</strong>. We do not knowingly collect data from minors. If we discover a user is under 18, we immediately delete their account and data. If you believe a minor is using our service, report it immediately via safety@datelink.com
                            </p>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-5 border-l-4 border-primary">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-primary">10.</span> International Data Transfers
                            </h2>
                            <p>
                                Your data is primarily stored on servers within or with providers compliant with Kenyan data protection standards. If data is transferred outside Kenya (e.g., to cloud providers), we ensure:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Adequate data protection safeguards per Kenya Data Protection Act</li>
                                <li>Contracts with providers requiring equivalent protection</li>
                                <li>Compliance with cross-border data transfer regulations</li>
                            </ul>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-5 border-l-4 border-primary">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-primary">11.</span> Push Notifications
                            </h2>
                            <p>
                                We send push notifications for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>New matches and likes</li>
                                <li>Messages from connections</li>
                                <li>Profile views and unlocks</li>
                                <li>Video/audio call requests</li>
                                <li>Safety alerts and account security</li>
                                <li>Subscription reminders</li>
                            </ul>
                            <p className="mt-3">
                                You control notification preferences in <strong>Settings → Notifications</strong>. You can disable them anytime without affecting core app functionality.
                            </p>
                        </section>

                        <section className="bg-primary/5 rounded-lg p-5 border-l-4 border-primary">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-primary">12.</span> Changes to This Privacy Policy
                            </h2>
                            <p>
                                We may update this Privacy Policy to reflect new features, legal requirements, or business practices. Material changes will be notified via:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Email to your registered address</li>
                                <li>In-app notification</li>
                                <li>Banner on the website</li>
                                <li>Updated "Last Updated" date at the top</li>
                            </ul>
                            <p className="mt-3">
                                Continued use after changes means you accept the new policy. If you disagree, please delete your account before changes take effect.
                            </p>
                        </section>

                        <section className="bg-blue-50/50 dark:bg-blue-950/10 rounded-lg p-5 border-l-4 border-blue-500">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
                                <span className="text-blue-600">13.</span> Contact Us & Data Protection Officer
                            </h2>
                            <p>
                                For privacy questions, data requests, or concerns:
                            </p>
                            <ul className="list-none pl-0 space-y-1 mt-2">
                                <li><strong>General Privacy:</strong> privacy@datelink.com</li>
                                <li><strong>Data Rights Requests:</strong> dataprotection@datelink.com</li>
                                <li><strong>Safety Concerns:</strong> safety@datelink.com</li>
                                <li><strong>In-App:</strong> Settings → Help & Support → Privacy & Data</li>
                            </ul>
                            <p className="mt-3 text-sm">
                                <strong>Kenya Data Protection Office:</strong> If you're not satisfied with our response, you can file a complaint with the Office of the Data Protection Commissioner: <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.odpc.go.ke</a>
                            </p>
                        </section>

                        <section className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800 mt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-6 h-6 text-green-600" />
                                <h3 className="text-lg font-semibold text-foreground">Your Privacy Matters</h3>
                            </div>
                            <p className="text-sm">
                                At DateLink, we're committed to transparency and putting you in control of your data. We believe privacy and great user experience go hand-in-hand. If you ever have questions or concerns, we're here to help.
                            </p>
                        </section>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Privacy;
