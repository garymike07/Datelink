export type FeatureType = 
  | 'messaging'  | 'super_like'
  | 'rewind'
  | 'see_likes'
  | 'boost'
  | 'advanced_filters'
  | 'read_receipts'
  | 'scheduled_messages';

export interface FeatureLimit {
  feature: FeatureType;
  freeLimit: number | boolean;
  premiumLimit: number | boolean;
  resetPeriod: 'daily' | 'weekly' | 'monthly' | 'never';
  errorMessage: string;
  paywallMessage: string;
}

export const FEATURE_LIMITS: Record<FeatureType, FeatureLimit> = {
  messaging: {
    feature: 'messaging',
    freeLimit: true, // unlimited for all users
    premiumLimit: true,
    resetPeriod: 'never',
    errorMessage: 'Messaging is currently unavailable',
    paywallMessage: 'Messaging is available for all users'
  },
  super_like: {
    feature: 'super_like',
    freeLimit: 0,
    premiumLimit: 5,
    resetPeriod: 'daily',
    errorMessage: 'Super Likes are a Premium feature',
    paywallMessage: 'Stand out with Super Likes - KES 100/week or KES 350/month'
  },
  rewind: {
    feature: 'rewind',
    freeLimit: 1,
    premiumLimit: true,
    resetPeriod: 'daily',
    errorMessage: 'Daily rewind limit reached',
    paywallMessage: 'Get unlimited rewinds with Premium - KES 100/week or KES 350/month'
  },
  see_likes: {
    feature: 'see_likes',
    freeLimit: false,
    premiumLimit: true,
    resetPeriod: 'never',
    errorMessage: 'See who likes you with Premium',
    paywallMessage: 'See all your likes instantly with Premium - KES 100/week or KES 350/month'
  },
  boost: {
    feature: 'boost',
    freeLimit: false,
    premiumLimit: 1,
    resetPeriod: 'monthly',
    errorMessage: 'Boost is a Premium feature',
    paywallMessage: 'Boost your profile with Premium - KES 100/week or KES 350/month'
  },
  advanced_filters: {
    feature: 'advanced_filters',
    freeLimit: false,
    premiumLimit: true,
    resetPeriod: 'never',
    errorMessage: 'Advanced filters are a Premium feature',
    paywallMessage: 'Find exactly who you\'re looking for with Premium filters - KES 100/week or KES 350/month'
  },
  read_receipts: {
    feature: 'read_receipts',
    freeLimit: false,
    premiumLimit: true,
    resetPeriod: 'never',
    errorMessage: 'Read receipts are a Premium feature',
    paywallMessage: 'See when messages are read with Premium - KES 100/week or KES 350/month'
  },
  scheduled_messages: {
    feature: 'scheduled_messages',
    freeLimit: false,
    premiumLimit: true,
    resetPeriod: 'never',
    errorMessage: 'Scheduled messages are a Premium feature',
    paywallMessage: 'Schedule messages with Premium - KES 100/week or KES 350/month'
  }
};

/**
 * Get human-readable limit description
 */
export function getFeatureLimitDescription(feature: FeatureType, isPremium: boolean): string {
  const limit = FEATURE_LIMITS[feature];
  const currentLimit = isPremium ? limit.premiumLimit : limit.freeLimit;
  
  if (currentLimit === true) return 'Unlimited';
  if (currentLimit === false) return 'Not available';
  if (typeof currentLimit === 'number') return `${currentLimit} per ${limit.resetPeriod.replace('ly', '')}`;
  
  return 'Unknown';
}

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(feature: FeatureType, isPremium: boolean): boolean {
  const limit = FEATURE_LIMITS[feature];
  const currentLimit = isPremium ? limit.premiumLimit : limit.freeLimit;
  
  return currentLimit !== false && currentLimit !== 0;
}

/**
 * Get paywall modal config for a feature
 */
export function getPaywallConfig(feature: FeatureType) {
  return {
    feature,
    ...FEATURE_LIMITS[feature]
  };
}
