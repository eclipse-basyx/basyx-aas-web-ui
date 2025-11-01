# Customer Requirements Specification

## for [BaSyx Viewer]

**Prepared by:** [Amon Rizzo]
**Date:** [01.11.2025]

## Table of contents

1. [Scope](#scope)
2. [Introduction](#intro)
3. [Use Cases](#uc)
    - 3.1 [UC01: Find and View Asset Administration Shell (AAS) Data](#uc01)
    - 3.2 [UC02: Access AAS Data as JSON via API](#uc02)
    - 3.3 [UC03: Generate a Digital Nameplate](#uc03)
4. [User Requirements](#requirements)
    - 4.1 [Functional Requirements](#fr)
        - 4.1.1 [FR01: Preserve Existing Functionality](#fr01)
        - 4.1.2 [FR02: Sort AAS by Properties](#fr02)
        - 4.1.3 [FR03: Enhanced Search Functionality](#fr03)
        - 4.1.4 [FR04: Integrate Nameplate Generator](#fr04)
        - 4.1.5 [FR05: API Enhancements](#fr05)
        - 4.1.6 [FR06: Improve Labeling of Input Variables](#fr06)
    - 4.2 [Non-functional Requirements](#nfr)
        - 4.2.1 [NFR01: User-Friendliness](#nfr01)
        - 4.2.2 [NFR02: Performance](#nfr02)
        - 4.2.3 [NFR03: Stability](#nfr03)
        - 4.2.4 [NFR04: Maintainability](#nfr04)
        - 4.2.5 [NFR05: License](#nfr05)

## Revision History

| Name | Date | Reason for Changes | Version |
| :-- | :-- | :-- | :-- |
| Amon Rizzo | 18.10.2025 | first version | 1.0 |
| Amon Rizzo | 01.11.2025 | Restructured use cases and requirements | 1.1 |

***
## 1 Scope <a name="scope"></a>

This document defines the customer problem, project guidelines, and requirements to establish a baseline for all stakeholders. It specifies software requirements from user and customer perspectives, enabling the development team to translate the product vision into actionable specifications.

## 2 Introduction <a name="intro"></a>

The main objective of this project is to enhance the usability of the BaSyx AAS Web UI. This includes not only the specific requirements of the main customer but also select open issues in the basyx-aas-web-ui GitHub repository, as well as any usability issues that may arise while working on the project.

## 3 Use Cases <a name="uc"></a>

### 3.1 UC01: Find and View Asset Administration Shell (AAS) Data <a name="uc01"></a>

| Use Case ID | UC01 |
| :-- | :-- |
| Description | The user wants to find a specific Asset Administration Shell (AAS) and view its data in the user interface. |
| Involved roles | User |
| System boundary | AASX file content, browser |
| Precondition | The user has uploaded a valid AASX file that contains the targeted information. |
| Postcondition on success | The desired information is displayed, and the AASX file remains unchanged. |
| Triggering event | The user interacts with the sorting or search functionality to find and view AAS data. |

### 3.2 UC02: Access AAS Data as JSON via API <a name="uc02"></a>

| Use Case ID | UC02 |
| :-- | :-- |
| Description | The user wants to retrieve data from an AASX file in JSON format through an API call. |
| Involved roles | User, API |
| System boundary | AASX file content |
| Precondition | The desired AASX file is available in the database. |
| Postcondition on success | A JSON object with all relevant information is made accessible to the user. |
| Triggering event | The user calls the API endpoint for a specific AAS. |

### 3.3 UC03: Generate a Digital Nameplate <a name="uc03"></a>

| Use Case ID | UC03 |
| :-- | :-- |
| Description | The user wants to generate a digital nameplate for an asset based on the information in an AAS. |
| Involved roles | User |
| System boundary | AASX file content, browser |
| Precondition | The user has selected an AAS that contains the necessary information for a nameplate. |
| Postcondition on success | A digital nameplate is generated and displayed to the user. |
| Triggering event | The user selects the "Digital Nameplate" feature for a selected AAS. |

## 4 Customer Requirements <a name="requirements"></a>

These requirements are the basis of the contract with the customer and form, depending on the priority, the precondition for the customer's acceptance of the project.

| priority levels | code |
| :-- | :-- |
| Must Have | 1 |
| Should Have | 2 |
| Could Have | 3 |

## 4.1  Functional Requirements <a name="fr"></a>

### 4.1.1 FR01: Preserve Existing Functionality <a name="fr01"></a>

| Requirement ID | FR01 - Priority: 1 |
| :-- | :-- |
| Overview | All existing functionality of the BaSyx AAS Web UI must be preserved. |
| Fit criterion | The building and deployment process for the AAS viewer must not change. All data that can currently be found through the UI or API must be accessible through similar methods at the end of the project. |

### 4.1.2 FR02: Sort AAS by Properties <a name="fr02"></a>

| Requirement ID | FR02 - Priority: 1 |
| :-- | :-- |
| Overview | To improve usability, the user must be able to sort the list of loaded AAS. |
| Fit Criterion | The shells seen in the left sidebar must be sortable by the following properties: !createdAt! and  if available: ManufacturerName, ProductDesignation, OrderCode, ManufacturerCode, globalAssetId. |

### 4.1.3 FR03: Enhanced Search Functionality <a name="fr03"></a>

| Requirement ID | FR03 - Priority: 1 |
| :-- | :-- |
| Overview | The user must be able to search for AAS based on a wider range of information. |
| Fit Criterion | The "search for AAS" input field must recursively search through all file content for matching strings. The search depth can be adjusted to meet performance requirements. This should also resolve the issue described in [GitHub issue #209](https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/209). |

### 4.1.4 FR04: Integrate Nameplate Generator <a name="fr04"></a>

| Requirement ID | FR04 - Priority: 1 |
| :-- | :-- |
| Overview | The "Nameplate generator" submodule must be integrated into the "Digital Nameplate" plugin. |
| Fit criterion | The "Nameplate generator" functionality must be accessible and fully functional from within the "Digital Nameplate" plugin. |

### 4.1.5 FR05: API Enhancements <a name="fr05"></a>

| Requirement ID | FR05 - Priority: 2 |
| :-- | :-- |
| Overview | The API must provide more comprehensive information for each AAS. |
| Fit Criterion | The API endpoint `localhost:8081/shells` must return all available information for each AAS. |

### 4.1.6 FR06: Improve Labeling of Input Variables <a name="fr06"></a>

| Requirement ID | FR06 - Priority: 3 |
| :-- | :-- |
| Overview | The labeling of boolean input variables should be improved for better clarity. |
| Fit Criterion | Boolean values should have an extra label to clarify their meaning, resolving [GitHub issue #538](https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/538). |

## 4.2  Non-functional Requirements <a name="nfr"></a>

### 4.2.1 NFR01: User-Friendliness <a name="nfr01"></a>

| Requirement ID | NFR01 |
| :-- | :-- |
| Overview | The UI should be intuitive and easy to use. |
| Fit Criterion | An experienced user should be able to find all existing features within 10 minutes. A user inexperienced with the BaSyx AAS Viewer (but familiar with the AAS data structure) should be able to find the desired information within 20 minutes and with at most 5 clicks. |

### 4.2.2 NFR02: Performance <a name="nfr02"></a>

| Requirement ID | NFR02 |
| :-- | :-- |
| Overview | The new features should not negatively impact the performance of the application. |
| Fit Criterion | The general speed of the UI (e.g., opening submenus) and API request times should not increase by more than 0.2 seconds compared to the current version. The search functionality should return at least one result within 30 seconds. |

### 4.2.3 NFR03: Stability <a name="nfr03"></a>

| Requirement ID | NFR03 |
| :-- | :-- |
| Overview | The application must be stable and reliable. |
| Fit Criterion | The software must not crash under expected usage and must be resistant to high user input frequency. This must be verified with automated tests. |

### 4.2.4 NFR04: Maintainability <a name="nfr04"></a>

| Requirement ID | NFR04 |
| :-- | :-- |
| Overview | The software should be easy to maintain and extend. |
| Fit Criterion | The documentation must be comprehensive enough for a new developer to understand the changes within one hour and for a user to use the new features within 10 minutes. |

### 4.2.5 NFR05: License <a name="nfr05"></a>

| Requirement ID | NFR05 |
| :-- | :-- |
| Overview | The software license must remain unchanged. |
| Fit Criterion | The license of the software must not change from the current version. |
