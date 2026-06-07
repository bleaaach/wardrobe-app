import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import renderer, { act } from "react-test-renderer";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders icon, title", async () => {
    const tree = renderer.create(React.createElement(EmptyState, { icon: "shirt-outline", title: "无衣物" }));
    await act(async () => {});
    const json = tree.toJSON() as any;
    const spans = collectSpans(json);
    expect(spans.some((s: any) => s.children?.includes("无衣物"))).toBe(true);
  });

  it("renders subtitle when provided", async () => {
    const tree = renderer.create(React.createElement(EmptyState, { icon: "shirt-outline", title: "无衣物", subtitle: "快去添加吧" }));
    await act(async () => {});
    const json = tree.toJSON() as any;
    const spans = collectSpans(json);
    expect(spans.some((s: any) => s.children?.includes("快去添加吧"))).toBe(true);
  });

  it("renders action button when provided", async () => {
    const onPress = vi.fn();
    const tree = renderer.create(React.createElement(EmptyState, { icon: "shirt-outline", title: "无衣物", action: { label: "添加", onPress } }));
    await act(async () => {});
    const json = tree.toJSON() as any;
    const buttons = collectButtons(json);
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.some((b: any) => collectSpans(b).some((s: any) => s.children?.includes("添加")))).toBe(true);
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

function collectButtons(node: any): any[] {
  if (!node) return [];
  if (node.type === "button") return [node];
  if (Array.isArray(node.children)) {
    return node.children.flatMap(collectButtons);
  }
  return [];
}
