import { describe, expect, it } from "vitest";
import { parseVkVideoUrl, isValidVkVideoUrl } from "@/lib/vkVideo";

describe("parseVkVideoUrl", () => {
  it("parses classic vk.com/video path", () => {
    const p = parseVkVideoUrl("https://vk.com/video-123456_789012");
    expect(p).not.toBeNull();
    expect(p!.oid).toBe("-123456");
    expect(p!.id).toBe("789012");
    expect(p!.embedUrl).toContain("oid=-123456");
    expect(p!.embedUrl).toContain("id=789012");
  });

  it("parses z=video query", () => {
    const p = parseVkVideoUrl(
      "https://vk.com/wall-1_1?z=video-999_111",
    );
    expect(p?.oid).toBe("-999");
    expect(p?.id).toBe("111");
  });

  it("rejects garbage", () => {
    expect(isValidVkVideoUrl("https://youtube.com/watch?v=1")).toBe(false);
    expect(parseVkVideoUrl("hello")).toBeNull();
  });
});
