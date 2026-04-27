# System Test Plan

## Revision History

| Version | Date | Author | Comment |
| :-- | :-- | :-- | :-- |
| 0.1.0 | 18.03.2026 | Mattis Weigold | Rough Structure and Introduction |
| 0.1.1 | 14.04.2026 | Mattis Weigold | Add Req. ID Links to SRS |
| 0.2.0 | 22.04.2026 | Mattis Weigold | Add Test Cases 1-4 |
| 0.3.0 | 23.04.2026 | Mattis Weigold | Add Test Cases 5-6 |
| 0.4.0 | 24.04.2026 | Mattis Weigold | Add Test Methodology |
| 0.5.0 | 27.04.2026 | Mattis Weigold | Split Case 1 into Filtering and Sorting |

## Table of Contents

1. [Introduction](#1-introduction)
    1.1 [Purpose](#11-purpose)
    1.2 [Scope](#12-scope)
2. [Product Names and Attributes](#2-product-names-and-attributes)
3. [Requirements](#3-requirements)
4. [Test Methodology](#4-test-methodology)
5. [Test Cases](#5-test-cases)
6. [References](#6-references)

## 1. Introduction

### 1.1 Purpose

The System Test Plan (STP) is designed to validate the **BaSyx Viewer Plugin Extensions** developed in this project by defining tests for their key functionalities. These tests ensure that the software meets the customer’s requirements, which are derived from the System Requirements Specification (SRS).

### 1.2 Scope

The tests verify that both functional and non-functional requirements are adequately addressed by the implemented features. The document derived from the STP is the System Test Report (STR), which also records the test results.

## 2. Product Names and Attributes

| Ref. ID | Product Number | Product Name | Product Description |
| :-- | :-- | :-- | :-- |
| 1 | v2-260309 | BaSyx AAS Web UI | Web-based user interface for managing and interacting with Asset Administration Shells (AAS) |

## 3. Requirements

| Req. ID / Name | Functionality | Priority | Testsuit ID or TCS Link |
| :-- | :-- | :-- | :-- |
| [FR.002 / Sorting](SRS.md#42-fr002--sorting) | Dynamic sorting of shells by key attributes. | A | [TC.001](#51-tc001-aas-sorting-and-filtering-validation) |
| [FR.003 / Filtering](SRS.md#43-fr003--search) | Add Filters for searching shells. | A | [TC.002](#52-tc002-aas-filtering-validation) |
| [FR.004 / Nameplate generator integration](SRS.md#44-fr004--nameplate-generator-integration) | Integrate submodule into digital nameplate plugin. | A | [TC.003](#53-tc002-correct-frontend-communication-for-nameplate-generator); [TC.004](#54-tc003-correct-backend-communication-for-nameplate-generator) |
| [FR.005 / CreatedAt and UpdatedAt support](SRS.md#45-fr005--api-enhancements) | Adds two datetime fields to be recieved from the API | A | [TC.005](#55-tc004-json-conversion) |
| [FR.006 / Improved labeling](SRS.md#46-fr006--improved-labeling) | Add extra labels for Boolean values in "Operations" submodules to a visual switch instead of text. | B | [TC.006](#56-tc005-boolean-input-reading); [TC.007](#57-tc006-boolean-input-setting) |
| [NFR.001 / Usability](SRS.md#51-nfr001--usability) | UI improvements must reduce average task time. | -- | *no testing* |
| [NFR.002 / Performance](SRS.md#52-nfr002--performance) | No significant delay from enhancements. | D | *no testing* |
| [NFR.003 / Stability](SRS.md#53-nfr003--stability) | Application should not crash under standard or rapid usage. | C | *no testing* |
| [NFR.004 / Maintainability](SRS.md#54-nfr004--maintainability) | Clear documentation and readable code. | -- | *no testing* |
| [NFR.005 / Licensing](SRS.md#55-nfr005--licensing) | Maintain current open-source license. | -- | *no testing* |

## 4. Test Methodology

### 4.1 Test Approach

The testing strategy for the **BaSyx Viewer Plugin Extensions** follows a combination of automated and manual testing approaches. The goal is to ensure that all functional requirements are fulfilled while maintaining system stability and performance.

Testing is structured into different levels:
- **Unit Testing** for validating isolated functions and components  
- **Integration Testing** for verifying correct interaction between frontend and backend components  
- **System Testing** for validating complete workflows from a user perspective  

Automated tests are primarily used for repeatable and regression-relevant functionality, while manual tests are used for UI-related validation.

### 4.2 Test Types

The following test types are applied:

- **Functional Testing**  
  Verifies that implemented features behave according to the requirements defined in the SRS.

- **Integration Testing**  
  Ensures correct communication between system components (frontend to backend, API calls).

- **API Testing**  
  Validates correctness and structure of JSON responses.

- **UI Testing (Manual)**  
  Verifies correct rendering and interaction behavior.09

### 4.3 Test Environment

Tests are executed in the following environment:

- Web browser (e.g., Firefox)  
- Local or test deployment of the BaSyx AAS Web UI  
- Backend services in a local or test setup  
- Predefined AAS datasets  

### 4.4 Test Data

Test data includes:

- AAS Shells with known attributes  
- Nested structures for search validation  
- Boolean values for input/output tests  

Edge cases:
- Empty fields  
- Large datasets  
- Special characters  

### 4.5 Test Execution

Tests are executed:

- Automatically via unit and integration tests  
- Manually for UI validation  

A test is successful if the observed behavior matches the expected requirement.

### 4.6 Entry and Exit Criteria

**Entry Criteria:**
- Features are implemented  
- Test environment is ready  

**Exit Criteria:**
- All test cases executed  
- No critical defects remain  
- Results documented in the STR  

## 5. Test Cases

### 5.1 <TC.001> AAS Sorting Validation
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.001&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      AAS Sorting Validation
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.002
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that with a given input, AAS Shells are correctly sorted in the search list.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">SOURCE/aas-web-ui/tests/components/AASList.sorting.test.ts</td>
  </tr>
</table>

### 5.2 <TC.002> AAS Filtering Validation
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.002&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      AAS Filtering Validation
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.003
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that with a given input, AAS Shells are correctly filtered in the search list.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">SOURCE/aas-web-ui/tests/components/AASList.filtering.test.ts</td>
  </tr>
</table>

### 5.3 <TC.003> Correct Frontend Communication for Nameplate Generator
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.003&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      Correct Frontend Communication for Nameplate Generator
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.004
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that the Nameplate Generator api gets correctly called from the frontend and responses get handled appropriately.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">src/........</td>
  </tr>
</table>

### 5.4 <TC.004> Correct Backend Communication for Nameplate Generator
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.004&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      Correct Backend Communication for Nameplate Generator
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.004
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that the Nameplate Generator api correctly handles calls and returns valid data.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">src/........</td>
  </tr>
</table>

### 5.5 <TC.005> JSON Conversion
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.005&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      JSON Conversion
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.005
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that the api correctly converts AAS into JSON.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">src/........</td>
  </tr>
</table>

### 5.6 <TC.006> Boolean Input Reading
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.006&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      Boolean Input Reading
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.006
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that the BooleanInput correctly reads its values from an AAS.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">src/........</td>
  </tr>
</table>

### 5.7 <TC.007> Boolean Input Setting
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.007&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      Boolean Input Setting
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.006
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that the BooleanInput correctly writes its values to the AAS.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">src/........</td>
  </tr>
</table>

## 6. References

- [Software Requirements Specification (SRS)](SRS.md)
