![GitHub](https://img.shields.io/github/license/eclipse-basyx/basyx-aas-web-ui) [![Deploy Web UI (WIP)](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_webui.yml/badge.svg?branch=main)](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_webui.yml) [![Deploy Swagger Specification](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_swagger.yml/badge.svg)](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/actions/workflows/deploy_swagger.yml)



#   TINF24F_Team6_BaSyx_DPP_API

<hr>
<p align="center"><a href="https://srv01.noah-becker.de/uni/swe/swagger/">Swagger</a> &bull;
<a href="https://srv01.noah-becker.de/uni/swe/basyx/">BaSyx Web UI</a> &bull;
<a href="https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/tree/main/PROJECT/MEETING_PROTOCOLS">Meeting Minutes</a> &bull;
<a href="https://1drv.ms/p/c/94b53bce14d0456b/EVwut7JiukRCs4097VqIiFMBA16DA1QQZXdYSsWuQjsq4Q?e=AmxA4S">Presentation</a>
<hr>


This project implements a REST API for the Digital Product Passport (DPP) according to the [**DIN EN 18222**](https://www.dinmedia.de/en/draft-standard/din-en-18222/393321021) standard, integrated into the Eclipse BaSyx framework.  


Our main task is to define an API according to the DIN standard and provide it through a backend service. As a potential release, we plan to offer a new DPP “BaSyx” Docker container. The core idea is to call existing BaSyx APIs-particularly the “Asset Administration Shell Repository API” and map their responses to the required DIN compliant output format.

In addition, we need to develop a completely independent frontend that is not directly connected to BaSyx. This frontend should display the DPPs of uploaded shells (AASX, JSON, etc.) in a well structured and user friendly way. Possible frontend frameworks include Angular (as suggested by Herr Rentschler) or React. Currently, this visualization is handled rather poorly through the “AAS SM Visualizations” tab in the BaSyx Web UI.

Ideally, we would also add a new entry in the BaSyx UI under the “AAS SM Visualizations” section, potentially called “AAS DPP Viewer”, which would redirect users to our new frontend.


## Main Tasks

1. **OpenAPI Specification**  
   - Derive a complete OpenAPI (Swagger) specification from [DIN EN 18222](https://www.dinmedia.de/en/draft-standard/din-en-18222/393321021)  
   - Ensure compliance and interoperability with BaSyx REST standards  

2. **BaSyx Environment Setup**
   - Install and configure a local BaSyx environment   

3. **UI Analysis & Design**
   - Analyze existing BaSyx and DPP UI solutions  
   - Define designs for the API frontend

4. **Development & Integration**
   - Fork and modify required BaSyx repositories  
   - Implement and test DPP API and UI components  

5. **Deployment & Documentation**
   - Host the DPP API and frontend on a public demo server  
   - Provide structured online documentation via GitHub Pages or BaSyx Wiki  
   - Present the implementation for community acceptance in the BaSyx open-source project

---

## Team Members

| Role              | Responsible Person            |
  |-------------------|-----------------------------------|
  | Project Manager   | Nataliia Chubak                   |
  | Product Manager   | Luca Schmoll, Magnus Lörcher      |
  | Test Manager      | Manuel Lutz                       |
  | System Architect  | Noah Becker                       |
  | Documentation     | Fabian Steiß                      |
  | UI Designer       | Felix Schulz                      |
  | Developer         | All                               |

## Technologies & Tools

| Component | Technology |
|------------|-------------|
| **Backend** | Java / Spring Boot (BaSyx SDK) |
| **Frontend** | React / TypeScript (BaSyx UI) |
| **Infrastructure** | Eclipse BaSyx Framework |
| **API Definition** | OpenAPI 3.0 / Swagger |
| **Data Model** | Asset Administration Shell (AAS) |
| **Hosting** | <div>Traefik (Reverse Proxy) & Docker<br><li> [Swagger](https://srv01.noah-becker.de/uni/swe/swagger/) OpenAPI Spezifikation<br><li> [BaSyx WebUI](https://srv01.noah-becker.de/uni/swe/basyx/) Applikation</div> |
| **Documentation** | Markdown, GitHub Wiki, Swagger UI |

---

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
- [x] GitHub Wiki
- [ ] Documents
    - [x] Business sase
    - [x] Customer request specifications
    - [x] Software requirements specifications
    - [x] Project management
    - [ ] Meeting minutes
    - [ ] Presentation

Go to [open issues](https://github.com/DHBW-TINF24F/Team6-BaSyx-DPP-API/issues) or [roadmap](https://github.com/orgs/DHBW-TINF24F/projects/9) for a full list of proposed features (and known issues).
