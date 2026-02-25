import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, User, Shield, Bell, FileText, LogOut, MessageCircle, Star, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SmartPhotoOrder } from "@/components/profile/SmartPhotoOrder";
import { ReviewStatus } from "@/components/profile/ReviewStatus";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { DataExportDialog } from "@/components/account/DataExportDialog";
import { UnlockStatsCard } from "@/components/profile/UnlockStatsCard";

const Settings = () => {
    const navigate = useNavigate();
    const { user, token, logout } = useAuth();
    const userId = user?._id;

    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
    const supportLink = whatsappNumber
        ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
            "Hi DateLink Support, I need help with my account."
        )}`
        : null;

    const settingsDoc = useQuery(api.settings.getMySettings, userId ? { userId } : "skip");
    const entitlements = useQuery(api.subscriptions.getMyEntitlements, userId ? { userId } : "skip");
    const updateSettings = useMutation(api.settings.updateMySettings);
    const changeEmail = useMutation(api.auth.changeEmail);
    const changePassword = useMutation(api.auth.changePassword);
    const deactivateAccount = useMutation(api.accountManagement.deactivateAccount);
    const reactivateAccount = useMutation(api.accountManagement.reactivateAccount);

    const [settings, setSettings] = useState({
        showOnlineStatus: true,
        readReceipts: true,
        emailNotifications: true,
        matchNotifications: true,
        messageNotifications: true,
    });

    const [changeEmailOpen, setChangeEmailOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [smartPhotoOpen, setSmartPhotoOpen] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);

    const [newEmail, setNewEmail] = useState("");
    const [emailPassword, setEmailPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!settingsDoc) return;

        setSettings({
            showOnlineStatus: settingsDoc.showOnlineStatus,
            readReceipts: settingsDoc.readReceipts,
            emailNotifications: settingsDoc.emailNotifications,
            matchNotifications: settingsDoc.matchNotifications,
            messageNotifications: settingsDoc.messageNotifications,
        });
    }, [settingsDoc]);

    const handleToggle = async (
        key: "showOnlineStatus" | "readReceipts" | "emailNotifications" | "matchNotifications" | "messageNotifications"
    ) => {
        if (key === "readReceipts" && entitlements && !entitlements.isPremium) {
            toast.error("Read receipts are a Premium feature");
            navigate("/upgrade");
            return;
        }

        const nextValue = !settings[key];
        setSettings((prev) => ({
            ...prev,
            [key]: nextValue,
        }));

        if (!userId) return;
        try {
            await updateSettings({ userId, [key]: nextValue } as any);
            toast.success("Settings updated");
        } catch (error: any) {
            toast.error(error?.message || "Failed to update settings");
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
        toast.success("Logged out successfully");
    };

    const handleSubmitChangeEmail = async () => {
        if (!userId) return;
        if (!newEmail.trim()) {
            toast.error("Enter a new email");
            return;
        }
        if (!emailPassword) {
            toast.error("Enter your password");
            return;
        }

        setSaving(true);
        try {
            const result = await changeEmail({
                userId,
                newEmail: newEmail.trim(),
                password: emailPassword,
            });

            if (result?.user) {
                // User data will be automatically updated via the auth context
            }
            toast.success("Email updated");
            setChangeEmailOpen(false);
            setNewEmail("");
            setEmailPassword("");
        } catch (error: any) {
            toast.error(error?.message || "Failed to change email");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitChangePassword = async () => {
        if (!userId) return;
        if (!currentPassword) {
            toast.error("Enter your current password");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }

        setSaving(true);
        try {
            await changePassword({
                userId,
                currentPassword,
                newPassword,
            });
            toast.success("Password updated");
            setChangePasswordOpen(false);
            setCurrentPassword("");
            setNewPassword("");
        } catch (error: any) {
            toast.error(error?.message || "Failed to change password");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivateAccount = async () => {
        if (!token) {
            toast.error("Not authenticated");
            return;
        }
        setIsDeactivating(true);
        try {
            const result = await deactivateAccount({ token });
            toast.success(result.message);
        } catch (error: any) {
            toast.error(error.message || "Failed to deactivate account");
        } finally {
            setIsDeactivating(false);
        }
    };

    const handleReactivateAccount = async () => {
        if (!token) {
            toast.error("Not authenticated");
            return;
        }
        setIsDeactivating(true);
        try {
            const result = await reactivateAccount({ token });
            toast.success(result.message);
        } catch (error: any) {
            toast.error(error.message || "Failed to reactivate account");
        } finally {
            setIsDeactivating(false);
        }
    };

    const isAccountDeactivated = user?.accountStatus === "deactivated";

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8 max-w-2xl">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Settings</h1>

                {/* Account Section */}
                <Card className="p-4 md:p-6 mb-4 glass-panel border-white/40">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Account</h2>
                    </div>
                    <div className="space-y-3">
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => navigate("/upgrade")}
                        >
                            Upgrade to Premium
                            <Star className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => navigate("/profile-setup")}
                        >
                            Edit Profile
                            <ChevronRight className="w-4 h-4" />
                        </Button>

                        {userId && <ReviewStatus userId={userId} />}

                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => navigate("/photo-verification")}
                        >
                            Photo Verification
                            <ChevronRight className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => setSmartPhotoOpen(true)}
                        >
                            Smart Photo Order
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => {
                                setNewEmail("");
                                setEmailPassword("");
                                setChangeEmailOpen(true);
                            }}
                        >
                            Change Email
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => {
                                setCurrentPassword("");
                                setNewPassword("");
                                setChangePasswordOpen(true);
                            }}
                        >
                            Change Password
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>

                {/* Privacy Section */}
                <Card className="p-4 md:p-6 mb-4 glass-panel border-white/40">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Privacy</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="online-status">Show Online Status</Label>
                            <Switch
                                id="online-status"
                                checked={settings.showOnlineStatus}
                                onCheckedChange={() => handleToggle("showOnlineStatus")}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="read-receipts">Read Receipts</Label>
                            <Switch
                                id="read-receipts"
                                checked={settings.readReceipts}
                                onCheckedChange={() => handleToggle("readReceipts")}
                            />
                        </div>
                    </div>
                </Card>

                {/* Notifications Section */}
                <Card className="p-4 md:p-6 mb-4 glass-panel border-white/40">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Notifications</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-notif">Email Notifications</Label>
                            <Switch
                                id="email-notif"
                                checked={settings.emailNotifications}
                                onCheckedChange={() => handleToggle("emailNotifications")}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="match-notif">New Match Notifications</Label>
                            <Switch
                                id="match-notif"
                                checked={settings.matchNotifications}
                                onCheckedChange={() => handleToggle("matchNotifications")}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="message-notif">Message Notifications</Label>
                            <Switch
                                id="message-notif"
                                checked={settings.messageNotifications}
                                onCheckedChange={() => handleToggle("messageNotifications")}
                            />
                        </div>
                    </div>
                </Card>

                {/* Legal Section */}
                <Card className="p-4 md:p-6 mb-4 glass-card border-white/20">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Legal</h2>
                    </div>
                    <div className="space-y-3">
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => navigate("/terms")}
                        >
                            Terms of Service
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => navigate("/privacy")}
                        >
                            Privacy Policy
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => navigate("/guidelines")}
                        >
                            Community Guidelines
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => navigate("/safety")}
                        >
                            Safety Center
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>

                {/* Profile Unlock Stats - Phase 2 */}
                {userId && (
                    <div className="mb-4">
                        <UnlockStatsCard userId={userId} />
                    </div>
                )}

                {/* Account Management Section - Phase 4 */}
                <Card className="p-4 md:p-6 mb-4 glass-card border-white/20">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Account Management</h2>
                    </div>
                    <div className="space-y-3">
                        <DataExportDialog />

                        <Separator />

                        {isAccountDeactivated ? (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleReactivateAccount}
                                disabled={isDeactivating}
                            >
                                <PlayCircle className="mr-2 h-4 w-4" />
                                {isDeactivating ? "Reactivating..." : "Reactivate Account"}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleDeactivateAccount}
                                disabled={isDeactivating}
                            >
                                <PauseCircle className="mr-2 h-4 w-4" />
                                {isDeactivating ? "Deactivating..." : "Pause Account"}
                            </Button>
                        )}

                        <Separator />

                        <DeleteAccountDialog />
                    </div>
                </Card>

                {/* Logout Button */}
                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                </Button>

                <Button
                    variant="outline"
                    className="w-full mt-3"
                    disabled={!supportLink}
                    onClick={() => {
                        if (!supportLink) return;
                        window.open(supportLink, "_blank", "noopener,noreferrer");
                    }}
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp Support
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    DateLink v1.0.0
                </p>
                <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change Email</DialogTitle>
                            <DialogDescription>
                                Enter your new email address and your current password.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-email">New Email</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="name@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-password">Password</Label>
                                <Input
                                    id="email-password"
                                    type="password"
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setChangeEmailOpen(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmitChangeEmail}
                                disabled={saving}
                                className={cn(saving && "opacity-80")}
                            >
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                                Enter your current password and a new password.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSubmitChangePassword} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={smartPhotoOpen} onOpenChange={setSmartPhotoOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Smart Photo Order</DialogTitle>
                            <DialogDescription>
                                See how your photos perform and reorder them to put your best first.
                            </DialogDescription>
                        </DialogHeader>
                        {userId ? <SmartPhotoOrder userId={userId} /> : null}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Settings;
