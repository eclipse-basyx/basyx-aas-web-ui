# Software Requirements Specification

## for [BaSyx Viewer]

**Prepared by:** [Amon Rizzo]
**Date:** [18.10.2025]

## Table of contents

1. [Scope](#scope)
2. [Introduction](#intro)
3. [Use Cases](#uc)
    - 3.1 [UC01: Show information from an aasx file in the aas viewer UI](#uc01)
    - 3.2 [UC02: output information from an aasx file as json through the api](#uc02)
4. [User Requirements](#requirements)
    - 4.1 [Functional Requirements](#fr)
        * 4.1.1 [FR.001 Preserving functionality](#fr01)
        * 4.1.2 [FR.002 Sorting](#fr02)
        * 4.1.3 [FR.003 Search](#fr03)
        * 4.1.4 [FR.004 Nameplate generator](#fr04)
        * 4.1.5 [FR.005 API enhancements](#fr05)
        * 4.1.6 [FR.538 Improve labeling of Input Variables](#fr538)
    - 4.2 [Non-functional Requirements](#nfr)
        * 4.2.1 [NFR.001 User-friendly](#nfr01)
        * 4.2.2 [NFR.002 Performance](#nfr02)
        * 4.2.3 [NFR.003 Stability](#nfr03)
        * 4.2.4 [NFR.004 Maintainability](#nfr04)
        * 4.2.5 [NFR.005 License](#nfr05)

## Revision History

| Name | Date | Reason for Changes | Version |
| :-- | :-- | :-- | :-- |
| 1.0 | 18.10.2025 | Amon Rizzo | first version |


***
## 1 Scope <a name="scope"></a>

This document defines the customer problem, project guidelines, and requirements to establish a baseline for all stakeholders. It specifies software requirements from user and customer perspectives, enabling the development team to translate the product vision into actionable specifications.

## 2 Introduction <a name="intro"></a>

The main objective of this project is to enhance the usability of the basyx aas web UI. Included are not only the specific requirements of the main customer but also select open issues in the basyx-aas-web-ui github repository. As well as any usability issues that may arise while working on the project.

## 3 Use Cases <a name="usecase"></a>

## 3.1 UC01: Show information from an aasx file in the aas viewer UI <a name="uc01"></a>

| Use Case ID | UC01 |
| :-- | :-- |
| Description | The User wants to find/view some specific data from the aasx file |
| Involved roles | User |
| System boundary | Aasx file content, browser |
| Precondition | The user has uploaded a valid aasx file that contains the targeted information |
| Postcondition on success | The desired information is displayed the aasx file remains unchanged |
| Triggering event | The user has pressed any button that changes the state of the aas viewer |

## 3.2 UC02: output information from an aasx file as json through the api<a name="uc02"></a>

| Use Case ID | UC02 |
| :-- | :-- |
| Description | The user wants information from an aasx file in json format |
| Involved roles | User, API |
| System boundary | Aasx file content |
| Precondition | The desired aasx file is available in the database |
| Postcondition on success | A json with all relevant information is made accessible to the user |
| Triggering event | The user calls the api |

## 4 Customer Requirements <a name="requirements"></a>

These requirements are the basis of the contract with the customer and form, depending on the priority, the precondition for the customer's acceptance of the project.


| priority levels | code |
| :-- | :-- |
| Must Have | 1 |
| Should Have | 2 |
| Could Have | 3 |

## 4.1  Functional Requirements <a name="fr"></a>

## 4.1.1 FR.001 Preserving functionality <a name="fr01"></a>

| Requirement ID | FR.001    lvl: 1 |
| :-- | :-- |
| Overview | The goal of the project is to increase usability, thus no limitations should follow from the changes made in this project |
| Fit criterion | The building/deployment process for the aas viewer should not change. At least all data that currently can be found through the UI or api should be accessible, through similar methods, at the end of the project |

## 4.1.2 FR.002 Sorting <a name="fr02"></a>

| Requirement ID | FR.002    lvl: 1 |
| :-- | :-- |
| Overview | All loaded aasx shells should be sortable, thus improving the user experience |
| Fit Criterion | The shells seen in the left sidebar should be sortable by relevant information, if available: ManufacturerName, ProductDesignation, OrderCode, ManufacturerCode and globalAssetId and createdAt |

## 4.1.3 FR.003 Search <a name="fr03"></a>

| Requirement ID | FR.003    lvl: 1 |
| :-- | :-- |
| Overview | The shell search scope should be greatly expanded, by searching through more information |
| Fit Criterion | The functionality of the "search for AAS" input fields should be expanded so it recursively searches through all file content for matching strings (depth can be adjusted to match performance requirements) a similar issue is described in [https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/209](https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/209) in the best case this issue is resolved as well |

## 4.1.4 FR.004 Nameplate generator <a name="fr04"></a>

| Requirement ID | FR.004    lvl: 1 |
| :-- | :-- |
| Overview | The "Nameplate generator" is a submodule to generate nameplates it should be integrated into the Plugin submodule "Digital Nameplate" |
| Fit criterion | The "Nameplate generator" is part of the submodule "Digital Nameplate" |

## 4.1.5 FR.005 API enhancements <a name="fr05"></a>

| Requirement ID | FR.005    lvl: 2 |
| :-- | :-- |
| Overview | The information given by the api is expanded |
| Fit Criterion | The API returns all available information with each call (focus on the call localhost:8081/shells) |

## 4.1.6 FR.538 Improve labeling of Input Variables (github issue 538) <a name="fr538"></a>

| Requirement ID | FR.538    lvl: 3 |
| :-- | :-- |
| Overview | Boolean values should have an extra label |
| Fit Criterion | resolving: [https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/538](https://github.com/eclipse-basyx/basyx-aas-web-ui/issues/538) |

## 4.2  Non-functional Requirements <a name="nfr"></a>



## 4.2.1 NFR.001 User-friendly <a name="nfr01"></a>


| Requirement ID | NFR.001 |
| :-- | :-- |
| Overview | The UI should become more user friendly. As the main goal this NFR is especially important |
| Fit Criterion | Every user experienced with the software should find all features that were already present within 10 minutes. An inexperienced user (in terms of the basyx aas viewer not aasx datastructure) should find the desired information within 20 minutes and at the most 5 clicks |

## 4.2.2 NFR.002 Performance <a name="nfr02"></a>

| Requirement ID | NFR.002 |
| :-- | :-- |
| Overview | The software should not become considerably slower because of the new features |
| Fit Criterion | The general speed (opening submenus etc) and api request time should not exceed 0.2 additional seconds compared to the current version. The search functionality should give at least one answer in 30 seconds |

## 4.2.3 NFR.003 Stability <a name="nfr03"></a>

| Requirement ID | NFR.003 |
| :-- | :-- |
| Overview | The software runs stable |
| Fit Criterion | The software doesn't crash under expected usage and be resistant to high user input frequency. This should be verified with tests |

## 4.2.4 NFR.004 Maintainability <a name="nfr04"></a>

| Requirement ID | NFR.004 |
| :-- | :-- |
| Overview | The software should be maintainable |
| Fit Criterion | The documentation is extensive enough so that each potential user can use the improvements within 10 minutes. Each developer that works on the project should understand the changes within one hour |

## 4.2.5 NFR.005 License <a name="nfr05"></a>

| Requirement ID | NFR.005 |
| :-- | :-- |
| Overview | The software requires a license |
| Fit Criterion | The license should not change from the current version |