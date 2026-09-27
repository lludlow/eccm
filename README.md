# Ethernet Cable Connection Manager

This fork is maintained at [lludlow/eccm](https://github.com/lludlow/eccm), based on [bijomaru78/eccm](https://github.com/bijomaru78/eccm). Open **ECCM.html** to run the app.

A lightweight, browser-based tool for mapping Ethernet connections.  
Create switches, patch panels, wall ports, routers, etc. Assign ports, connect them, and visualise how your network is wired.  

_Featured on:_<br>
🎞️ _<a href="https://www.youtube.com/watch?v=j_T4FLumWC8" target="_blank">ECCM - Ethernet Cable Connection Manager - Clarity on Cabling by Awesome Open Source</a>_<br> 
🎞️ _<a href="https://www.youtube.com/watch?v=b_ggjSxFNYM&t=81s" target="_blank">Best Docker Apps of September 2025 by ServersatHome</a>_<br>
🎞️ _<a href="https://www.youtube.com/watch?v=BWz9uFSNA8A&t=1245s" target="_blank">Docker full of tools by MP Studio</a>_<br>
_Thank you for sharing!_

📖 **User Manual** see [MANUAL.md](MANUAL.md)

📍 **Roadmap / To-Do:** see [ROADMAP.md](ROADMAP.md)

- 🖥️ Works offline (pure HTML + JavaScript, no server required)  
- 📂 Save/export/import layouts as JSON  
- 🖨️ Print sheets with device colours and linked ports  
- 👥 Manage multiple profiles (e.g., different customer networks)  
- 🎨 Colour-code devices and customise port aliases  
- 🔌 Dual-link ports supported (patch panels, wall sockets)
- Port groups with separate connector and speed capabilities
- Access/trunk VLANs and bulk port editing
- Cable details, searchable IDs and printable end labels
- LACP/static bond documentation and reusable device templates
- Configurable ports per row and STP root-candidate badges

**_Editor (Dark and Light mode):_**

<img src="https://github.com/bijomaru78/eccm/blob/main/eccm_ui_dark_light_animation.gif?raw=true">

**_Print sheet (devices and ports):_**

<img width="900" alt="image" src="https://github.com/user-attachments/assets/fdb68294-eeec-43c5-b5c9-0b978d6fdc28" />

**_Print sheet (connections table):_**

<img width="617" height="558" alt="image" src="https://github.com/user-attachments/assets/4967c6f2-caf6-4eb2-add0-2a1d5170ad0d" />


## 🚀 Try it online
You can open the app instantly here (hosted via GitHub Pages):  
👉 [Ethernet Cable Connection Manager DEMO](https://bijomaru78.github.io/eccm/ECCM.html)

The demo above is the upstream version. To use this fork, download or clone this repository and open `ECCM.html` locally.

## 📥 Download
Grab the latest release here:  
👉 [Releases](https://github.com/bijomaru78/eccm/releases)

## 💡 Support
This project is free and open source (GPL-3.0).  
If it saves you time or helps in your work, consider supporting development:  

<a href="https://www.buymeacoffee.com/bijomaru78" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## 📜 License
This project is licensed under the **GNU GPL-3.0**.  
You are free to use, modify, and redistribute it, but if you distribute changes, you must also provide the source code under the same license.


## Development and verification

The application remains self-contained in `ECCM.html`, with no build step.
Local JSON inventories/exports and alternate patched/versioned HTML copies are
ignored by Git. Do not force-add operational inventories.

Run the dependency-free regression tests with Node.js:

```sh
node --test tests/network.test.cjs
```

For browser workflow checks, start a local server:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then run these commands with the `agent-browser` CLI in a separate terminal:

```sh
agent-browser --session eccm-test open http://127.0.0.1:8765/ECCM.html
agent-browser --session eccm-test eval --stdin < tests/browser-smoke.js
agent-browser --session eccm-test close
```

The browser test replaces profiles in its browser session with synthetic test
data. Use the isolated test session above, never your everyday browser session.
It exercises forms, validation, templates, legacy VLAN compatibility, both export
handlers, profile import and full backup restore.
