export type PayType = "hourly" | "per_period" | "total" | "milestone" | "non_cash" | "not_specified";
export type PayPeriod = "week" | "two_weeks" | "month";
export type ConditionsStatus = "confirmed" | "reported" | "unknown";

export interface PayInfo {
  type: PayType;
  amountCents?: number; // integer cents
  maxAmountCents?: number; // optional top of a range (hourly, per_period, total only)
  period?: PayPeriod; // per_period only
  milestones?: number; // milestone only
  items?: string[]; // non_cash only
  extras?: string[]; // optional non-cash extras on cash types
  conditions?: ConditionsStatus; // defaults to "unknown"
}

const NOT_SPECIFIED = "Not specified";

const PERIOD_SUFFIX: Record<PayPeriod, string> = {
  week: "/week",
  two_weeks: " every 2 weeks",
  month: "/month",
};

// Cents only when nonzero; commas for thousands.
function dollars(cents: number): string {
  const digits = cents % 100 === 0 ? 0 : 2;
  const amount = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `$${amount}`;
}

// One range helper for every type: a range shows only when max is strictly above the amount.
function amountOrRange(amountCents: number, maxAmountCents?: number): string {
  if (maxAmountCents !== undefined && maxAmountCents > amountCents) {
    return `${dollars(amountCents)}–${dollars(maxAmountCents)}`;
  }
  return dollars(amountCents);
}

// A cash amount must be a positive number of cents; anything else is "Not specified", never "$0".
function hasAmount(cents: number | undefined): cents is number {
  return cents !== undefined && Number.isFinite(cents) && cents > 0;
}

// Conditions text goes last and only applies to hourly, per_period, and total.
function conditionsSuffix(conditions: ConditionsStatus | undefined): string {
  if (conditions === "confirmed") return " (conditions apply)";
  if (conditions === "reported") return " (conditions may apply)";
  return "";
}

function extrasSuffix(extras: string[] | undefined): string {
  const clean = (extras ?? []).map((e) => e.trim()).filter(Boolean);
  return clean.length > 0 ? ` + ${clean.join(", ")}` : "";
}

// Shows pay in its original unit, never converted; the server calls this for every pay string.
export function formatPay(pay: PayInfo): string {
  switch (pay.type) {
    case "hourly":
    case "per_period":
    case "total": {
      if (!hasAmount(pay.amountCents)) return NOT_SPECIFIED;
      const amount = amountOrRange(pay.amountCents, pay.maxAmountCents);

      let base: string;
      if (pay.type === "hourly") {
        base = `${amount}/hr`;
      } else if (pay.type === "total") {
        base = `${amount} total`;
      } else {
        // per_period needs a period to mean anything
        if (!pay.period) return NOT_SPECIFIED;
        base = `${amount}${PERIOD_SUFFIX[pay.period]}`;
      }
      return `${base}${extrasSuffix(pay.extras)}${conditionsSuffix(pay.conditions)}`;
    }

    case "milestone": {
      if (!hasAmount(pay.amountCents)) return NOT_SPECIFIED;
      // Milestone pay is a single total; max and conditions are ignored.
      const total = dollars(pay.amountCents);
      const n = pay.milestones;
      // Always signal that the payout is conditional, even when the count is unknown.
      const known = n !== undefined && Number.isInteger(n) && n > 0;
      const clause = known ? `, paid in ${n} ${n === 1 ? "milestone" : "milestones"}` : ", paid in milestones";
      return `${total} total${clause}${extrasSuffix(pay.extras)}`;
    }

    case "non_cash": {
      const items = (pay.items ?? []).map((i) => i.trim()).filter(Boolean);
      return items.length > 0 ? `No cash — ${items.join(", ")}` : NOT_SPECIFIED;
    }

    case "not_specified":
      return NOT_SPECIFIED;
  }
}
