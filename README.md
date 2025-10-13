![GitHub](https://img.shields.io/github/license/eclipse-basyx/basyx-aas-web-ui)

#   TINF24F_Team6_BaSyx_DPP_API


This project implements a **REST API for the Digital Product Passport (DPP)** according to the [**DIN EN 18222**](PROJECT/DIN_EN_18222_Draft.pdf) standard, integrated into the **Eclipse BaSyx framework**.  
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
   - Derive a complete OpenAPI (Swagger) specification from [DIN EN 18222](PROJECT/DIN_EN_18222_Draft.pdf)  
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
| **Hosting** | Docker / Kubernetes [Demo Server](https://srv01.noah-becker.de/uni/swe/swagger/) |
| **Documentation** | Markdown, GitHub Pages, Swagger UI |

## Useful Links
-   [BaSyx Hack - Useful API information](https://basyxhack.iese.de/docs.html#gettingstarted)
-   [AAS Web UI overview](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html)
-   [DIN EN 1822](PROJECT/DIN_EN_18222_Draft.pdf)
-   [Tutorials & Resources](https://github.com/DHBW-TINF24F/.github/blob/main/Tutorials.md)
