import { beforeEach, describe, expect, it } from "vitest";
import { FocusManager } from "./FocusManager";
import { ListFocusManager } from "./ListFocusManager";

describe("FocusManager.focusArea", () => {
  let fm: FocusManager<{
    area1: ListFocusManager<string>;
    area2: ListFocusManager<string>;
  }>;
  let area1: ListFocusManager<string>;
  let area2: ListFocusManager<string>;

  beforeEach(() => {
    area1 = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
      wrapAround: false,
    });

    area2 = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "x",
      wrapAround: true,
    });

    fm = new FocusManager({
      areas: { area1, area2 },
      maxHistory: 10,
    });
  });

  it("pushes a new entry when focusing a different area", () => {
    fm.focusArea("area1", "keyboard", "meta1");

    expect(fm.entry).not.toBeNull();
    expect(fm.entry?.area).toBe("area1");
    expect(fm.entry?.source).toBe("keyboard");
    expect(fm.entry?.meta).toBe("meta1");
    expect(area1.key).toBe("a"); // initial key set
  });

  it("updates source and meta when focusing the same area again", () => {
    fm.focusArea("area1", "keyboard", "meta1");
    const firstEntry = fm.entry;

    fm.focusArea("area1", "pointer", "meta2");

    expect(fm.entry).toBe(firstEntry); // same entry object
    expect(fm.entry?.source).toBe("pointer");
    expect(fm.entry?.meta).toBe("meta2");
  });

  it("creates a new entry when switching to a different area", () => {
    fm.focusArea("area1", "keyboard", "meta1");
    const firstEntry = fm.entry;

    fm.focusArea("area2", "programmatic", "metaX");

    expect(fm.entry).not.toBe(firstEntry);
    expect(fm.entry?.area).toBe("area2");
    expect(fm.entry?.meta).toBe("metaX");
    expect(area2.key).toBe("x"); // initial key set for area2
  });

  it("defaults source to 'programmatic' when not provided", () => {
    fm.focusArea("area1");

    expect(fm.entry?.source).toBe("programmatic");
  });

  it("defaults meta to null when not provided", () => {
    fm.focusArea("area1");

    expect(fm.entry?.meta).toBeNull();
  });

  it("updates manager.key each time focusArea is called", () => {
    fm.focusArea("area1");
    expect(area1.key).toBe("a");

    fm.focusArea("area2");
    expect(area2.key).toBe("x");
  });
});

describe("FocusManager.focusAreaKey", () => {
  let fm: FocusManager<{
    area1: ListFocusManager<string>;
    area2: ListFocusManager<string>;
  }>;
  let area1: ListFocusManager<string>;
  let area2: ListFocusManager<string>;

  beforeEach(() => {
    area1 = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
      wrapAround: false,
    });

    area2 = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "x",
      wrapAround: true,
    });

    fm = new FocusManager({
      areas: { area1, area2 },
      maxHistory: 10,
    });
  });

  it("pushes a new entry when focusing a different area at a specific key", () => {
    fm.focusAreaKey("area1", "b", "keyboard", "meta1");

    expect(fm.entry).not.toBeNull();
    expect(fm.entry?.area).toBe("area1");
    expect(fm.entry?.source).toBe("keyboard");
    expect(fm.entry?.meta).toBe("meta1");
    expect(area1.key).toBe("b"); // explicit key applied
  });

  it("updates source and meta when focusing the same area again", () => {
    fm.focusAreaKey("area1", "a", "keyboard", "meta1");
    const firstEntry = fm.entry;

    fm.focusAreaKey("area1", "c", "pointer", "meta2");

    expect(fm.entry).toBe(firstEntry); // same entry object
    expect(fm.entry?.source).toBe("pointer");
    expect(fm.entry?.meta).toBe("meta2");
    expect(area1.key).toBe("c"); // updated key applied
  });

  it("creates a new entry when switching to a different area", () => {
    fm.focusAreaKey("area1", "a", "keyboard", "meta1");
    const firstEntry = fm.entry;

    fm.focusAreaKey("area2", "z", "programmatic", "metaX");

    expect(fm.entry).not.toBe(firstEntry);
    expect(fm.entry?.area).toBe("area2");
    expect(fm.entry?.meta).toBe("metaX");
    expect(area2.key).toBe("z"); // explicit key applied for area2
  });

  it("defaults source to 'programmatic' when not provided", () => {
    fm.focusAreaKey("area1", "b");

    expect(fm.entry?.source).toBe("programmatic");
  });

  it("defaults meta to null when not provided", () => {
    fm.focusAreaKey("area1", "b");

    expect(fm.entry?.meta).toBeNull();
  });

  it("updates manager.key each time focusAreaKey is called", () => {
    fm.focusAreaKey("area1", "c");
    expect(area1.key).toBe("c");

    fm.focusAreaKey("area2", "y");
    expect(area2.key).toBe("y");
  });
});

