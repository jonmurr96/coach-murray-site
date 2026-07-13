import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("public inline scripts", () => {
  for (const file of ["index.html", "quiz.html"]) {
    it(`${file} has syntactically valid inline JavaScript`, () => {
      const html = readFileSync(path.join(root, "public", file), "utf8");
      const scripts = Array.from(
        html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)
      )
        .map(match => match[1])
        .filter(Boolean);
      expect(scripts.length).toBeGreaterThan(0);
      for (const script of scripts)
        expect(() => new Function(script)).not.toThrow();
    });
  }
});
