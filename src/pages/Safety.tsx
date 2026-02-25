import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Eye, Lock, Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Safety = () => {
    const navigate = useNavigate();

    const { user } = useAuth();
    const userId = user?._id as string | undefined;

    const blockedUsers = useQuery(api.safety.getBlockedUsers, userId ? { userId: userId as any } : "skip");
    const myReports = useQuery(api.safety.getMyReports, userId ? { userId: userId as any } : "skip");
    const unblockUser = useMutation(api.safety.unblockUser);

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8 max-w-3xl">
                <div className="mb-8 text-center">
                    <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
                    <p className="text-sm text-emerald-600 font-semibold">DateLink Safety Tips</p>
                    <h1 className="text-3xl font-bold mb-2">Safety Center</h1>
                    <p className="text-muted-foreground">
                        Your safety is our top priority. Learn how to stay safe while using DateLink.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Meeting Safely */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-primary" />
                                Meeting Safely
                            </CardTitle>
                            <CardDescription>Tips for safe in-person meetings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Always meet in a public place for the first few dates</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Tell a friend or family member where you're going and who you're meeting</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Arrange your own transportation to and from the date</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Keep your phone charged and with you at all times</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Trust your instincts - if something feels off, leave</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Protecting Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-primary" />
                                Protecting Personal Information
                            </CardTitle>
                            <CardDescription>Keep your information secure</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Never share your home address, workplace, or financial information</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Be cautious about sharing your phone number too early</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Use the in-app messaging until you feel comfortable</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">Be wary of anyone asking for money or financial help</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recognizing Red Flags */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-primary" />
                                Recognizing Red Flags
                            </CardTitle>
                            <CardDescription>Warning signs to watch out for</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                <p className="text-sm">Profile seems too good to be true or uses professional photos</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                <p className="text-sm">Requests money or financial assistance</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                <p className="text-sm">Refuses to meet in person or always has excuses</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                <p className="text-sm">Pressures you to leave the platform quickly</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                <p className="text-sm">Becomes aggressive or disrespectful when you set boundaries</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reporting and Blocking */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" />
                                Reporting and Blocking
                            </CardTitle>
                            <CardDescription>How to report suspicious behavior</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm">
                                If you encounter any suspicious behavior, harassment, or feel unsafe, you can:
                            </p>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">
                                    <strong>Block</strong> - Immediately prevent someone from contacting you
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <p className="text-sm">
                                    <strong>Report</strong> - Alert our team to review the profile and take action
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                Both options are available on every profile and in every chat. Your reports are confidential.
                            </p>
                            <div className="pt-2">
                                <Button variant="outline" onClick={() => navigate("/guidelines")}>Community Guidelines</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your reports</CardTitle>
                            <CardDescription>Status updates for reports you submitted</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!userId ? (
                                <p className="text-sm text-muted-foreground">Log in to view your reports.</p>
                            ) : (myReports && myReports.length > 0) ? (
                                <div className="space-y-2">
                                    {(myReports as any[]).slice(0, 10).map((r) => (
                                        <div key={r._id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                                            <div>
                                                <div className="text-sm font-medium">{r.category || r.reason || "Report"}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(r.createdAt, "PPp")}
                                                </div>
                                            </div>
                                            <div className="text-xs font-medium capitalize text-muted-foreground">
                                                {String(r.status || "pending").replace(/_/g, " ")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No reports yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Blocked Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Blocked users</CardTitle>
                            <CardDescription>Manage who you’ve blocked</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!userId ? (
                                <p className="text-sm text-muted-foreground">Log in to view blocked users.</p>
                            ) : (blockedUsers && blockedUsers.length > 0) ? (
                                <div className="space-y-2">
                                    {(blockedUsers as any[]).map((b) => (
                                        <div key={b.userId} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium truncate">{b.location || "Blocked user"}</div>
                                                <div className="text-xs text-muted-foreground">Blocked {format(b.blockedAt, "PP")}</div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        await unblockUser({ blockerId: userId as any, blockedUserId: b.userId as any } as any);
                                                        toast.success("User unblocked");
                                                    } catch (e: any) {
                                                        toast.error(e?.message || "Failed to unblock user");
                                                    }
                                                }}
                                            >
                                                Unblock
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">You haven’t blocked anyone.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-700">
                                <Phone className="w-5 h-5" />
                                Emergency Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-emerald-700 mb-4">
                                If you are in immediate danger, contact local emergency services:
                            </p>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-emerald-700">Emergency: Contact local authorities</p>
                                <p className="text-sm text-muted-foreground">Call your local emergency number immediately</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center pt-6">
                        <Button onClick={() => navigate("/dashboard")} variant="outline">
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Safety;
