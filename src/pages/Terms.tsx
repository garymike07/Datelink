import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, FileText, Scale } from "lucide-react";

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 relative overflow-hidden">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-300 dark:bg-pink-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 dark:bg-blue-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container relative mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
                {/* Header with navigation - Glassmorphism */}
                <div className="flex items-center justify-between gap-3 mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="backdrop-blur-md bg-white/30 dark:bg-gray-800/30 border border-white/20 hover:bg-white/40 dark:hover:bg-gray-800/40 shadow-lg"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-white/30 dark:bg-gray-800/30 border border-white/20 shadow-lg">
                        <Scale className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold hidden sm:inline">Legal</span>
                    </div>
                </div>

                {/* Hero Section - Glassmorphism */}
                <div className="mb-8 p-6 sm:p-8 rounded-2xl backdrop-blur-md bg-white/40 dark:bg-gray-800/40 border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg backdrop-blur-sm">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Terms of Service
                            </h1>
                        </div>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
                        Welcome to DateLink. Please read these terms carefully before using our dating platform. 
                        By creating an account, you agree to these terms.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        Last updated: January 16, 2026
                    </p>
                </div>

                {/* Main Content - Glassmorphism Card */}
                <div className="backdrop-blur-md bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                        
                        {/* Section 1 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">1</span>
                                Acceptance of Terms
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
                                By accessing and using DateLink ("the Service", "Platform", "we", "us"), you accept and agree to be bound by these Terms of Service. DateLink is a dating platform designed to help singles in Kenya and globally find meaningful connections. If you do not agree to these terms, please do not use the Service.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">2</span>
                                Age Requirement & Identity
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>You are 18 years of age or older</li>
                                <li>You are legally able to enter into binding contracts</li>
                                <li>You are not prohibited by law from using dating services</li>
                                <li>Your profile information, including photos, accurately represents you</li>
                                <li>You will not create multiple accounts or fake profiles</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">3</span>
                                User Accounts & Profile Requirements
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                You are responsible for maintaining the confidentiality of your account credentials. Your profile must comply with these requirements:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li><strong>Photos:</strong> Must show your face clearly and be recent. No group photos as primary image, no children alone, no nudity or sexually explicit content</li>
                                <li><strong>Information:</strong> Must be truthful and not misleading about your age, marital status, location, or intentions</li>
                                <li><strong>Verification:</strong> Phone verification is required. Optional photo verification earns a verified badge and increases trust</li>
                                <li><strong>Single Account:</strong> One person, one account. Multiple accounts may result in permanent ban</li>
                            </ul>
                        </section>

                        {/* Section 4 - Warning Style */}
                        <section className="backdrop-blur-sm bg-red-50/80 dark:bg-red-950/30 rounded-xl p-4 sm:p-5 border-l-4 border-red-500 shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-600" />
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white text-sm font-bold">4</span>
                                Prohibited Conduct
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                As a dating platform focused on safety and meaningful connections, you agree not to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li><strong>Safety Violations:</strong> Harass, stalk, threaten, or harm another person physically or emotionally</li>
                                <li><strong>Scams & Fraud:</strong> Solicit money, promote businesses, engage in romance scams, or financial fraud</li>
                                <li><strong>Deception:</strong> Use fake photos, impersonate others, catfish, or misrepresent your identity, age, or marital status</li>
                                <li><strong>Inappropriate Content:</strong> Share sexually explicit content without consent, nudity, hate speech, or violent material</li>
                                <li><strong>Spam & Abuse:</strong> Send unsolicited bulk messages, harass users who reject you, or abuse reporting features</li>
                                <li><strong>Platform Abuse:</strong> Scrape data, create bots, reverse engineer our matching algorithm, or manipulate the system</li>
                                <li><strong>Illegal Activity:</strong> Use the Service for prostitution, human trafficking, or any illegal purpose under Kenyan law</li>
                                <li><strong>Minors:</strong> Contact or solicit minors, or share content involving minors</li>
                            </ul>
                            <p className="mt-3 text-sm sm:text-base font-semibold text-red-700 dark:text-red-400">
                                Violations may result in immediate account suspension, permanent ban, and reporting to law enforcement authorities.
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section className="backdrop-blur-sm bg-amber-50/80 dark:bg-amber-950/30 rounded-xl p-4 sm:p-5 border-l-4 border-amber-500 shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white text-sm font-bold">5</span>
                                Premium Subscriptions & Payments
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                DateLink operates on a freemium model with M-Pesa payment integration:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li><strong>Free Access:</strong> Create profile, browse limited matches, send limited likes</li>
                                <li><strong>Premium Tiers:</strong> KES 10/day, KES 100/week, or KES 350/month. Includes unlimited likes, advanced filters, see who liked you, profile unlocks, and ad-free experience</li>
                                <li><strong>Payment Method:</strong> Payments processed via M-Pesa (Safaricom). We do not store your M-Pesa PIN</li>
                                <li><strong>Auto-Renewal:</strong> Subscriptions auto-renew unless cancelled 24 hours before period ends</li>
                                <li><strong>Pricing:</strong> All prices in Kenyan Shillings (KES). Subject to change with 30 days notice</li>
                                <li><strong>Refunds:</strong> No refunds for partial periods. If we ban your account for violations, no refund is provided. Technical issues may qualify for refunds at our discretion</li>
                            </ul>
                        </section>

                        {/* Section 6 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">6</span>
                                Profile Unlocking
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                Premium users can unlock individual profiles to view full photos and details. Once unlocked:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>You have permanent access to that profile's full content</li>
                                <li>The other user is notified you unlocked their profile</li>
                                <li>Profile unlocks are non-refundable</li>
                                <li>If the user deletes their account, unlocked access ends</li>
                            </ul>
                        </section>

                        {/* Section 7 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">7</span>
                                Content Ownership & License
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                You retain ownership of photos and content you post. However, by posting content, you grant us a worldwide, non-exclusive, royalty-free license to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>Display your content to other users as part of the Service</li>
                                <li>Use your content for marketing (with explicit consent, which you can revoke)</li>
                                <li>Process and moderate content for safety</li>
                                <li>Store content on our servers and CDN for performance</li>
                            </ul>
                            <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                You warrant that you have rights to all content you upload and it doesn't infringe third-party rights.
                            </p>
                        </section>

                        {/* Section 8 */}
                        <section className="backdrop-blur-sm bg-green-50/80 dark:bg-green-950/30 rounded-xl p-4 sm:p-5 border-l-4 border-green-500 shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" />
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold">8</span>
                                Safety & Content Moderation
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                We employ automated and human moderation to maintain safety:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>Photos are reviewed before approval (typically within 24 hours)</li>
                                <li>AI scans messages for scams, harassment, and explicit content</li>
                                <li>Users can report and block others instantly</li>
                                <li>We cooperate with law enforcement on safety issues</li>
                                <li>Verified profiles receive priority and better match visibility</li>
                            </ul>
                            <p className="mt-3 text-sm sm:text-base font-semibold text-green-700 dark:text-green-400">
                                Meeting in Person: Always meet in public places, inform friends/family, and follow our Safety Guidelines. We are not responsible for offline interactions.
                            </p>
                        </section>

                        {/* Section 9 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">9</span>
                                Video & Audio Calls
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                All users can initiate video and audio calls. By using calling features:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>Calls are peer-to-peer when possible (not recorded by us)</li>
                                <li>Do not record calls without consent (illegal in Kenya)</li>
                                <li>Inappropriate behavior on calls may result in ban</li>
                                <li>You're responsible for your data charges</li>
                            </ul>
                        </section>

                        {/* Section 10 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">10</span>
                                Account Termination
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                We reserve the right to terminate or suspend your account immediately, without prior notice or refund, for:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>Violation of these Terms</li>
                                <li>Behavior harmful to other users or the community</li>
                                <li>Fraudulent activity or payment disputes</li>
                                <li>Inactivity for over 180 days</li>
                                <li>Legal compliance or government requests</li>
                            </ul>
                            <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                You may delete your account anytime from Settings. Upon deletion, your data is removed per our Privacy Policy, but some information may be retained for legal compliance.
                            </p>
                        </section>

                        {/* Section 11 */}
                        <section className="backdrop-blur-sm bg-orange-50/80 dark:bg-orange-950/30 rounded-xl p-4 sm:p-5 border-l-4 border-orange-500 shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-600 text-white text-sm font-bold">11</span>
                                Limitation of Liability & Disclaimers
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                The Service is provided "as is" without warranties. To the maximum extent permitted by Kenyan law:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>We do not verify all user information beyond phone numbers</li>
                                <li>We are not responsible for user conduct, online or offline</li>
                                <li>We do not guarantee matches, dates, or relationships</li>
                                <li>We are not liable for damages from scams, harassment, or catfishing by users</li>
                                <li>Service interruptions, data loss, or technical issues may occur</li>
                                <li>M-Pesa payment processing is handled by Safaricom; we're not liable for their service issues</li>
                            </ul>
                            <p className="mt-3 text-sm sm:text-base font-semibold text-orange-700 dark:text-orange-400">
                                You use DateLink at your own risk. Always practice caution when meeting people online.
                            </p>
                        </section>

                        {/* Section 12 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <Scale className="w-5 h-5 text-primary" />
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">12</span>
                                Governing Law & Dispute Resolution
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                These Terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved through:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li><strong>First:</strong> Good faith negotiation between parties</li>
                                <li><strong>Second:</strong> Mediation in Nairobi, Kenya</li>
                                <li><strong>Final:</strong> Arbitration in Nairobi per Kenyan Arbitration Act, or courts of Kenya</li>
                            </ul>
                        </section>

                        {/* Section 13 */}
                        <section className="backdrop-blur-sm bg-primary/5 dark:bg-primary/10 rounded-xl p-4 sm:p-5 border-l-4 border-primary shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">13</span>
                                Changes to Terms
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                We reserve the right to modify these Terms at any time. Material changes will be notified via:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li>Email to your registered address</li>
                                <li>In-app notification</li>
                                <li>Banner on the website</li>
                            </ul>
                            <p className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                Continued use after changes constitutes acceptance. If you disagree, please delete your account.
                            </p>
                        </section>

                        {/* Section 14 */}
                        <section className="backdrop-blur-sm bg-blue-50/80 dark:bg-blue-950/30 rounded-xl p-4 sm:p-5 border-l-4 border-blue-500 shadow-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">14</span>
                                Contact Us
                            </h2>
                            <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                                For questions about these Terms, safety concerns, or legal inquiries:
                            </p>
                            <ul className="list-none pl-0 space-y-1 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                                <li><strong>Email:</strong> support@datelink.com</li>
                                <li><strong>Legal/Safety:</strong> legal@datelink.com</li>
                                <li><strong>Reports:</strong> Use the in-app Report feature for fastest response</li>
                            </ul>
                        </section>
                    </div>
                </div>

                {/* Footer spacing */}
                <div className="h-12"></div>
            </div>
        </div>
    );
};

export default Terms;
