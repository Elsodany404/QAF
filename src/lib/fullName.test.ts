import { describe, expect, it } from "vitest";

import { isFullName } from "./fullName";

describe("isFullName", () => {
  it.each([
    "Sara Ahmed",
    "  Sara   Ahmed  ",
    "Mohamed El-Sodany",
    "Mary-Jane O'Brien",
    "Ahmed M. Hassan",
    "محمد علي",
    "عبد الرحمن محمود",
    "مُحَمَّد عَلِي",
    "Sara Ahmed Ali Hassan",
  ])("accepts %j", (name) => {
    expect(isFullName(name)).toBe(true);
  });

  it.each([
    "",
    "   ",
    "Sara",
    "محمد",
    "S Ahmed", // a one-letter first name
    "Sara A", // a one-letter last name
    "Sara 2",
    "Sara Ahmed3",
    "Sara @hmed",
    "-Sara Ahmed",
    "Sara 😀",
  ])("rejects %j", (name) => {
    expect(isFullName(name)).toBe(false);
  });
});
