import type { FocusKey, ListFocusManagerProps } from "./types";

export class ListFocusManager {
  constructor(props: ListFocusManagerProps) {
    this.getKeys = props.getKeys;
    this.getFocusedKey = props.getFocusedKey;
    this.getPageSize = props.getPageSize;
    this.wrapAround = !!props.wrapAround;
  }

  protected getKeys;
  protected getFocusedKey;
  protected getPageSize;
  protected wrapAround;

  /**
   * Moves focus by one step in the list based on arrow key input.
   *
   * @param delta - Direction of movement:
   *   - `-1` for previous (Up/Left depending on orientation)
   *   - `1` for next (Down/Right depending on orientation)
   * @returns The newly focused key, or null if no items exist.
   */
  focusOnArrow(delta: -1 | 1): FocusKey | null {
    const keys = this.getKeys();
    if (keys.length === 0) return null;

    const currentKey = this.getFocusedKey();
    const currentIndex = currentKey != null ? keys.indexOf(currentKey) : -1;

    let targetIndex: number;
    if (currentIndex === -1) {
      targetIndex = this.getBoundaryIndex(delta, keys.length);
    }
    //
    else {
      const nextIndex = currentIndex + delta;
      targetIndex = this.wrapAround
        ? this.wrapIndex(nextIndex, keys.length)
        : this.clampIndex(nextIndex, keys.length);
    }

    return keys[targetIndex];
  }

  /**
   * Moves focus by a "page" of items, typically triggered by PageUp/PageDown.
   *
   * @param delta - Direction of movement:
   *   - `-1` for PageUp (previous page)
   *   - `1` for PageDown (next page)
   * @returns The newly focused key, or null if no items exist.
   */
  focusOnPage(delta: -1 | 1): FocusKey | null {
    const keys = this.getKeys();
    if (keys.length === 0) return null;

    const currentKey = this.getFocusedKey();
    const currentIndex = currentKey != null ? keys.indexOf(currentKey) : -1;
    const pageSize = this.getPageSize();

    let targetIndex: number;
    if (currentIndex === -1) {
      targetIndex = this.getBoundaryIndex(delta, keys.length);
    }
    //
    else {
      const nextIndex = currentIndex + delta * pageSize;
      targetIndex = this.wrapAround
        ? this.wrapIndex(nextIndex, keys.length)
        : this.clampIndex(nextIndex, keys.length);
    }

    return keys[targetIndex];
  }

  /**
   * Moves focus directly to the first or last item in the list,
   * typically triggered by Home or End keys.
   *
   * @param direction - Direction of movement:
   *   - `-1`: Home → first item
   *   - `1`: End → last item
   * @returns The newly focused key, or null if no items exist.
   */
  focusOnHomeEnd(direction: -1 | 1): FocusKey | null {
    const keys = this.getKeys();
    if (keys.length === 0) return null;

    const targetIndex = direction === -1 ? 0 : keys.length - 1;
    return keys[targetIndex];
  }

  protected getBoundaryIndex(delta: -1 | 1, keysLength: number): number {
    return delta === 1 ? 0 : keysLength - 1;
  }

  protected clampIndex(index: number, keysLength: number): number {
    return Math.max(0, Math.min(keysLength - 1, index));
  }

  protected wrapIndex(index: number, keysLength: number): number {
    return (index + keysLength) % keysLength;
  }
}
