export type PremiumSubscriptionDuration = "1_week" | "1_month";
export type PremiumPlanDuration = PremiumSubscriptionDuration;

export interface PremiumPlan {
  duration: PremiumPlanDuration;
  label: string;
  periodLabel: string;
  amountKes: number;
}

export const PREMIUM_SUBSCRIPTION_PLANS: PremiumPlan[] = [
  { duration: "1_week", label: "Weekly", periodLabel: "week", amountKes: 100 },
  { duration: "1_month", label: "Monthly", periodLabel: "month", amountKes: 350 },
];

export const PREMIUM_PLANS: PremiumPlan[] = [...PREMIUM_SUBSCRIPTION_PLANS];

export function getPremiumAmountKes(duration: PremiumPlanDuration): number {
  const plan = PREMIUM_PLANS.find((p) => p.duration === duration);
  if (!plan) throw new Error(`Unknown premium plan duration: ${duration}`);
  return plan.amountKes;
}

