import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { categoryName, productName, valueLabel } from "./catalog";
import { format, placeholders } from "./format";
import { clientMessages, getMessages } from "./messages";
import ar from "./messages/ar";
import en from "./messages/en";
import { rich } from "./rich";

/** Every string in a dictionary, by its dotted path. */
function strings(value: unknown, path = ""): Map<string, string> {
  const found = new Map<string, string>();
  if (typeof value === "string") {
    found.set(path, value);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      for (const [key, text] of strings(item, `${path}[${index}]`)) {
        found.set(key, text);
      }
    });
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      for (const [itemPath, text] of strings(item, path ? `${path}.${key}` : key)) {
        found.set(itemPath, text);
      }
    }
  }
  return found;
}

describe("dictionaries", () => {
  const english = strings(en);
  const arabic = strings(ar);

  it("translate every English string", () => {
    expect([...arabic.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, text] of arabic) {
      expect(text.trim(), key).not.toBe("");
    }
  });

  it("keep the same placeholders", () => {
    for (const [key, text] of english) {
      expect(placeholders(arabic.get(key)!).sort(), key).toEqual(
        placeholders(text).sort(),
      );
    }
  });

  it("are actually Arabic", () => {
    const untranslated = [...arabic].filter(
      ([key, text]) =>
        text === english.get(key) &&
        // Same in both: punctuation-only templates and the language switch.
        !/^[{}\w\s—%|:]*$/.test(text),
    );
    expect(untranslated).toEqual([]);
  });

  it("hand client components only their part", () => {
    const client = clientMessages(getMessages("ar"));
    expect(client.cart).toBe(ar.cart);
    expect(Object.keys(client)).not.toContain("server");
    expect(Object.keys(client)).not.toContain("policies");
  });
});

describe("format", () => {
  it("fills placeholders", () => {
    expect(format("Hi {name}, order {number}", { name: "Sara", number: 7 })).toBe(
      "Hi Sara, order 7",
    );
    expect(format("{a}{a}", { a: "x" })).toBe("xx");
  });

  it("leaves unknown placeholders alone", () => {
    expect(format("Hi {name}", {})).toBe("Hi {name}");
    expect(format("{toString}", {})).toBe("{toString}");
  });
});

describe("rich", () => {
  it("puts elements where the language wants them", () => {
    const link = createElement("a", { href: "/user" }, "your account");
    const render = (message: string) =>
      renderToStaticMarkup(
        createElement(Fragment, null, rich(message, { account: link })),
      );

    expect(render("Cancel from {account} today.")).toBe(
      'Cancel from <a href="/user">your account</a> today.',
    );
    expect(render("{account} first")).toBe(
      '<a href="/user">your account</a> first',
    );
    expect(render("No {other} here")).toBe("No {other} here");
  });
});

describe("catalog text", () => {
  const product = { name: "French Coffee", nameAr: "قهوة فرنساوي" };

  it("uses the Arabic text on Arabic pages", () => {
    expect(productName(product, "ar")).toBe("قهوة فرنساوي");
    expect(productName(product, "en")).toBe("French Coffee");
  });

  it("falls back to English when there is no Arabic text", () => {
    expect(productName({ name: "Espresso", nameAr: null }, "ar")).toBe(
      "Espresso",
    );
    expect(productName({ name: "Espresso", nameAr: "  " }, "ar")).toBe(
      "Espresso",
    );
    // Carts saved before the Arabic columns existed.
    expect(valueLabel({ label: "250g" }, "ar")).toBe("250g");
  });

  it("names categories", () => {
    expect(categoryName(ar.categories, "turkish")).toBe("قهوة تركي");
    expect(categoryName(en.categories, "turkish")).toBe("Turkish Coffee");
    expect(categoryName(ar.categories, "decaf")).toBe("decaf");
    expect(categoryName(ar.categories, "toString")).toBe("toString");
    expect(categoryName(ar.categories, null)).toBe("");
  });
});