describe("FocusManager.go", () => {
  let fm: FocusManager<{
    area1: ListFocusManager<string>;
    area2: ListFocusManager<string>;
    area3: ListFocusManager<string>;
  }>;
  let area1: ListFocusManager<string>;
  let area2: ListFocusManager<string>;
  let area3: ListFocusManager<string>;

  beforeEach(() => {
    area1 = new ListFocusManager<string>({
      getKeys: () => ["a", "b"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
    });

    area2 = new ListFocusManager<string>({
      getKeys: () => ["x", "y"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "x",
    });

    area3 = new ListFocusManager<string>({
      getKeys: () => ["m", "n"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "m",
    });

    fm = new FocusManager({
      areas: { area1, area2, area3 },
      maxHistory: 10,
    });

    // Build up a stack of entries
    fm.focusArea("area1");
    fm.focusArea("area2");
    fm.focusArea("area3");
  });

  it("moves backward in history with negative delta", () => {
    expect(fm.entry?.area).toBe("area3");

    fm.go(-1);
    expect(fm.entry?.area).toBe("area2");

    fm.go(-1);
    expect(fm.entry?.area).toBe("area1");
  });

  it("moves forward in history with positive delta", () => {
    fm.go(-2); // move back to area1
    expect(fm.entry?.area).toBe("area1");

    fm.go(+1);
    expect(fm.entry?.area).toBe("area2");

    fm.go(+1);
    expect(fm.entry?.area).toBe("area3");
  });

  it("ignores moves that go out of bounds", () => {
    expect(fm.entry?.area).toBe("area3");

    fm.go(+1); // beyond end
    expect(fm.entry?.area).toBe("area3"); // unchanged

    fm.go(-3); // before start
    expect(fm.entry?.area).toBe("area3"); // unchanged
  });

  it("does not change index when stack has only one entry", () => {
    const singleFm = new FocusManager({
      areas: { area1 },
      maxHistory: 10,
    });
    singleFm.focusArea("area1");

    expect(singleFm.entry?.area).toBe("area1");

    singleFm.go(-1);
    expect(singleFm.entry?.area).toBe("area1");

    singleFm.go(+1);
    expect(singleFm.entry?.area).toBe("area1");
  });
});

describe("FocusManager.focusOnArrowUp", () => {
  let fm: FocusManager<{
    vertical: ListFocusManager<string>;
    horizontal: ListFocusManager<string>;
  }>;
  let vertical: ListFocusManager<string>;
  let horizontal: ListFocusManager<string>;

  beforeEach(() => {
    vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "b",
    });

    horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "y",
    });

    fm = new FocusManager({
      areas: { vertical, horizontal },
      maxHistory: 10,
    });
  });

  it("does nothing when there is no active entry", () => {
    // no focusArea called yet
    fm.focusOnArrowUp();
    expect(fm.entry).toBeNull();
  });

  it("does nothing when active area orientation is horizontal", () => {
    fm.focusArea("horizontal");
    const initialKey = horizontal.key;

    fm.focusOnArrowUp();

    // key unchanged
    expect(horizontal.key).toBe(initialKey);
    // source unchanged (still programmatic)
    expect(fm.entry?.source).toBe("programmatic");
  });

  it("moves focus upward in a vertical list", () => {
    fm.focusArea("vertical");
    expect(vertical.key).toBe("b"); // initial key

    fm.focusOnArrowUp();

    // should move from "b" to "a"
    expect(vertical.key).toBe("a");
    // source updated to keyboard
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("wraps correctly if wrapAround is true", () => {
    const wrapVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
      wrapAround: true,
    });

    const fm2 = new FocusManager({
      areas: { wrapVertical },
      maxHistory: 10,
    });

    fm2.focusArea("wrapVertical");
    expect(wrapVertical.key).toBe("a");

    fm2.focusOnArrowUp();

    // should wrap from "a" to "c"
    expect(wrapVertical.key).toBe("c");
    expect(fm2.entry?.source).toBe("keyboard");
  });

  it("does not move past the first key when wrapAround is false", () => {
    const noWrapVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
      wrapAround: false,
    });

    const fm3 = new FocusManager({
      areas: { noWrapVertical },
      maxHistory: 10,
    });

    fm3.focusArea("noWrapVertical");
    expect(noWrapVertical.key).toBe("a");

    fm3.focusOnArrowUp();

    // still "a", clamped at start
    expect(noWrapVertical.key).toBe("a");
    expect(fm3.entry?.source).toBe("keyboard");
  });
});

