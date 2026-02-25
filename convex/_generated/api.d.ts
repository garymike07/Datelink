/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountManagement from "../accountManagement.js";
import type * as activityTracking from "../activityTracking.js";
import type * as analytics from "../analytics.js";
import type * as attachments from "../attachments.js";
import type * as auth from "../auth.js";
import type * as badges from "../badges.js";
import type * as compatibility from "../compatibility.js";
import type * as crons from "../crons.js";
import type * as dailyRewards from "../dailyRewards.js";
import type * as dataExport from "../dataExport.js";
import type * as discovery from "../discovery.js";
import type * as freeTrial from "../freeTrial.js";
import type * as gamification from "../gamification.js";
import type * as lipana from "../lipana.js";
import type * as matching from "../matching.js";
import type * as messages from "../messages.js";
import type * as mpesa from "../mpesa.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as payments from "../payments.js";
import type * as paymentsCleanup from "../paymentsCleanup.js";
import type * as paymentsInternal from "../paymentsInternal.js";
import type * as paymentsStatus from "../paymentsStatus.js";
import type * as presence from "../presence.js";
import type * as profileScore from "../profileScore.js";
import type * as profileUnlocks from "../profileUnlocks.js";
import type * as profiles from "../profiles.js";
import type * as progressiveDisclosure from "../progressiveDisclosure.js";
import type * as prompts from "../prompts.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushNotificationsActions from "../pushNotificationsActions.js";
import type * as safety from "../safety.js";
import type * as scheduledMessages from "../scheduledMessages.js";
import type * as settings from "../settings.js";
import type * as statusPosts from "../statusPosts.js";
import type * as subscriptions from "../subscriptions.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountManagement: typeof accountManagement;
  activityTracking: typeof activityTracking;
  analytics: typeof analytics;
  attachments: typeof attachments;
  auth: typeof auth;
  badges: typeof badges;
  compatibility: typeof compatibility;
  crons: typeof crons;
  dailyRewards: typeof dailyRewards;
  dataExport: typeof dataExport;
  discovery: typeof discovery;
  freeTrial: typeof freeTrial;
  gamification: typeof gamification;
  lipana: typeof lipana;
  matching: typeof matching;
  messages: typeof messages;
  mpesa: typeof mpesa;
  notificationPreferences: typeof notificationPreferences;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  payments: typeof payments;
  paymentsCleanup: typeof paymentsCleanup;
  paymentsInternal: typeof paymentsInternal;
  paymentsStatus: typeof paymentsStatus;
  presence: typeof presence;
  profileScore: typeof profileScore;
  profileUnlocks: typeof profileUnlocks;
  profiles: typeof profiles;
  progressiveDisclosure: typeof progressiveDisclosure;
  prompts: typeof prompts;
  pushNotifications: typeof pushNotifications;
  pushNotificationsActions: typeof pushNotificationsActions;
  safety: typeof safety;
  scheduledMessages: typeof scheduledMessages;
  settings: typeof settings;
  statusPosts: typeof statusPosts;
  subscriptions: typeof subscriptions;
  verification: typeof verification;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
