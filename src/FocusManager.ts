import { ListFocusManager } from "./ListFocusManager";
import type {
  FocusAreaEntry,
  FocusKey,
  FocusManagerProps,
  FocusSource,
  MetaFromAreaFocusManager,
} from "./types";

/**
 * FocusManager is responsible for coordinating focus across multiple named areas,
 * each managed by its own area focus manager. It maintains a history stack of area
 * entries to support back/forward navigation between focus contexts.
 *
 * @template T A record mapping area identifiers to their corresponding area focus manager instances.
 */
export class FocusManager<T extends Record<string, ListFocusManager>> {
  /**
   * Creates a new FocusManager.
   *
   * @param props Configuration options for the FocusManager.
   * - `areas`: A mapping of all focusable areas, each with its own area focus manager.
   * - `maxHistory`: Optional cap on the number of focus area entries stored in the
   *   history stack. Defaults to 20 if not provided.
   *
   * The constructor initializes the internal areas registry and sets up the
   * history stack with the specified maximum size.
   */
  constructor(props: FocusManagerProps<T>) {
    this._areas = props.areas;
    this._maxHistory = props.maxHistory ?? 20;

    for (const area of Object.values(this._areas)) {
      area.parent = this;
    }
  }

  protected _areas;
  protected _maxHistory;

  protected _stack: FocusAreaEntry<T>[] = [];
  protected _index = -1;

  /**
   * Returns the mapping of all focusable areas managed by this FocusManager.
   * Each entry in the record corresponds to a named area and its associated
   * ListFocusManager instance.
   */
  get areas() {
    return this._areas;
  }

  /**
   * Returns the currently active focus area entry from the history stack.
   *
   * - If the stack is empty or the index is out of bounds, this returns `null`.
   * - Otherwise, it returns the FocusAreaEntry at the current index, which
   *   contains the area's key, manager, and source metadata.
   */
  get entry(): FocusAreaEntry<T> | null {
    return this._stack[this._index] ?? null;
  }

  /**
   * Returns the previous focus area in the history stack
   * without changing the current active index.
   *
   * @returns {FocusAreaEntry<T> | null} The previous focus area, or null if none exists.
   */
  getPreviousEntry(): FocusAreaEntry<T> | null {
    return this.getEntryAt(-1);
  }

  /**
   * Returns the focus area at the given delta relative to the current index,
   * without changing the active index.
   *
   * For example:
   * - delta = -1 → previous area
   * - delta = +1 → next area
   *
   * If the target index is out of bounds, this returns null.
   *
   * @param {number} delta Offset from the current index.
   * @returns {FocusAreaEntry<T> | null} The focus area at that offset, or null if none exists.
   */
  getEntryAt(delta: number): FocusAreaEntry<T> | null {
    const targetIndex = this._index + delta;
    if (targetIndex < 0 || targetIndex > this._stack.length - 1) return null;
    return this._stack[targetIndex] ?? null;
  }

  /**
   * Moves focus into the specified area and updates the history stack.
   *
   * Behavior:
   * - The target area's `meta` field is set to the provided metadata (or `null` if none).
   * - The target area's `key` field is initialized using `getInitialKeyOnAreaFocus()`,
   *   ensuring the area starts with a valid focusable item.
   * - If the requested area is already the current one, only the `source` field
   *   of the existing entry is updated (no new history entry is pushed).
   * - If the requested area is different, a new entry is pushed onto the history
   *   stack with its associated manager, key, meta, and source.
   *
   * @template K The key type of the target area.
   * @param area The identifier of the area to focus.
   * @param source The origin of the focus change (e.g. "keyboard", "pointer", "programmatic").
   *               Defaults to "programmatic".
   * @param meta Optional metadata to associate with the area’s focus manager.
   */
  focusArea<K extends keyof T>(
    area: K,
    source: FocusSource = "programmatic",
    meta?: MetaFromAreaFocusManager<T[K]>
  ) {
    const manager = this._areas[area];

    if (this.entry?.area === area) {
      this.entry.source = source;
      this.entry.meta = meta ?? this.entry.meta;
    }
    //
    else {
      this.push({
        area: area,
        source,
        meta: meta ?? null,
        manager,
      });
    }

    manager.key = manager.getInitialKeyOnAreaFocus();
  }

  /**
   * Moves focus into the specified area at a specific key, and updates the history stack.
   *
   * Behavior:
   * - The target area's `key` field is explicitly set to the provided `key`,
   *   ensuring focus starts at the requested item rather than the default initial key.
   * - The target area's `meta` field is set to the provided metadata (or `null` if none).
   * - If the requested area is already the current one, only the `source` field
   *   of the existing entry is updated (no new history entry is pushed).
   * - If the requested area is different, a new entry is pushed onto the history
   *   stack with its associated manager, key, meta, and source.
   *
   * @template K The key type of the target area.
   * @param area The identifier of the area to focus.
   * @param key The specific focus key within the area to activate.
   * @param source The origin of the focus change (e.g. "keyboard", "pointer", "programmatic").
   *               Defaults to "programmatic".
   * @param meta Optional metadata to associate with the area’s focus manager.
   */
  focusAreaKey<K extends keyof T>(
    area: K,
    key: FocusKey,
    source: FocusSource = "programmatic",
    meta?: MetaFromAreaFocusManager<T[K]>
  ) {
    const manager = this._areas[area];

    manager.key = key;

    if (this.entry?.area === area) {
      this.entry.source = source;
      this.entry.meta = meta ?? this.entry.meta;
    }
    //
    else {
      this.push({
        area: area,
        source,
        meta: meta ?? null,
        manager,
      });
    }
  }

