import { describe, it, expect } from "vitest";
import { generateInitialLayout } from "./CollageCanvas.logic";

describe("generateInitialLayout", () => {
  it("3 items without initialLayout generate spiral positions", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const layout = generateInitialLayout(items);
    expect(Object.keys(layout)).toEqual(["a", "b", "c"]);
    expect(layout.a.zIndex).toBe(0);
    expect(layout.b.zIndex).toBe(1);
    expect(layout.c.zIndex).toBe(2);
    expect(layout.a.scale).toBe(1);
    expect(typeof layout.a.x).toBe("number");
    expect(typeof layout.a.y).toBe("number");
  });

  it("adding items preserves existing layout and adds new ones", () => {
    const prev = {
      a: { clothingId: "a", x: 10, y: 20, scale: 1.5, zIndex: 5 },
    };
    const items = [{ id: "a" }, { id: "b" }];
    const layout = generateInitialLayout(items, undefined, prev);
    expect(layout.a.x).toBe(10);
    expect(layout.a.y).toBe(20);
    expect(layout.a.scale).toBe(1.5);
    expect(layout.b).toBeDefined();
    expect(layout.b.zIndex).toBe(7); // maxZ(5) + 1 + idx(1)
  });

  it("removing items deletes them from layout map", () => {
    const prev = {
      a: { clothingId: "a", x: 0, y: 0, scale: 1, zIndex: 0 },
      b: { clothingId: "b", x: 0, y: 0, scale: 1, zIndex: 1 },
    };
    const items = [{ id: "a" }];
    const layout = generateInitialLayout(items, undefined, prev);
    expect(layout.a).toBeDefined();
    expect(layout.b).toBeUndefined();
  });
});
