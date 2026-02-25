import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up old read notifications every day at 3 AM UTC
crons.daily(
  "cleanup-old-notifications",
  { hourUTC: 3, minuteUTC: 0 },
  internal.notifications.cleanupOldNotifications
);

// Clean up expired notifications every hour
crons.hourly(
  "cleanup-expired-notifications",
  { minuteUTC: 0 },
  internal.notifications.deleteExpiredNotifications
);

// Phase 4: Process scheduled account deletions daily at 2 AM UTC
crons.daily(
  "process-scheduled-deletions",
  { hourUTC: 2, minuteUTC: 0 },
  internal.accountManagement.processScheduledDeletions
);

// Phase 4: Clean up expired data exports daily at 4 AM UTC
crons.daily(
  "cleanup-expired-exports",
  { hourUTC: 4, minuteUTC: 0 },
  internal.dataExport.cleanupExpiredExports
);

// Payments: delete failed transactions from billing history after 10 minutes
crons.interval(
  "cleanup-failed-payments",
  { minutes: 1 },
  internal.payments.cleanupOldFailedPayments,
  { olderThanMinutes: 10, batchSize: 200 }
);

// Subscriptions: mark expired subscriptions every hour
crons.hourly(
  "expire-subscriptions",
  { minuteUTC: 30 },
  internal.subscriptionExpiry.expireSubscriptions
);

// Subscriptions: send renewal reminders daily at 9 AM UTC
crons.daily(
  "send-renewal-reminders",
  { hourUTC: 9, minuteUTC: 0 },
  internal.subscriptionExpiry.sendRenewalReminders
);

export default crons;
