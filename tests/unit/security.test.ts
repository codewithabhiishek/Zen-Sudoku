import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stripTags,
  sanitizeUsername,
  isSpeedTrapTriggered,
  isHoneypotTriggered,
} from "../../src/lib/security.ts";

describe("Strix Security Defensive Controls", () => {
  it("should strip HTML and script tags from untrusted input", () => {
    assert.equal(stripTags("<script>alert(1)</script>Hello"), "Hello");
    assert.equal(stripTags("<style>body{color:red;}</style>World"), "World");
    assert.equal(stripTags("<b>Zen</b> Master"), "Zen Master");
    assert.equal(stripTags(null), "");
    assert.equal(stripTags(undefined), "");
  });

  it("should sanitize usernames, limit length, and block prototype pollution keywords", () => {
    assert.equal(sanitizeUsername("John_Doe123"), "John_Doe123");
    assert.equal(sanitizeUsername("<script>xss</script>Gamer"), "Gamer");
    assert.equal(sanitizeUsername("a".repeat(40)).length, 24);

    // Prototype pollution prevention
    assert.equal(sanitizeUsername("__proto__"), "ZenMaster");
    assert.equal(sanitizeUsername("constructor"), "ZenMaster");
    assert.equal(sanitizeUsername("prototype"), "ZenMaster");

    // Empty fallback
    assert.match(sanitizeUsername(""), /^ZenPlayer_\d+$/);
    assert.equal(sanitizeUsername("", "CustomFallback"), "CustomFallback");
  });

  it("should trigger speed trap defense on automated rapid timing", () => {
    const now = Date.now();
    // 500ms elapsed is under 1800ms threshold -> bot timing
    assert.equal(isSpeedTrapTriggered(now - 500), true);
    // 2500ms elapsed is over 1800ms threshold -> human timing
    assert.equal(isSpeedTrapTriggered(now - 2500), false);
  });

  it("should detect bot honeypots when botcheck or gotcha are filled", () => {
    assert.equal(isHoneypotTriggered(true, null), true);
    assert.equal(isHoneypotTriggered(false, "bot content"), true);
    assert.equal(isHoneypotTriggered(false, ""), false);
    assert.equal(isHoneypotTriggered(false, null), false);
  });
});