describe("FocusManager.focusOnArrowDown", () => {
  let fm: FocusManager<{
    vertical: ListFocusManager<string>;
    horizontal: ListFocusManager<string>;
  }>;
  let vertical: ListFocusManager<string>;
  let horizontal: ListFocusManager<string>;

  beforeEach(() => {
    vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "b",
    });

    horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "y",
    });

    fm = new FocusManager({
      areas: { vertical, horizontal },
      maxHistory: 10,
    });
  });

  it("does nothing when there is no active entry", () => {
    fm.focusOnArrowDown();
    expect(fm.entry).toBeNull();
  });

  it("does nothing when active area orientation is horizontal", () => {
    fm.focusArea("horizontal");
    const initialKey = horizontal.key;

    fm.focusOnArrowDown();

    expect(horizontal.key).toBe(initialKey); // unchanged
    expect(fm.entry?.source).toBe("programmatic"); // still default
  });

  it("moves focus downward in a vertical list", () => {
    fm.focusArea("vertical");
    expect(vertical.key).toBe("b"); // initial key

    fm.focusOnArrowDown();

    expect(vertical.key).toBe("c"); // moved down from "b" to "c"
    expect(fm.entry?.source).toBe("keyboard"); // source updated
  });

  it("wraps correctly if wrapAround is true", () => {
    const wrapVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "c",
      wrapAround: true,
    });

    const fm2 = new FocusManager({
      areas: { wrapVertical },
      maxHistory: 10,
    });

    fm2.focusArea("wrapVertical");
    expect(wrapVertical.key).toBe("c");

    fm2.focusOnArrowDown();

    expect(wrapVertical.key).toBe("a"); // wrapped from "c" to "a"
    expect(fm2.entry?.source).toBe("keyboard");
  });

  it("does not move past the last key when wrapAround is false", () => {
    const noWrapVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "c",
      wrapAround: false,
    });

    const fm3 = new FocusManager({
      areas: { noWrapVertical },
      maxHistory: 10,
    });

    fm3.focusArea("noWrapVertical");
    expect(noWrapVertical.key).toBe("c");

    fm3.focusOnArrowDown();

    expect(noWrapVertical.key).toBe("c"); // still "c", clamped at end
    expect(fm3.entry?.source).toBe("keyboard");
  });
});

