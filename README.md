# @neptune3d/focus-manager

Accessible, spec-compliant focus state manager

[![NPM Version](https://img.shields.io/npm/v/%40neptune3d%2Ffocus-manager)](https://www.npmjs.com/package/@neptune3d/focus-manager)

```bash
npm install @neptune3d/focus-manager
```

## Usage

```ts
const focusManager = new FocusManager({
  areas: {
    toolbar: new ListFocusManager({
      getKeys: () => ["back", "forward", "refresh"], // or dynamic
      getPageSize: () => 3, // might be irrelevant for a horizontal toolbar
      getOrientation: () => "horizontal",
      getInitialKeyOnAreaFocus: () => "back", // usually the first key, but can be dynamic
      wrapAround: true,
    }),
    tableBody: new ListFocusManager({
      getKeys: () => {
        return table.rowKeys;
      },
      getPageSize: () => {
        return Math.floor(table.viewportHeight / table.rowHeight);
      },
      getOrientation: () => "vertical",
      getInitialKeyOnAreaFocus: () => {
        if (table.hasSelection) {
          return table.selectedKey; // assumes only a single selection is possible
        }
        //
        else {
          return table.rowKeys[0] ?? null;
        }
      },
      wrapAround: true,
    }),
  },
});

// native focus by Tab key

toolbarBackBtn.addEventListener("focus", () => {
  // area + key
  focusManager.focusAreaKey("toolbar", "back", "keyboard");

  // update UI
});

tableBody.addEventListener("focus", () => {
  // just area, key might be set if getInitialKeyOnAreaFocus returns a key.
  focusManager.focusArea("tableBody", "keyboard");

  // update UI
});

// arrow keys

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowRight") {
    // moves the focus within the current area, if an area is focused.
    focusManager.focusOnArrowRight();

    // update UI
  }
});

// click on button

toolbarBackBtn.addEventListener("pointerdown", () => {
  // unless pointerdown already automatically triggers focus
  focusManager.focusAreaKey("toolbar", "back", "pointer");
});

// restore focus

focusManager.goBack(); // or focusManager.go(-1)

// update UI

tableBody.classList.toggle("focused", focusManager.entry?.key === "tableBody");

// dynamic areas

// for multiple "instances" of the same focus area definition and other dynamic data,
// the meta field can be used

const focusManager = new FocusManager({
  areas: {
    paneTabs: new ListFocusManager<{ pane: Pane }>({
      getKeys: (ctx) => {
        return ctx.meta?.pane.tabKeys ?? [];
      },
      // ...
    }),
  },
});

// meta passed as the last argument and attached to the focus area entry
focusManager.focusAreaKey("paneTabs", tab.id, "keyboard", { pane: myPane });
```
