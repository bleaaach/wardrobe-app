import { describe, it, expect } from "vitest";
import * as React from "react";
import renderer, { act } from "react-test-renderer";
import { OutfitPreview } from "./OutfitPreview";
import { Clothing } from "../types";

function makeItem(id: string, imageUri: string): Clothing {
  return {
    id,
    imageUri,
    categoryId: "c1",
    name: "item",
    brand: "",
    color: "",
    season: "",
    location: "",
    clothingSize: "",
    shoeSize: "",
    price: "",
    purchaseLink: "",
    tags: "[]",
    wearCount: 0,
    notes: "",
    favorite: 0,
    createdAt: "",
    updatedAt: "",
    deleted: 0,
  };
}

describe("OutfitPreview", () => {
  it("0 items renders empty dot", async () => {
    const tree = renderer.create(React.createElement(OutfitPreview, { items: [] }));
    await act(async () => {});
    const json = tree.toJSON() as any;
    expect(json?.type).toBe("div");
    const innerDiv = json.children?.find((c: any) => c?.type === "div");
    expect(innerDiv).toBeTruthy();
  });

  it("1 item renders single image", async () => {
    const tree = renderer.create(React.createElement(OutfitPreview, { items: [makeItem("1", "http://a.com/1.png")] }));
    await act(async () => {});
    const json = tree.toJSON() as any;
    const images = collectImages(json);
    expect(images.length).toBe(1);
  });

  it("2 items renders side-by-side", async () => {
    const tree = renderer.create(
      React.createElement(OutfitPreview, { items: [makeItem("1", "http://a.com/1.png"), makeItem("2", "http://a.com/2.png")] })
    );
    await act(async () => {});
    const json = tree.toJSON() as any;
    const images = collectImages(json);
    expect(images.length).toBe(2);
    expect(typeof json?.props?.style).toBe("string");
    expect(json?.props?.style).toContain("flexDirection");
  });

  it("3 items renders split layout", async () => {
    const tree = renderer.create(
      React.createElement(OutfitPreview, {
        items: [
          makeItem("1", "http://a.com/1.png"),
          makeItem("2", "http://a.com/2.png"),
          makeItem("3", "http://a.com/3.png"),
        ],
      })
    );
    await act(async () => {});
    const json = tree.toJSON() as any;
    const images = collectImages(json);
    expect(images.length).toBe(3);
  });

  it("4+ items renders 2x2 grid", async () => {
    const tree = renderer.create(
      React.createElement(OutfitPreview, {
        items: [
          makeItem("1", "http://a.com/1.png"),
          makeItem("2", "http://a.com/2.png"),
          makeItem("3", "http://a.com/3.png"),
          makeItem("4", "http://a.com/4.png"),
        ],
      })
    );
    await act(async () => {});
    const json = tree.toJSON() as any;
    const images = collectImages(json);
    expect(images.length).toBe(4);
    expect(typeof json?.props?.style).toBe("string");
    expect(json?.props?.style).toContain("flexWrap");
  });

  it("size prop is applied", async () => {
    const tree = renderer.create(React.createElement(OutfitPreview, { items: [], size: 200 }));
    await act(async () => {});
    const json = tree.toJSON() as any;
    expect(typeof json?.props?.style).toBe("string");
    expect(json?.props?.style).toContain("200");
  });
});

function collectImages(node: any): any[] {
  if (!node) return [];
  if (node.type === "img") return [node];
  if (Array.isArray(node.children)) {
    return node.children.flatMap(collectImages);
  }
  return [];
}
