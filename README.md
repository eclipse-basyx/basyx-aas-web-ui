![GitHub](https://img.shields.io/github/license/eclipse-basyx/basyx-aas-web-ui) [![Deploy Web UI (WIP)](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_webui.yml/badge.svg?branch=main)](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_webui.yml) [![Deploy Swagger Specification](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_swagger.yml/badge.svg)](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_swagger.yml)



#   TINF24F_Team6_BaSyx_DPP_API

<hr>
<p align="center"><a href="#swagger">Swagger</a> &bull; <a href="https://srv01.noah-becker.de/uni/swe/swagger/"></a>
<a href="#webUI">BaSyx Web UI</a> &bull; <a href="https://srv01.noah-becker.de/uni/swe/basyx/"></a>
<a href="#minutes">Meeting Minutes</a> <a href="https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/tree/main/PROJECT/MEETING_PROTOCOLS"></a> &bull;
<a href="#presentation">Presentation</a> <a href="https://1drv.ms/p/c/94b53bce14d0456b/EVwut7JiukRCs4097VqIiFMBA16DA1QQZXdYSsWuQjsq4Q?e=AmxA4S
"></a>
<hr>


This project implements a **REST API for the Digital Product Passport (DPP)** according to the [**DIN EN 18222**](https://www.dinmedia.de/en/draft-standard/din-en-18222/393321021) standard, integrated into the **Eclipse BaSyx framework**.  
It provides a complete end-to-end solution for lifecycle management, interoperability, and usability of digital product data across the entire product lifecycle.

---

## Project Overview

The **Digital Product Passport (DPP)** enables transparency and sustainability in Industry 4.0 product lifecycle management.  
Based on **DIN EN 18222**, this project defines and implements a standardized REST API, frontend interface, and demo environment using the BaSyx ecosystem.

---

## Objectives

- Implement the **DIN EN 18222 REST API** specification for digital product passports  
- Integrate the API with **BaSyx AAS (Asset Administration Shell)** infrastructure  
- Develop **example DPPs** and **frontend viewer functionality**  
- Improve tutorials and documentation within the **BaSyx open-source community**

---

## Main Tasks

1. **OpenAPI Specification**  
   - Derive a complete OpenAPI (Swagger) specification from [DIN EN 18222](https://www.dinmedia.de/en/draft-standard/din-en-18222/393321021)  
   - Ensure compliance and interoperability with BaSyx REST standards  

2. **BaSyx Environment Setup**  
   - Install and configure a local BaSyx environment  
   - Review and improve existing BaSyx tutorials  

3. **DPP Example Models**  
   - Create example product passports using BaSyx Asset Administration Shells  
   - Demonstrate lifecycle management and traceability  

4. **UI Analysis & Design**  
   - Analyze existing BaSyx and HARTING DPP UI solutions  
   - Define a usability concept and workflow for DPP viewer use cases  

5. **Development & Integration**  
   - Fork and modify required BaSyx repositories  
   - Set up a local build chain (build, deploy, verify changes)  
   - Implement and test DPP API and UI components  

6. **Deployment & Documentation**  
   - Host the DPP API and frontend on a public demo server  
   - Provide structured online documentation via GitHub Pages or BaSyx Wiki  
   - Present the implementation for community acceptance in the BaSyx open-source project

---

## Technologies & Tools

| Component | Technology |
|------------|-------------|
| **Backend** | Java / Spring Boot (BaSyx SDK) |
| **API Definition** | OpenAPI 3.0 / Swagger |
| **Frontend** | React / TypeScript (BaSyx UI) |
| **Data Model** | Asset Administration Shell (AAS) |
| **Infrastructure** | Eclipse BaSyx Framework |
| **Hosting** | <div>Traefik (Reverse Proxy) & Docker<br><li> [Swagger](https://srv01.noah-becker.de/uni/swe/swagger/) OpenAPI Spezifikation<br><li> [BaSyx WebUI](https://srv01.noah-becker.de/uni/swe/basyx/) Applikation</div> |
| **Documentation** | Markdown, GitHub Wiki, Swagger UI |

---

## How to: Local development
> [!NOTE]
> PowerShell scripts should be running on your device, if not please follow [this](#running-without-powershell-scripts) workflow.

> [!WARNING]
> The PowerShell scripts are running/downloading Docker Containers. Please ensure, that you have Docker installed on your device and have the Docker Daemon running. Also, make sure that you have enough space.

### BaSyx WebUI
To start the local BaSyx development environment, run the following command (assuming that you are in the main repo folder):
```
./run_basyx-webui.ps1
```
> [!CAUTION]
> The BaSyx WebUI needs several services as dependencies, which will also be installed during the process. - The whole installing will take around **5GB of space**.

**The BaSyx WebUI is now available on `http://localhost:3000`**<br>
*The initialization of all background BaSyx services can take up to 1-2 minutes. Till the services aren't running, the WebUI won't be available.*

### Swagger Editor
To start the Swagger Editor, run the following command (assuming that you are in the main repo folder):
```
./run_swagger-editor.ps1
```

> [!TIP]
> If you are getting an "Permission denied"-error, please run **`chmod +x ./run_basyx-webui.ps1`** or **`chmod +x ./run_swagger-editor.ps1`** and then try running the start scripts again.

#### Running without PowerShell scripts
**BaSyx WebUI**
```
docker compose -f ./docker-compose.webui.yml up -d
```

**Swagger Editor**
```
docker compose -f ./docker-compose.swagger.yml up -d
```

## Useful Links
-   [BaSyx Hack - Useful API information](https://basyxhack.iese.de/docs.html#gettingstarted)
-   [AAS Web UI overview](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html)
-   [DIN EN 18222](https://www.dinmedia.de/en/draft-standard/din-en-18222/393321021)
-   [Tutorials & Resources](https://github.com/DHBW-TINF24F/.github/blob/main/Tutorials.md)
-   [PowerPoint](https://1drv.ms/p/c/94b53bce14d0456b/EVwut7JiukRCs4097VqIiFMBA16DA1QQZXdYSsWuQjsq4Q?e=AmxA4S)




## Roadmap

- [x] Open API specification
- [x] Development environment
- [x] Issue tracker
- [ ] GitHub Wiki
- [ ] Project planning with projects feature
- [ ] Documents
    - [x] Business sase
    - [ ] Customer request specifications
    - [ ] Software requirements specifications
    - [ ] Software requirements specifications
    - [x] Project management
    - [ ] Meeting minutes
    - [ ] Presentation

See the [open issues](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/issues) for a full list of proposed features (and known issues).
