import { describe, expect, it } from "vitest";
import { parseEnvExample } from "../src/envfile.js";

describe("parseEnvExample", () => {
  it("parses keys and ignores values", () => {
    const names = parseEnvExample("DATABASE_URL=postgres://secret\nPORT=3000");
    expect(names).toEqual(["DATABASE_URL", "PORT"]);
  });

  it("ignores comments and blank lines", () => {
    const content = ["# a comment", "", "  ", "PORT=1", "# PORT=2"].join("\n");
    expect(parseEnvExample(content)).toEqual(["PORT"]);
  });

  it("supports the export prefix", () => {
    expect(parseEnvExample("export API_KEY=abc")).toEqual(["API_KEY"]);
  });

  it("deduplicates repeated keys, keeping first order", () => {
    expect(parseEnvExample("A=1\nB=2\nA=3")).toEqual(["A", "B"]);
  });

  it("ignores lines without an assignment", () => {
    expect(parseEnvExample("NOT_A_VAR\n=missingkey\nOK=1")).toEqual(["OK"]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseEnvExample("")).toEqual([]);
  });
});
