import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import renderer, { act } from "react-test-renderer";
import { ClothingCard } from "./ClothingCard";

describe("ClothingCard", () => {
  const baseProps = {
    imageUri: "http://example.com/img.png",
    name: "卫衣",
    category: "上装",
    onPress: vi.fn(),
    onFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders image, name, category", async () => {
    const tree = renderer.create(React.createElement(ClothingCard, baseProps));
    await act(async () => {});
    const json = tree.toJSON() as any;
    const spans = collectSpans(json);
    expect(spans.some((s: any) => s.children?.includes("卫衣"))).toBe(true);
    expect(spans.some((s: any) => s.children?.includes("上装"))).toBe(true);
    const img = findByType(json, "img");
    expect(img).toBeTruthy();
  });

  it("onPress is called when card is pressed", async () => {
    const tree = renderer.create(React.createElement(ClothingCard, baseProps));
    await act(async () => {});
    const json = tree.toJSON() as any;
    json.props.onClick();
    expect(baseProps.onPress).toHaveBeenCalled();
  });

  it("onFavorite is called when heart icon is pressed", async () => {
    const tree = renderer.create(React.createElement(ClothingCard, baseProps));
    await act(async () => {});
    const json = tree.toJSON() as any;
    const innerButton = json.children?.find(
      (c: any) => c?.type === "button" && c?.props?.onClick !== json.props.onClick
    );
    expect(innerButton).toBeTruthy();
    innerButton.props.onClick();
    expect(baseProps.onFavorite).toHaveBeenCalled();
  });

  it("selected=true shows checkmark and border", async () => {
    const tree = renderer.create(React.createElement(ClothingCard, { ...baseProps, selected: true }));
    await act(async () => {});
    const json = tree.toJSON() as any;
    expect(typeof json?.props?.style).toBe("string");
    expect(json?.props?.style).toContain("borderColor");
    const checkmark = findByTestId(json, "Ionicons-checkmark");
    expect(checkmark).toBeTruthy();
  });
});

function collectSpans(node: any): any[] {
  if (!node) return [];
  if (node.type === "span") return [node];
  if (Array.isArray(node.children)) {
    return node.children.flatMap(collectSpans);
  }
  return [];
}

function findByType(node: any, type: string): any {
  if (!node) return null;
  if (node.type === type) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findByType(child, type);
      if (found) return found;
    }
  }
  return null;
}

function findByTestId(node: any, testId: string): any {
  if (!node) return null;
  if (node.props?.["data-testid"] === testId) return node;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findByTestId(child, testId);
      if (found) return found;
    }
  }
  return null;
}
