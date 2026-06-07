import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import renderer, { act } from "react-test-renderer";
import { AsyncImage } from "./AsyncImage";
import { getImageUrl } from "../utils/imageStorage";

vi.mock("../utils/imageStorage", () => ({
  getImageUrl: vi.fn(),
}));

describe("AsyncImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("placeholder uri renders without calling getImageUrl", async () => {
    renderer.create(React.createElement(AsyncImage, { uri: "placeholder" }));
    expect(getImageUrl).not.toHaveBeenCalled();
  });

  it("idx:// uri calls getImageUrl and renders Image on success", async () => {
    vi.mocked(getImageUrl).mockResolvedValue("http://example.com/img.png");
    const tree = renderer.create(React.createElement(AsyncImage, { uri: "idx://123" }));

    await act(async () => {
      await Promise.resolve();
    });

    const json = tree.toJSON() as any;
    expect(getImageUrl).toHaveBeenCalledWith("123");
    expect(json?.type).toBe("img");
    expect(json?.props?.src).toBe("http://example.com/img.png");
  });

  it("http:// uri directly sets src", async () => {
    const tree = renderer.create(React.createElement(AsyncImage, { uri: "http://example.com/img.png" }));

    await act(async () => {
      await Promise.resolve();
    });

    const json = tree.toJSON() as any;
    expect(json?.type).toBe("img");
    expect(json?.props?.src).toBe("http://example.com/img.png");
    expect(getImageUrl).not.toHaveBeenCalled();
  });

  it("load failure shows error text with retry button", async () => {
    vi.mocked(getImageUrl).mockResolvedValue(null);
    const tree = renderer.create(React.createElement(AsyncImage, { uri: "idx://missing" }));

    await act(async () => {
      await Promise.resolve();
    });

    const json = tree.toJSON() as any;
    expect(json?.type).toBe("button");
    const textNode = json?.children?.find((c: any) => c?.type === "span");
    expect(textNode?.children?.[0]).toBe("加载失败");
  });

  it("retry triggers reload", async () => {
    vi.mocked(getImageUrl).mockResolvedValue(null);
    const tree = renderer.create(React.createElement(AsyncImage, { uri: "idx://missing" }));

    await act(async () => {
      await Promise.resolve();
    });

    const json = tree.toJSON() as any;
    json.props.onClick();

    await act(async () => {
      await Promise.resolve();
    });

    expect(getImageUrl).toHaveBeenCalledTimes(2);
  });
});