describe("FocusManager.focusOnArrowLeft", () => {
  let fm: FocusManager<{
    vertical: ListFocusManager<string>;
    horizontal: ListFocusManager<string>;
  }>;
  let vertical: ListFocusManager<string>;
  let horizontal: ListFocusManager<string>;

  beforeEach(() => {
    vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "b",
    });

    horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "y",
    });

    fm = new FocusManager({
      areas: { vertical, horizontal },
      maxHistory: 10,
    });
  });

  it("does nothing when there is no active entry", () => {
    fm.focusOnArrowLeft();
    expect(fm.entry).toBeNull();
  });

  it("does nothing when active area orientation is vertical", () => {
    fm.focusArea("vertical");
    const initialKey = vertical.key;

    fm.focusOnArrowLeft();

    expect(vertical.key).toBe(initialKey); // unchanged
    expect(fm.entry?.source).toBe("programmatic"); // still default
  });

  it("moves focus leftward in a horizontal list", () => {
    fm.focusArea("horizontal");
    expect(horizontal.key).toBe("y"); // initial key

    fm.focusOnArrowLeft();

    expect(horizontal.key).toBe("x"); // moved left from "y" to "x"
    expect(fm.entry?.source).toBe("keyboard"); // source updated
  });

  it("wraps correctly if wrapAround is true", () => {
    const wrapHorizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "x",
      wrapAround: true,
    });

    const fm2 = new FocusManager({
      areas: { wrapHorizontal },
      maxHistory: 10,
    });

    fm2.focusArea("wrapHorizontal");
    expect(wrapHorizontal.key).toBe("x");

    fm2.focusOnArrowLeft();

    expect(wrapHorizontal.key).toBe("z"); // wrapped from "x" to "z"
    expect(fm2.entry?.source).toBe("keyboard");
  });

  it("does not move past the first key when wrapAround is false", () => {
    const noWrapHorizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "x",
      wrapAround: false,
    });

    const fm3 = new FocusManager({
      areas: { noWrapHorizontal },
      maxHistory: 10,
    });

    fm3.focusArea("noWrapHorizontal");
    expect(noWrapHorizontal.key).toBe("x");

    fm3.focusOnArrowLeft();

    expect(noWrapHorizontal.key).toBe("x"); // still "x", clamped at start
    expect(fm3.entry?.source).toBe("keyboard");
  });
});

describe("FocusManager arrow navigation without wrapAround", () => {
  it("does not move past the first key when wrapAround is false", () => {
    const vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
      wrapAround: false,
    });

    const fm = new FocusManager({ areas: { vertical } });

    fm.focusArea("vertical");
    expect(vertical.key).toBe("a");

    fm.focusOnArrowUp(); // try to move above "a"
    expect(vertical.key).toBe("a"); // still "a"
  });

  it("does not move past the last key when wrapAround is false", () => {
    const vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "c",
      wrapAround: false,
    });

    const fm = new FocusManager({ areas: { vertical } });

    fm.focusArea("vertical");
    expect(vertical.key).toBe("c");

    fm.focusOnArrowDown(); // try to move below "c"
    expect(vertical.key).toBe("c"); // still "c"
  });

  it("does not move past the first/last key in horizontal orientation when wrapAround is false", () => {
    const horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "x",
      wrapAround: false,
    });

    const fm = new FocusManager({ areas: { horizontal } });

    fm.focusArea("horizontal");
    expect(horizontal.key).toBe("x");

    fm.focusOnArrowLeft(); // try to move left of "x"
    expect(horizontal.key).toBe("x"); // still "x"

    fm.focusAreaKey("horizontal", "z");
    fm.focusOnArrowRight(); // try to move right of "z"
    expect(horizontal.key).toBe("z"); // still "z"
  });
});

describe("FocusManager.focusOnPageUp", () => {
  let fm: FocusManager<{
    vertical: ListFocusManager<string>;
    horizontal: ListFocusManager<string>;
  }>;
  let vertical: ListFocusManager<string>;
  let horizontal: ListFocusManager<string>;

  beforeEach(() => {
    vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c", "d", "e"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "c",
      wrapAround: false,
      // simulate viewport showing b–d
      getFirstVisibleIndex: () => 1,
      getLastVisibleIndex: () => 3,
    });

    horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "y",
      wrapAround: false,
      getFirstVisibleIndex: () => 0,
      getLastVisibleIndex: () => 2,
    });

    fm = new FocusManager({
      areas: { vertical, horizontal },
      maxHistory: 10,
    });
  });

  it("does nothing when there is no active entry", () => {
    fm.focusOnPageUp();
    expect(fm.entry).toBeNull();
  });

  it("does nothing when active area orientation is horizontal", () => {
    fm.focusArea("horizontal");
    const initialKey = horizontal.key;

    fm.focusOnPageUp();

    expect(horizontal.key).toBe(initialKey); // unchanged
    expect(fm.entry?.source).toBe("programmatic"); // still default
  });

  it("jumps to the first visible item if not already there", () => {
    fm.focusArea("vertical");
    expect(vertical.key).toBe("c"); // initial key

    fm.focusOnPageUp();

    // currentIndex=2, firstVisible=1 → should jump to "b"
    expect(vertical.key).toBe("b");
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("moves one page up when already at the first visible item", () => {
    fm.focusAreaKey("vertical", "b"); // focus at firstVisible
    expect(vertical.key).toBe("b");

    fm.focusOnPageUp();

    // visibleCount = 3, firstVisible=1 → target = max(0, 1-3+1) = 0 → "a"
    expect(vertical.key).toBe("a");
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("clamps at the start when moving beyond the first key", () => {
    const shortVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
      wrapAround: true, // ignored for page focus
      getFirstVisibleIndex: () => 0,
      getLastVisibleIndex: () => 1,
    });

    const fm2 = new FocusManager({
      areas: { shortVertical },
      maxHistory: 10,
    });

    fm2.focusArea("shortVertical");
    expect(shortVertical.key).toBe("a");

    fm2.focusOnPageUp();

    // already at firstVisible=0 → clamp at "a"
    expect(shortVertical.key).toBe("a");
    expect(fm2.entry?.source).toBe("keyboard");
  });
});

