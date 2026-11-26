# EpicMap

Interactive GemStone IV world map with connected areas, hunting level filters, live character tracking, fading movement trails, and customizable map layers. Works with Lich.

[Download the latest release](https://github.com/WIdowDark30/EpicMap/releases/latest)

## Download and install v1.2.5

[**Download EpicMap v1.2.5 — complete ZIP**](https://github.com/WIdowDark30/EpicMap/releases/download/v1.2.5/epicmap-v1.2.5.zip)

Includes all maps, data, the Lich companion script, and the latest UI improvements. New users need only this download.

[**Existing users: download the smaller 1.2.5 update ZIP**](https://github.com/WIdowDark30/EpicMap/releases/download/v1.2.5/epicmap-v1.2.5-update.zip). Merge its `EpicMap` folder into your existing installation; keep your existing maps and room data.

1. Extract the ZIP and place the `EpicMap` folder in your Lich folder.
2. Copy `scripts/epicmap.lic` into your Lich scripts folder.
3. Run `;epicmap` in game. Use `;epicmap noopen` for additional characters.

Existing users can replace their `EpicMap` folder and reload with **Ctrl+F5**.

## New in 1.2.5

- **Illustrated world overview:** new shaded terrain, forests, rivers and coastlines, with crisp labels drawn separately. Choose Illustrated atlas, Minimal vector atlas, or Original artwork under **Layers > World background**. The choice is saved with your preferences. Addresses [#1](https://github.com/WIdowDark30/EpicMap/issues/1).
- **Zoom stays put:** following between maps and opening another local area map retain your chosen zoom. Optional zoom-to-room applies only when enabling Follow. Addresses [#2](https://github.com/WIdowDark30/EpicMap/issues/2).
- **Drag without losing Follow:** panning no longer disables Follow or changes the selected character. Tracking yields while you drag or pinch, then resumes on the next character move. Press **F** or click Follow to pause intentionally. Addresses [#3](https://github.com/WIdowDark30/EpicMap/issues/3).
- Includes the wider zoom range, saved preferences and independent panel controls. The Lich companion, detailed maps and room coordinates are unchanged.

The new illustration is AI-assisted decorative artwork based on the credited Simutronics map, not new official geography or route data. Original artwork remains available. All 13 offline regression tests and six headless-browser check groups passed.

### Saved preferences

Open **Layers → Preferences** to enable or disable automatic saving, **Save now**, or **Reset preferences**. Remembering is enabled by default and saves hunting filters, map layers, view and tilt, tracking controls, selected character, trail duration, selected tab, and panel visibility. Turning it off clears saved settings. Preferences stay in the same browser and site address; they do not sync between computers.

### Panel controls

- Hide the left controls and minimap independently; small Show buttons restore them.
- Press **B** for controls or **M** for the minimap when not typing.
- Visibility is remembered when browser storage is available. Hunting filters, glow, and live tracking continue while panels are hidden.

## Screenshots

### World map
Explore Elanthia and see hunting areas highlighted for your selected level range.

![EpicMap world map with glowing in-range hunting areas](https://github.com/WIdowDark30/EpicMap/releases/download/v1.2.5/epicmap-v1.2.5-preview.png)

### Hunting finder
Filter hunting areas by level and region, inspect creatures, and copy a `;go2` command.

![EpicMap hunting finder with creature levels and area details](screenshots/06_hunting_finder.jpg)

### Live character tracking
Follow multiple characters and see their recent movement trails through the Lich companion script.

![EpicMap live tracking with two connected characters and a movement trail](screenshots/05_live_follow.jpg)

### Tilted view
Switch to a tilted perspective to explore how towns and area maps connect.

![EpicMap tilted view showing connected area maps](screenshots/07_tilt_3d.jpg)

The world overview screenshot shows v1.2.5; the other examples are from v1.2.1. Visible layers and settings can differ from the default view. Map artwork and data credits are included in the release README.
