# **CUSTOMER REQUIREMENTS SPECIFICATION**

TIN24F, SWL Practice project 2025/2026

## ***BaSyx DPP API***

*Customers*: Rentschler Markus, Pawel Wojcik

*Supplier*: Team 6

| **Position**     | **Name**        | **e-Mail**                         |
|------------------|-----------------|------------------------------------|
| Project Manager  | Nataliia Chubak | <inf24271@lehre.dhbw-stuttgart.de> |
| Productmanager   | Luca Schmoll    | <inf24137@lehre.dhbw-stuttgart.de> |
| Produktmanager   | Magnus Lörcher  | <inf24155@lehre.dhbw-stuttgart.de> |
| Testmanager      | Manuel Lutz     | <inf24224@lehre.dhbw-stuttgart.de> |
| Systemarchitekt  | Noah Becker     | <inf24038@lehre.dhbw-stuttgart.de> |
| Technical writer | Fabian Steiß    | <inf24138@lehre.dhbw-stuttgart.de> |
| UI-Designer      | Felix Schulz    | <inf24075@lehre.dhbw-stuttgart.de> |

Address: Lerchenstraße 1

70178 Stuttgart

**Version Control**

| **Version** | **Date**   | **Author**      | **Comment**                         |
|-------------|------------|-----------------|-------------------------------------|
| 1.0         | 12.10.2025 | Nataliia Chubak | Initial and create the CRS          |

## **TABLE OF CONTENTS**

1. [INTRODUCTION](#intro)
2. [PRODUCT ENVIRONMENT](#prod_env)
3. [PRODUCT USAGE](#produsage)
    - 3.1 [Business Processes](#bp)                            
    - 3.2 [Use Cases](#uc)                               
4. [FEATURES](#features)
    - [/LF10/ *DIN EN 18222 API Implementation*](#lf10)
    - [/LF20/ *DPP Viewer*](#lf20)
    - [/LF30/ *Error handing*](#lf30)
6. [5 NON-FUNCTIONAL REQUIREMENTS](#nfr)
    - [/NF10/ *Usability*](#nfr10)
    - [/NF20/ *Documantation Quality*](#nfr20)
    - [/NF30/ *Maintainability*](#nfr20)     

## 1 INTRODUCTION <a name="intro"></a>

The goal of project is to develop a user-friendly API for DPP (Digital Product Passwort) according to the specifications
in DIN 18222 "Digitaler Produktpass - Programmierschnittstellen (APIs) für das Lebenszyklusmanagement und die Durchsuchbarkeit 
vom Produktpass".

This development is to be realised within the BaSyx framework, including both the backend (API Logic) and the frontend (DPP Viewer UI).
The goal is to improve the search and lifecycle management of DPP.

## 2 PRODUCT ENVIRONMENT <a name="prod_env"></a> 

Eclipse BaSyx is the open-source platform used to facilitate the development and use of Digital Twins in Industry 4.0. The project will
use the BaSyx-Framework, which is the official open-source reference implementation for Asset Administration Shells (AAS).
Asset Administration Shells (AAS) form the basis for Digital Twins and underpin the DPP. AAS enables the creation of detailed digital models
that represent the characteristics and functionality of real-world assets, providing a unified interface for their management.
Digital Product Passports (DPPs) shall be modeled as Product Administration Shells within the BaSyx ecosystem.
The core technical requirement is the implementation of the API defined in DIN EN 18222.

## 3 PRODUCT USAGE <a name="produsage"></a>

## 3.1 Business Processes <a name="bp"></a>

| ID                        | BP.001          | 
|---------------------------|-----------------|
| Name of Business Process  | ############### |
| Triggering Event          | ############    | 
| Result                    | ############    | 
| involved Roles            | ############    | 

## 3.2 Use Cases <a name="uc"></a>
Requirements are described with ID and Overview, enabling the developing team to understand the requirements and fulfill them in their developing process.

| ID                                | UC.001          | 
|-----------------------------------|-----------------|
| Use Case Objective                | ############### |
| Related Business Process          | ############    | 
| Task                              | ############    | 

## 4 FEATURES <a name="features"></a>

/LF10/ *DIN EN 18222 API Implementation*  <a name="lf10"></a>
The system shall provide all REST-API endpoints for DPP lifecycle management and searchability as defined in DIN EN 18222.

/LF20/ *DPP Viewer* <a name="lf10"></a>
The system shall provide a graphical user interface (GUI) component (based on the BaSyx-UI) that allows the user to search, filter,
and view DPP content according to the defined Usability-Concept.

/LF30/ *Error handing* <a name="lf10"></a>
The system shall be able to handle errors (no entries found, unexpected errors, ...) and throw an error to the user. 



## 5 NON-FUNCTIONAL REQUIREMENTS <a name="nfr"></a>

/NF10/ *Usability* <a name="nfr10"></a>
The DPP Viewer should be easy to use, letting users access complex information quickly and without needing extra training.

/NF20/ *Documantation Quality*  <a name="nfr20"></a>
The documentation (user documentation) must be accurate, complete, and clearly structured to support new developers and end-users.

/NF30/ *Maintainability*  <a name="nfr30"></a>
The code should be clean, well-organized, and follow Eclipse BaSyx rules so it can be accepted and added to the main project