describe("FocusManager.focusOnPageDown", () => {
  let fm: FocusManager<{
    vertical: ListFocusManager<string>;
    horizontal: ListFocusManager<string>;
  }>;
  let vertical: ListFocusManager<string>;
  let horizontal: ListFocusManager<string>;

  beforeEach(() => {
    vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c", "d", "e"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "b",
      wrapAround: false,
      // simulate viewport showing b–d
      getFirstVisibleIndex: () => 1,
      getLastVisibleIndex: () => 3,
    });

    horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "y",
      wrapAround: false,
      getFirstVisibleIndex: () => 0,
      getLastVisibleIndex: () => 2,
    });

    fm = new FocusManager({
      areas: { vertical, horizontal },
      maxHistory: 10,
    });
  });

  it("does nothing when there is no active entry", () => {
    fm.focusOnPageDown();
    expect(fm.entry).toBeNull();
  });

  it("does nothing when active area orientation is horizontal", () => {
    fm.focusArea("horizontal");
    const initialKey = horizontal.key;

    fm.focusOnPageDown();

    expect(horizontal.key).toBe(initialKey); // unchanged
    expect(fm.entry?.source).toBe("programmatic"); // still default
  });

  it("jumps to the last visible item if not already there", () => {
    fm.focusArea("vertical");
    expect(vertical.key).toBe("b"); // initial key

    fm.focusOnPageDown();

    // currentIndex=1, lastVisible=3 → should jump to "d"
    expect(vertical.key).toBe("d");
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("moves one page down when already at the last visible item", () => {
    fm.focusAreaKey("vertical", "d"); // focus at lastVisible
    expect(vertical.key).toBe("d");

    fm.focusOnPageDown();

    // visibleCount = 3, lastVisible=3 → target = min(4, 3+3-1) = 4 → "e"
    expect(vertical.key).toBe("e");
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("clamps at the end when moving beyond the last key", () => {
    const shortVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "c",
      wrapAround: true, // ignored for page focus
      getFirstVisibleIndex: () => 1,
      getLastVisibleIndex: () => 2,
    });

    const fm2 = new FocusManager({
      areas: { shortVertical },
      maxHistory: 10,
    });

    fm2.focusArea("shortVertical");
    expect(shortVertical.key).toBe("c");

    fm2.focusOnPageDown();

    // already at lastVisible=2 → clamp at "c"
    expect(shortVertical.key).toBe("c");
    expect(fm2.entry?.source).toBe("keyboard");
  });
});

describe("FocusManager.focusOnHome", () => {
  let fm: FocusManager<{
    vertical: ListFocusManager<string>;
    horizontal: ListFocusManager<string>;
  }>;
  let vertical: ListFocusManager<string>;
  let horizontal: ListFocusManager<string>;

  beforeEach(() => {
    vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c", "d"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "c",
      wrapAround: false,
    });

    horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "y",
      wrapAround: false,
    });

    fm = new FocusManager({
      areas: { vertical, horizontal },
      maxHistory: 10,
    });
  });

  it("does nothing when there is no active entry", () => {
    fm.focusOnHome();
    expect(fm.entry).toBeNull();
  });

  it("moves focus to the first item in a vertical list", () => {
    fm.focusArea("vertical");
    expect(vertical.key).toBe("c"); // initial key

    fm.focusOnHome();

    expect(vertical.key).toBe("a"); // moved to first item
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("moves focus to the first item in a horizontal list", () => {
    fm.focusArea("horizontal");
    expect(horizontal.key).toBe("y"); // initial key

    fm.focusOnHome();

    expect(horizontal.key).toBe("x"); // moved to first item
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("does not move if already at the first item", () => {
    const noWrapVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
      wrapAround: false,
    });

    const fm2 = new FocusManager({
      areas: { noWrapVertical },
      maxHistory: 10,
    });

    fm2.focusArea("noWrapVertical");
    expect(noWrapVertical.key).toBe("a");

    fm2.focusOnHome();

    expect(noWrapVertical.key).toBe("a"); // still "a"
    expect(fm2.entry?.source).toBe("keyboard");
  });
});

