# Team 2 SWE
<img width="769" height="371" alt="Screenshot 2026-04-16 123247" src="https://github.com/user-attachments/assets/72c542e4-24a0-4ea8-9e63-43f2f23e2c74" />

This project aims to improve the web UI of the BaSyx tool, with a primary focus on enhancing the usability of the search function.


# The Team

| Name | Role | Github |
| ---- | ---- | ---- |
| Manuel Sposato​ | Project Leader​ | [Manujpg](https://github.com/Manujpg) |
| Amon Rizzo​ | Product Manager | [amon1220](https://github.com/amon1220)​ |
| Jakob Pauls​ | System Developer | [DJSkyRoad](https://github.com/DJSkyRoad) |
| David Ehrhardt​ | System Developer | [xyzyx4546](https://github.com/xyzyx4546)​ |
| Mattis Weigold​ | Testmanager | [Skullman-G](https://github.com/Skullman-G) |
| Laszlo Engemann​ | Technical Documentation | [Laszlo2025](https://github.com/Laszlo2025)​ |
| Matti Frey​ | Technical Documentation | [Matti2603](https://github.com/Matti2603) |

# The Root Project

Our project is an extension and fork of the [basyx-aas-web-ui](https://github.com/eclipse-basyx/basyx-aas-web-ui), a web application built with Vue.js. It enables the management of so-called Asset Administration Shells.

More information about AAS files and additional details about BaSyx can be found in the official [BaSyx documentation](https://wiki.basyx.org/en/latest/index.html).

![alt text](ORIGINAL_DOCS/Figs/AAS_Web_UI.png "AAS GUI")

# Our Project

Our [project specification](https://github.com/DHBW-TINF24F/.github/blob/main/project2_basyx_viewer_extension.md) consists of maintaining and further developing the existing frontend and API functionalities.

The following new features are already planned:
- A recursive search function
- Sorting by key attributes in the search
- Nameplate integration in the "Digital Nameplate" plugin
- UI improvements through boolean labeling

Further details on planning and coordination can be found on our [Notion](https://shore-ambert-85d.notion.site/SWE-Hub-2e4958e5f3554007b4deb97139e785b3?pvs=74) page.


# Build
requirements:
- Yarn
- Node.js: version 20 LTS or newer
- Docker
- Maven
- Git

To start the backend and frontend simultaneously, use the `Team2-BaSyx-Viewer-Plugin-Erweiterung/SOURCE/start.sh` (for Linux/macOS) or `Team2-BaSyx-Viewer-Plugin-Erweiterung/SOURCE/start.bat` (for Windows).
