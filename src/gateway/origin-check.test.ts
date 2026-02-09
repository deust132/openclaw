import { describe, expect, it } from "vitest";
import { checkBrowserOrigin, isHostAllowed } from "./origin-check.js";

describe("checkBrowserOrigin", () => {
  it("accepts same-origin host matches", () => {
    const result = checkBrowserOrigin({
      requestHost: "127.0.0.1:18789",
      origin: "http://127.0.0.1:18789",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts loopback host mismatches for dev", () => {
    const result = checkBrowserOrigin({
      requestHost: "127.0.0.1:18789",
      origin: "http://localhost:5173",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts allowlisted origins", () => {
    const result = checkBrowserOrigin({
      requestHost: "gateway.example.com:18789",
      origin: "https://control.example.com",
      allowedOrigins: ["https://control.example.com"],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects missing origin", () => {
    const result = checkBrowserOrigin({
      requestHost: "gateway.example.com:18789",
      origin: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects mismatched origins", () => {
    const result = checkBrowserOrigin({
      requestHost: "gateway.example.com:18789",
      origin: "https://attacker.example.com",
    });
    expect(result.ok).toBe(false);
  });
});

describe("DNS rebinding defense", () => {
  it("rejects evil.com Host header when allowedHosts is set", () => {
    const result = checkBrowserOrigin({
      requestHost: "evil.com:18789",
      origin: "http://evil.com:18789",
      allowedHosts: ["mygateway.example.com"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("host not allowed");
    }
  });

  it("rejects subdomain rebinding", () => {
    const result = checkBrowserOrigin({
      requestHost: "rebind.attacker.com:18789",
      origin: "http://rebind.attacker.com:18789",
      allowedHosts: ["gateway.local"],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects rebinding even when origin matches host", () => {
    const result = checkBrowserOrigin({
      requestHost: "malicious.com",
      origin: "http://malicious.com",
      allowedHosts: ["safe.example.com"],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts hosts in allowedHosts whitelist", () => {
    const result = checkBrowserOrigin({
      requestHost: "mygateway.example.com:18789",
      origin: "http://mygateway.example.com:18789",
      allowedHosts: ["mygateway.example.com"],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts localhost even with allowedHosts set", () => {
    const result = checkBrowserOrigin({
      requestHost: "localhost:18789",
      origin: "http://localhost:18789",
      allowedHosts: ["mygateway.example.com"],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts ::1 even with allowedHosts set", () => {
    const result = checkBrowserOrigin({
      requestHost: "[::1]:18789",
      origin: "http://[::1]:18789",
      allowedHosts: ["mygateway.example.com"],
    });
    expect(result.ok).toBe(true);
  });
});

describe("isHostAllowed", () => {
  it("allows any host when no allowedHosts configured", () => {
    expect(isHostAllowed("evil.com")).toBe(true);
    expect(isHostAllowed("evil.com", [])).toBe(true);
    expect(isHostAllowed("evil.com", undefined)).toBe(true);
  });

  it("allows loopback hosts regardless of allowedHosts", () => {
    const allowed = ["safe.example.com"];
    expect(isHostAllowed("localhost", allowed)).toBe(true);
    expect(isHostAllowed("127.0.0.1", allowed)).toBe(true);
    expect(isHostAllowed("::1", allowed)).toBe(true);
    expect(isHostAllowed("127.0.0.42", allowed)).toBe(true);
  });

  it("rejects non-loopback hosts not in allowedHosts", () => {
    expect(isHostAllowed("evil.com", ["safe.example.com"])).toBe(false);
  });

  it("matches case-insensitively", () => {
    expect(isHostAllowed("MyHost.COM", ["myhost.com"])).toBe(true);
  });

  it("allows empty hostname (non-browser request)", () => {
    expect(isHostAllowed("", ["safe.example.com"])).toBe(true);
  });
});
