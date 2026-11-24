import { describe, it, expect } from "vitest";

describe("test runner", () => {
  it("catches a wrong answer", () => {
    expect(1 + 1).toBe(2); //correct answer: runner works
  });
});