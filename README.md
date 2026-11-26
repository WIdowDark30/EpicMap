# EpicMap

Interactive GemStone IV world map with connected areas, hunting level filters, live character tracking, fading movement trails, and customizable map layers. Works with Lich.

## Current download: v1.2.5

[**Download EpicMap v1.2.5 — complete ZIP**](https://github.com/WIdowDark30/EpicMap/releases/download/v1.2.5/epicmap-v1.2.5.zip)

**v1.2.6 has been withdrawn because of installation problems. Use the complete v1.2.5 ZIP and the manual steps below.** The automatic Windows installer is not currently recommended.

The complete ZIP includes all maps, data, the Lich companion and artwork credits. GitHub's **Source code** ZIP and the smaller **update** ZIP are not complete installations.

## Windows quick start

1. Download the complete ZIP above. Right-click it and choose **Extract All**.
2. Open the extracted folder. Copy its **EpicMap** folder into the Lich folder you actually use, including a OneDrive location if applicable.
3. Check that **index.html** is directly inside **Lich5/EpicMap**. If it is inside **Lich5/EpicMap/EpicMap**, copy the inner folder's contents up one level.
4. Copy the extracted **scripts/epicmap.lic** into **Lich5/scripts**, replacing the previous companion.
5. In game run `;epicmap`. If it is already running, first run `;kill epicmap`. Additional characters use `;epicmap noopen`. Reload an existing map tab with **Ctrl+F5**.

Before replacing an existing installation, make a backup of its EpicMap folder and scripts/epicmap.lic. Keep all map and artwork credits.

### If you installed v1.2.6

Stop the companion with `;kill epicmap`, then replace the map folder and companion using the complete v1.2.5 ZIP and the steps above. Do not use the v1.2.6 installer to roll back. Browser preferences remain in the same browser for the same map address.

### Troubleshooting

- **No index.html:** check the folder layout in step 3. The correct file is **Lich5/EpicMap/index.html**, with the map assets beside it.
- **Multiple Lich folders:** install into the one used to log in. Desktop and OneDrive/Desktop can contain different copies.
- **Map stored elsewhere:** the v1.2.5 companion accepts `dir=PATH` for that launch. Put the complete path after `dir=`; this older companion does not save it for future launches.
- **No live tracking:** start the companion on every character. The first hosts the local map; others use `;epicmap noopen`.
- **Port conflict:** use `;epicmap port=7444` on all characters and open the address printed by the launcher.

### Development status

The repository contains installer work and launcher tests from v1.2.6. Those files are not the recommended installation. The released v1.2.5 package is the current fallback while the reported problem is investigated.

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
