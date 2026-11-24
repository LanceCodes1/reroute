import { describe, it, expect } from "vitest";
import { formatPay } from "@/lib/formatPay";

describe("formatPay: hourly", () => {
  it("1. formats an hourly wage with cents", () => {
    expect(formatPay({ type: "hourly", amountCents: 1787 })).toBe("$17.87/hr");
  });

  it("2. drops .00 on whole-dollar hourly wages", () => {
    expect(formatPay({ type: "hourly", amountCents: 2000 })).toBe("$20/hr");
  });

  it("3. formats an hourly range with an en dash", () => {
    expect(formatPay({ type: "hourly", amountCents: 1700, maxAmountCents: 2000 })).toBe("$17–$20/hr");
  });

  it("15. returns Not specified when hourly has no amount", () => {
    expect(formatPay({ type: "hourly" })).toBe("Not specified");
  });

  it("16. returns Not specified when hourly amount is zero, never $0", () => {
    expect(formatPay({ type: "hourly", amountCents: 0 })).toBe("Not specified");
  });

  it("18. appends (conditions apply) when conditions are confirmed", () => {
    expect(formatPay({ type: "hourly", amountCents: 1787, conditions: "confirmed" })).toBe(
      "$17.87/hr (conditions apply)",
    );
  });

  it("22. appends nothing when conditions are unknown", () => {
    expect(formatPay({ type: "hourly", amountCents: 1787, conditions: "unknown" })).toBe("$17.87/hr");
  });

  it("24. ignores a max below the amount and shows the amount alone", () => {
    expect(formatPay({ type: "hourly", amountCents: 2000, maxAmountCents: 1700 })).toBe("$20/hr");
  });

  it("25. shows a single amount when max equals the amount", () => {
    expect(formatPay({ type: "hourly", amountCents: 2000, maxAmountCents: 2000 })).toBe("$20/hr");
  });
});

describe("formatPay: per_period", () => {
  it("4. formats a two-week period as 'every 2 weeks'", () => {
    expect(formatPay({ type: "per_period", amountCents: 60000, period: "two_weeks" })).toBe("$600 every 2 weeks");
  });

  it("5. formats a monthly amount with a thousands comma", () => {
    expect(formatPay({ type: "per_period", amountCents: 120000, period: "month" })).toBe("$1,200/month");
  });

  it("6. formats a weekly amount", () => {
    expect(formatPay({ type: "per_period", amountCents: 30000, period: "week" })).toBe("$300/week");
  });

  it("7. keeps nonzero cents alongside a thousands comma", () => {
    expect(formatPay({ type: "per_period", amountCents: 125050, period: "month" })).toBe("$1,250.50/month");
  });

  it("23. returns Not specified when per_period has no period", () => {
    expect(formatPay({ type: "per_period", amountCents: 60000 })).toBe("Not specified");
  });

  it("26. shows a single amount when per_period max equals the amount", () => {
    expect(
      formatPay({ type: "per_period", amountCents: 60000, maxAmountCents: 60000, period: "two_weeks" }),
    ).toBe("$600 every 2 weeks");
  });
});

describe("formatPay: total", () => {
  it("8. formats a total amount", () => {
    expect(formatPay({ type: "total", amountCents: 15000 })).toBe("$150 total");
  });

  it("9. formats a total range with an en dash", () => {
    expect(formatPay({ type: "total", amountCents: 5000, maxAmountCents: 15000 })).toBe("$50–$150 total");
  });

  it("10. formats a large total with a thousands comma", () => {
    expect(formatPay({ type: "total", amountCents: 240000 })).toBe("$2,400 total");
  });

  it("13. appends extras after the amount", () => {
    expect(formatPay({ type: "total", amountCents: 10000, extras: ["lunch"] })).toBe("$100 total + lunch");
  });

  it("19. appends (conditions may apply) when conditions are reported", () => {
    expect(formatPay({ type: "total", amountCents: 300000, conditions: "reported" })).toBe(
      "$3,000 total (conditions may apply)",
    );
  });

  it("20. puts extras before conditions", () => {
    expect(
      formatPay({ type: "total", amountCents: 10000, extras: ["lunch"], conditions: "confirmed" }),
    ).toBe("$100 total + lunch (conditions apply)");
  });

  it("27. ignores a total max below the amount and shows the amount alone", () => {
    expect(formatPay({ type: "total", amountCents: 15000, maxAmountCents: 5000 })).toBe("$150 total");
  });
});

describe("formatPay: milestone", () => {
  it("11. formats a milestone total with the milestone count", () => {
    expect(formatPay({ type: "milestone", amountCents: 120000, milestones: 3 })).toBe(
      "$1,200 total, paid in 3 milestones",
    );
  });

  it("28. still signals milestones when the count is unknown", () => {
    expect(formatPay({ type: "milestone", amountCents: 120000 })).toBe("$1,200 total, paid in milestones");
  });

  it("21. ignores conditions for milestone pay", () => {
    expect(
      formatPay({ type: "milestone", amountCents: 120000, milestones: 3, conditions: "confirmed" }),
    ).toBe("$1,200 total, paid in 3 milestones");
  });
});

describe("formatPay: non_cash", () => {
  it("12. lists non-cash items after an em dash", () => {
    expect(formatPay({ type: "non_cash", items: ["gift card", "laptop"] })).toBe("No cash — gift card, laptop");
  });

  it("17. returns Not specified when non_cash has no items", () => {
    expect(formatPay({ type: "non_cash", items: [] })).toBe("Not specified");
  });
});

describe("formatPay: not_specified", () => {
  it("14. returns Not specified", () => {
    expect(formatPay({ type: "not_specified" })).toBe("Not specified");
  });
});
