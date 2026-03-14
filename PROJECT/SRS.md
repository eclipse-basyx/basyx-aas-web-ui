# Software Requirements Specification

**Project:** BaSyx Viewer Plugin Extension
**Customer:** Markus Rentschler / Pawel Wojcik
**Prepared by:** Matti Frey & Laszlo Engemann
**Team:** DHBW Stuttgart – Team 2
**Date:** 24.10.2025
**Version:** 1.0

---

## Table of Contents

1. [Introduction](#1-introduction)
    1.1 [Purpose](#11-purpose)
    1.2 [Product Scope](#12-product-scope)
    1.3 [References](#13-references)
2. [Overall Description](#2-overall-description)
    2.1 [Product Perspective](#21-product-perspective)
    2.2 [Product Functions](#22-product-functions)
    2.3 [User Characteristics](#23-user-characteristics)
    2.4 [Operating Environment](#24-operating-environment)
3. [Use Cases](#3-use-cases)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Architecture](#6-system-architecture)
7. [Constraints and Dependencies](#7-constraints-and-dependencies)
8. [Glossary](#8-glossary)
9. [Revision History](#9-revision-history)

---

## 1. Introduction

### 1.1 Purpose <a name="11-purpose"></a>

This Software Requirements Specification (SRS) defines all functional and non-functional requirements for the *BaSyx Viewer Plugin Extension* project. The purpose is to extend and improve the Eclipse BaSyx AAS (Asset Administration Shell) Web UI to enhance usability, maintainability, and feature scope in alignment with industrial digital twin applications.

### 1.2 Product Scope <a name="12-product-scope"></a>

The BaSyx Viewer Plugin Extension aims to:

* Improve search and sorting functionalities within the existing BaSyx Viewer.
* Integrate a nameplate generator within the digital nameplate plugin.
* Extend API capabilities to provide more comprehensive AAS data access.
* Maintain compatibility and usability while ensuring performance and stability.

### 1.3 References <a name="13-references"></a>

* [CRS: Customer Requirement Specification – BaSyx Viewer Plugin Extension (Amon Rizzo, 2025)]
* [Eclipse BaSyx GitHub Repository](https://github.com/eclipse-basyx/basyx-aas-web-ui)
* [TINF19C_SRS_ServiceRegistry_Team_4_0v3 (2021)]
* [TINF21C_SRS_Team_4_v1.0 (2023)]

---

## 2. Overall Description

### 2.1 Product Perspective <a name="21-product-perspective"></a>

The project extends the existing BaSyx AAS Web UI ecosystem. It builds upon the open-source BaSyx framework and integrates seamlessly with the current architecture through the plugin interface. The enhancements focus on UI improvements, API expansion, and improved user experience.

### 2.2 Product Functions <a name="22-product-functions"></a>

The system provides:

* **Search Enhancements** – recursive AAS data search.
* **Sorting Options** – dynamic sorting by key attributes.
* **Integrated Nameplate Generator** – automatic generation via the Digital Nameplate plugin.
* **API Extensions** – JSON output of complete AAS data.
* **Improved Input Labeling** – clearer identification of Boolean fields.

### 2.3 User Characteristics <a name="23-user-characteristics"></a>

| User Type | Description                                     | Technical Expertise |
| --------- | ----------------------------------------------- | ------------------- |
| Developer | Works on plugin and UI integration              | Advanced            |
| End User  | Operates the BaSyx Viewer for AAS visualization | Moderate            |
| Tester    | Validates UI functionality and API responses    | Intermediate        |

### 2.4 Operating Environment <a name="24-operating-environment"></a>

* **Frontend:** Web browser (Chrome, Firefox, Edge)
* **Backend:** Eclipse BaSyx Framework (Spring Boot, Java)
* **OS:** Cross-platform (Linux/Windows)
* **API:** REST (JSON)

---

## 3. Use Cases

### UC01 – Display AASX Information in Viewer

| Field           | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| Objective       | User views specific AAS data from an uploaded `.aasx` file. |
| Precondition    | Valid AASX file uploaded.                                   |
| Postcondition   | Data is displayed in UI.                                    |
| Trigger         | User clicks on an element in the viewer.                    |
| Involved Roles  | User                                                        |
| System Boundary | Browser-based BaSyx Viewer                                  |

---

### UC02 – Provide AAS Data as JSON via API

| Field          | Description                               |
| -------------- | ----------------------------------------- |
| Objective      | Retrieve AAS data in JSON format via API. |
| Precondition   | AASX file stored in system.               |
| Postcondition  | JSON data returned.                       |
| Trigger        | API request (`/shells`).                  |
| Involved Roles | API consumer, user                        |

---

### UC03 – Generate Digital Nameplate

| Field         | Description                                           |
| ------------- | ----------------------------------------------------- |
| Objective     | Automatically generate a nameplate based on AAS data. |
| Precondition  | Plugin “Digital Nameplate” is active.                 |
| Postcondition | Nameplate generated and displayed.                    |
| Trigger       | User action or system event.                          |

---

### UC04 – Sort AAS Shells

| Field         | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| Objective     | Sort loaded AASX shells by manufacturer, product designation, etc. |
| Precondition  | Multiple AASX shells loaded.                                       |
| Postcondition | Sorted list displayed.                                             |
| Trigger       | User selects sorting option.                                       |

---

### UC05 – Label Input Variables

| Field         | Description                                 |
| ------------- | ------------------------------------------- |
| Objective     | Improve visibility of Boolean input fields. |
| Precondition  | AAS structure loaded.                       |
| Postcondition | Clearer labeling for user comprehension.    |

---

## 4. Functional Requirements

| ID     | Title                           | Description                                                         | Priority |
| ------ | ------------------------------- | ------------------------------------------------------------------- | -------- |
| FR.001 | Preserve existing functionality | All existing viewer functions must remain intact after enhancement. | Must     |
| FR.002 | Sorting                         | Implement dynamic sorting of shells by key attributes.              | Must     |
| FR.003 | Search                          | Extend search functionality recursively through AAS content.        | Must     |
| FR.004 | Nameplate generator integration | Integrate submodule into digital nameplate plugin.                  | Must     |
| FR.005 | API enhancements                | Extend JSON output for `/shells` endpoint.                          | Should   |
| FR.006 | Improved labeling               | Add extra labels for Boolean values.                                | Could    |

---

## 5. Non-Functional Requirements

| ID      | Title           | Description                                                 | Fit Criterion                                                  |
| ------- | --------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| NFR.001 | Usability       | UI improvements must reduce average task time.              | Loose Guideline: Experienced users locate functions <10 min; new users <20 min. |
| NFR.002 | Performance     | No significant delay from enhancements.                     | Loose Guideline: API calls ≤ 0.2s slower than current baseline.                 |
| NFR.003 | Stability       | Application should not crash under standard or rapid usage. | 0 critical failures in 10 test runs.                           |
| NFR.004 | Maintainability | Clear documentation and readable code.                      | Loose Guideline: New dev understands within 1 hour.                             |
| NFR.005 | Licensing       | Maintain current open-source license.                       | License remains unchanged.                                     |

---

## 6. System Architecture

The system is structured as a **modular plugin** integrated into the existing BaSyx Viewer ecosystem.
Key components:

* **Frontend Module:** React-based UI with dynamic search/sort features.
* **Backend Module:** REST API extensions for data retrieval.
* **Plugin Interface:** Integration with BaSyx Viewer’s plugin architecture.
* **Data Model:** Follows AAS meta-model and supports AASX file parsing.

---

## 7. Constraints and Dependencies

* Dependent on Eclipse BaSyx AAS Web UI (current version).
* Browser compatibility: modern browsers only.
* Backend communication via REST endpoints.
* Must follow industrial digital twin data model standards.
* Developed and tested in DHBW network environment.

---

## 8. Glossary

| Term      | Definition                                |
| --------- | ----------------------------------------- |
| AAS       | Asset Administration Shell                |
| AASX      | Packaged AAS file format                  |
| API       | Application Programming Interface         |
| JSON      | JavaScript Object Notation                |
| UI        | User Interface                            |
| Plugin    | Modular extension of the BaSyx Viewer     |
| Nameplate | Digital representation of a product label |

---

## 9. Revision History

| Version | Date       | Author                       | Comment                                                          |
| ------- | ---------- | ---------------------------- | ---------------------------------------------------------------- |
| 0.1     | 20.10.2025 | Matti Frey & Laszlo Engemann | Initial draft based on CRS                                       |
| 0.9     | 22.10.2025 | Matti Frey & Laszlo Engemann | Extended with structure and examples from previous SRS documents |
| 1.0     | 24.10.2025 | Matti Frey & Laszlo Engemann | Final version for submission                                     |