  protected push(area: FocusAreaEntry<T>) {
    this._stack = [...this._stack.slice(0, this._index + 1), area];
    this._index++;

    if (this._stack.length > this._maxHistory) {
      const overflow = this._stack.length - this._maxHistory;
      this._stack = this._stack.slice(overflow);
      this._index -= overflow;
    }
  }

  /**
   * Moves focus back to the previous area in the history stack.
   *
   * This is a convenience method that delegates to `go(-1)`.
   * If there is no previous entry (already at the beginning of the stack),
   * the active index remains unchanged.
   */
  goBack() {
    this.go(-1);
  }

  /**
   * Moves focus within the history stack by the given delta.
   *
   * - A negative delta (e.g. -1) moves backward in history.
   * - A positive delta (e.g. +1) moves forward in history.
   * - If the computed index is out of bounds, the operation is ignored.
   *
   * @param delta The offset to apply to the current active index.
   *              For example, -1 = previous area, +1 = next area.
   */
  go(delta: number) {
    const newActiveIndex = this._index + delta;

    if (newActiveIndex < 0 || newActiveIndex > this._stack.length - 1) return;

    this._index = newActiveIndex;
  }

  /**
   * Handles an "ArrowUp" keyboard action by moving focus upward
   * within the currently active area, if that area supports vertical navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is queried for its orientation.
   * - If the orientation is horizontal, no action is taken since ArrowUp
   *   is not meaningful in that context.
   * - Otherwise, the area's manager is instructed to move focus upward
   *   (via `focusOnArrow(-1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnArrowUp() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      const orientation = areaManager.orientation;

      if (orientation === "horizontal") {
        return;
      }

      areaManager.focusOnArrow(-1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Handles an "ArrowDown" keyboard action by moving focus downward
   * within the currently active area, if that area supports vertical navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is queried for its orientation.
   * - If the orientation is horizontal, no action is taken since ArrowDown
   *   is not meaningful in that context.
   * - Otherwise, the area's manager is instructed to move focus downward
   *   (via `focusOnArrow(1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnArrowDown() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      const orientation = areaManager.orientation;

      if (orientation === "horizontal") {
        return;
      }

      areaManager.focusOnArrow(1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Handles an "ArrowLeft" keyboard action by moving focus leftward
   * within the currently active area, if that area supports horizontal navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is queried for its orientation.
   * - If the orientation is vertical, no action is taken since ArrowLeft
   *   is not meaningful in that context.
   * - Otherwise, the area's manager is instructed to move focus leftward
   *   (via `focusOnArrow(-1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnArrowLeft() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      const orientation = areaManager.orientation;

      if (orientation === "vertical") {
        return;
      }

      areaManager.focusOnArrow(-1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Handles an "ArrowRight" keyboard action by moving focus rightward
   * within the currently active area, if that area supports horizontal navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is queried for its orientation.
   * - If the orientation is vertical, no action is taken since ArrowRight
   *   is not meaningful in that context.
   * - Otherwise, the area's manager is instructed to move focus rightward
   *   (via `focusOnArrow(1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnArrowRight() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      const orientation = areaManager.orientation;

      if (orientation === "vertical") {
        return;
      }

      areaManager.focusOnArrow(1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Handles a "Home" keyboard action by moving focus to the first item
   * within the currently active area, if that area supports Home/End navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is instructed to move focus to the first item
   *   (via `focusOnHomeEnd(-1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnHome() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      areaManager.focusOnHomeEnd(-1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Handles an "End" keyboard action by moving focus to the last item
   * within the currently active area, if that area supports Home/End navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is instructed to move focus to the last item
   *   (via `focusOnHomeEnd(1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnEnd() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      areaManager.focusOnHomeEnd(1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Handles a "PageUp" keyboard action by moving focus upward by a page
   * within the currently active area, if that area supports vertical page navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is queried for its orientation.
   * - If the orientation is horizontal, no action is taken since PageUp
   *   is not meaningful in that context (future support could be added via options).
   * - Otherwise, the area's manager is instructed to move focus upward
   *   by one page (via `focusOnPage(-1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnPageUp() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      const orientation = areaManager.orientation;

      // TODO: maybe add support for this via an option
      if (orientation === "horizontal") {
        return;
      }

      areaManager.focusOnPage(-1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Handles a "PageDown" keyboard action by moving focus downward by a page
   * within the currently active area, if that area supports vertical page navigation.
   *
   * Behavior:
   * - If there is no active area, the method returns immediately.
   * - The active area's manager is queried for its orientation.
   * - If the orientation is horizontal, no action is taken since PageDown
   *   is not meaningful in that context (future support could be added via options).
   * - Otherwise, the area's manager is instructed to move focus downward
   *   by one page (via `focusOnPage(1)` or equivalent).
   * - Updates the current area's `source` to `"keyboard"` to indicate
   *   that the focus change originated from a keyboard action.
   */
  focusOnPageDown() {
    if (!this.entry) return;

    const areaManager = this.entry.manager;

    if (areaManager.kind === "list") {
      const orientation = areaManager.orientation;

      // TODO: maybe add support for this via an option
      if (orientation === "horizontal") {
        return;
      }

      areaManager.focusOnPage(1);
      this.entry.source = "keyboard";
    }
  }

  /**
   * Clears the focus history stack and resets the active index.
   *
   * Behavior:
   * - Empties all stored focus area entries by setting the stack length to 0.
   * - Resets the current index to `-1`, indicating that no area is active.
   *
   * This provides a clean slate for focus management, allowing future
   * navigation to start fresh without any prior history.
   */
  clear() {
    this._stack.length = 0;
    this._index = -1;
  }
}
