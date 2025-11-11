# **CUSTOMER REQUIREMENTS SPECIFICATION**

## Projekt 6: API für den Digitalen Produktpass (DPP) im BaSyx Framework

### Customer
|Name|Mail|
|---|---|
|Markus Rentschler|rentschler@lehre.dhbw-stuttgart.de|
|Pawel Wojcik|pawel.wojcik@lehre.dhbw-stuttgart.de|


### Aufgabenstellung
 > Die **DIN EN 18222** "Digitaler Produktpass -        Programmierschnittstellen (APIs) für das Lebenszyklusmanagement und die Durchsuchbarkeit vom Produktpass" beschreibt eine REST-API, welche im Rahmen dieser Aufgabe im BaSyx-Framework implementiert werden soll, sowohl Backend- als auch Frontendseitig. Die genaue Aufgabenstellung kann <a href="https://github.com/DHBW-TINF24F/.github/blob/main/project6_basyx_dpp_api.md">hier</a> gefunden werden.

### Dokumenthistorie

|Version|Autor|Datum|Kommentar|
|---|---|---|---|
|1.0| Magnus Lörcher |11.11.2025| Abgabe Semester 3|


## Table of contents

## Introduction
This document defines and specifies the requirements for the implementation of a *REST-API* for the management of Digital Product Pass (DPP) acording to **DIN-EN 18222**. The implementation includes both a backend for the **REST-API** as well as a frontend for users to interact/manage DPP's with. The implementation will be built upon the BaSyx framework.\
**DIN-EN 18222** describes an API for life cycle management as well as searching within the "Product Pass" which will be the foundation of the developed solution.\
The project will be developed as an open source repo on GitHub and after the conclusion of the project merged in to the BaSyx repository.

This CRS will be the foundation for the folowing documents:\
Software Requirements Specification (SRS), every other design, test and implementation document.

## Scope
The main goal of this project is the implementation of a **REST-API** for the management of DPP's with in the BaSyx framework. The folowing scopes will be **asdljasfd**.
| **Scope** | **Aim**|
| --- | --- |
| API specification (**DIN-EN 18222**) | Create an OpenAPI-Specification for the **REST-API** described by **DIN-EN 18222** |
| Backend implementation | Implementation of the DPP **REST-API** backend using the **DJANGO** framework. The backend will expose API endpoints for the frontend to provide the described DPP functionality. This includes merging existing API's of the BaSyx backend. |
| Frontend implementation | The frontend (DPP viewer) will provide a UI to the end users to interact with and manage the DPP using the DPP backend. The DPP viewer will be integrated in to the existing BaSyx frontend module. |
| Usability and workflow | Definition of a clear usability concept as well as a workflow for the DPP viewer based on existing solutions. |
| Infrastructure and Deployment | The project will be hosted on a publically available server for demonstration purposes.|
| Documentation | The enire project documentation will be hosted in the wiki of the GitHub repository. |

<br>
<br>

## Business Processes - BP

### BP02: Usability concept and DPP-viewer

|||
| --- | ---|
| ID | BP02 |
| Roles involved | Product manager, Developer, Tester |
| Result | The developed Usability concept has been converted in to a functional frontend for the **REST-API**. |
| Procedure | <ol><li>Analyze the existing BaSyx solution.</li><li>Define a usability concept and workflow for the DPP-viewer.</li><li>Develop the frontedn application.</li><li>Create suitable DPP examples for showcasing.</li><li>Test the solution.</li></ol>|
| Checkpoints | <ul><li>Creation of the usability concept.</li><li>First successfull display of a DPP.</li><li>Finish the DPP-viewer.</li></ul> |

### BP03: Hosting and Dokumentation
|||
| --- | ---|
| ID | BP03 |
| Roles involved | Technical writer, Project Manager, Developer |
| Result | The entire project is fully documented and publically accessable.  |
| Procedure |  <ol><li>Hosting the developed solution on a publicaly accessable demo Server</li><li>Finalize and collect the entire project documentation in the repositories wiki</li></ol>|
| Checkpoints | <ul><li>The demo server is accessable publicaly</li><li>The solution runs on the demo server</li><li>The documentation is finalized</li></ul> |

## Use cases
### UC01 create/register DPP

|||
|---|---|
| ID | UC01|
| Description| Create a new AAS instance or import an existing one and add additional information/submodles for the Dpp.|
| Roles involved||
| Prerequisit| Existing BaSyx backend with AAS API|
| Procedure| Using the existing AAS API of BaSyx register or create a new AAS instance through the Dpp API. |
| Result| The user can create or import AAS instances and use the DPP for further management|