describe("FocusManager.focusOnEnd", () => {
  let fm: FocusManager<{
    vertical: ListFocusManager<string>;
    horizontal: ListFocusManager<string>;
  }>;
  let vertical: ListFocusManager<string>;
  let horizontal: ListFocusManager<string>;

  beforeEach(() => {
    vertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c", "d"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "b",
      wrapAround: false,
    });

    horizontal = new ListFocusManager<string>({
      getKeys: () => ["x", "y", "z"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "y",
      wrapAround: false,
    });

    fm = new FocusManager({
      areas: { vertical, horizontal },
      maxHistory: 10,
    });
  });

  it("does nothing when there is no active entry", () => {
    fm.focusOnEnd();
    expect(fm.entry).toBeNull();
  });

  it("moves focus to the last item in a vertical list", () => {
    fm.focusArea("vertical");
    expect(vertical.key).toBe("b"); // initial key

    fm.focusOnEnd();

    expect(vertical.key).toBe("d"); // moved to last item
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("moves focus to the last item in a horizontal list", () => {
    fm.focusArea("horizontal");
    expect(horizontal.key).toBe("y"); // initial key

    fm.focusOnEnd();

    expect(horizontal.key).toBe("z"); // moved to last item
    expect(fm.entry?.source).toBe("keyboard");
  });

  it("does not move if already at the last item", () => {
    const noWrapVertical = new ListFocusManager<string>({
      getKeys: () => ["a", "b", "c"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "c",
      wrapAround: false,
    });

    const fm2 = new FocusManager({
      areas: { noWrapVertical },
      maxHistory: 10,
    });

    fm2.focusArea("noWrapVertical");
    expect(noWrapVertical.key).toBe("c");

    fm2.focusOnEnd();

    expect(noWrapVertical.key).toBe("c"); // still "c"
    expect(fm2.entry?.source).toBe("keyboard");
  });
});

describe("FocusManager.clear", () => {
  let fm: FocusManager<{
    area1: ListFocusManager<string>;
    area2: ListFocusManager<string>;
  }>;
  let area1: ListFocusManager<string>;
  let area2: ListFocusManager<string>;

  beforeEach(() => {
    area1 = new ListFocusManager<string>({
      getKeys: () => ["a", "b"],
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => "a",
    });

    area2 = new ListFocusManager<string>({
      getKeys: () => ["x", "y"],
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "x",
    });

    fm = new FocusManager({
      areas: { area1, area2 },
      maxHistory: 10,
    });
  });

  it("empties the stack and resets the index", () => {
    fm.focusArea("area1");
    fm.focusArea("area2");

    expect(fm.entry?.area).toBe("area2");
    expect(fm["_stack"].length).toBe(2);
    expect(fm["_index"]).toBe(1);

    fm.clear();

    expect(fm["_stack"].length).toBe(0);
    expect(fm["_index"]).toBe(-1);
    expect(fm.entry).toBeNull();
  });

  it("allows new focus entries after clearing", () => {
    fm.focusArea("area1");
    fm.clear();

    fm.focusArea("area2");

    expect(fm.entry?.area).toBe("area2");
    expect(fm["_stack"].length).toBe(1);
    expect(fm["_index"]).toBe(0);
  });

  it("is idempotent when called multiple times", () => {
    fm.focusArea("area1");
    fm.clear();
    fm.clear(); // second call should not throw or change anything

    expect(fm["_stack"].length).toBe(0);
    expect(fm["_index"]).toBe(-1);
    expect(fm.entry).toBeNull();
  });
});