### UC02 read/search
|||
|---|---|
| ID | UC02|
| Description| Search through the DPP database and read data from it|
| Roles involved||
| Prerequisit| Existing BaSy backend with AAS API|
| Procedure| Identify the DPP in question by either an ID(API endpoint: dpps/{dppId}) or by an AAS atribute. Show available information on the requested DPP in the Dpp viewer.|
| Result| The user can search through existing DPPs and show their information|


### UC03 Update DPPs
|||
|---|---|
| ID | UC03|
| Description| Update an existing DPPs status or submodles for lifecycle management|
| Roles involved||
| Prerequisit| BaSyx API, Search DPPs|
| Procedure| Search for a DPP using the functionality described above. Edit the DPPs status to refelct changes in the lifecycle|
| Result| The user can manage the lifecycle of an existing DPP|


### UC04 display DPP information
|||
|---|---|
| ID | UC04|
| Description| The graphical user interface allows the user to interact with and manage their DPPs. Abstraction layer of the backend API|
| Roles involved||
| Prerequisit| DPP backend API is implemented (at least partialy)|
| Procedure| Implement a coherent and intuitive UI to provide an abstraction layer for the DPP backend. All functionality of the backend is covered in the frontend.|
| Result| The user can use the DPP viwer to manage their DPPs|


### UC05 Exporting DPPs
|||
|---|---|
| ID | UCxx|
| Description| Export existing DPPs as JSON/AASX|
| Roles involved||
| Prerequisit|BaSyx API, Search for DPPs|
| Procedure| Find the requested DPP in the existing ones. Give an option to export the DPP for sharing or future importing|
| Result| The user can export an existing DPP|


## Functional Requirements

### FR01 OpenAPI-Specification
|||
|---|---|
| ID | FR01|
| Description| The REST-API for the Dpp is described in an OPEN-API-Specification based on the **DIN-EN 18222** |

### FR02 Norm conformity
|||
|---|---|
| ID | FR02 |
| Description| The REST-API has to implement all endpoints and operations described in **DIN-EN 18222**|


### FR04 DPP search
|||
|---|---|
| ID | FR07|
| Description| The existing DPPs are searchable by ID or other DPP parameter.|

### FR05 Creation of Dpp examples
|||
|---|---|
| ID | FR05|
| Description| To demonstrate the capabilities of the Dpp viewer/backend a few example Dpps are created / chosen.|


### FR06 DPP export as JSON
|||
|---|---|
| ID | FR06|
| Description| see UC|

### FR06 Dpp-viewer/frontend
|||
|---|---|
| ID | FR03|
| Description| A web based frontend where users can use the REST-API backend for their Dpp lifecycle management|

## Nonfunctional Requirements

### NFR07 Usability concept and workflow definition
|||
|---|---|
| ID | FR04|
| Description| A usability concept and workflows for all possible user interactions in the Dpp-viewer are defined to enshure optimal user guidance|


### NFR08 Documentation creation
|||
|---|---|
| ID | FR06|
| Description| The project documentation allows future users or developers to continue the project. Every importand development step is documented. A user documentation is created to allow users to setup the DPP lifecycle management|

### NFR Performance
|||
|---|---|
| ID | NFR01|
| Description| The DPP API calls are optimized for run time and server load. The p95 respons time for 100 simultanius read requests should <300ms. The p95 respons time for an indexed search with a hit before 10k entries should be <800ms|

### NFR Deployability
|||
|---|---|
| ID | NFR02|
| Description| There exists a containerized version of the project for easy deployment using docer|

### NFR Hosting on Demoserver
|||
|---|---|
| ID | NFR03|
| Description| The project is hosted on a publically accessible demo server for presentation, testing and development|

### NFR Code quality
|||
|---|---|
| ID | NFR04|
| Description| The development process is documented and reviewd regularly to enshure adherence to best practices|


## 10. Quellen & Referenzen
|NR.|Referenz|Titel|Version|Beschreibung|
|---|---|---|---|---|
|1|DIN EN 18222|Digital Product Passport - Application Programming Interfaces (APIs) for the product passport lifecycle management and searchability|2025|Dokument, dass die Anforderungen an eine API für den Digitalen Produktpass enthält.|
|2|Aufgabenstellung| Aufgabenstellung Team 6|2025||