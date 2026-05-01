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
| 0.6.0 | 28.04.2026 | Mattis Weigold | Redo Boolean Input Section |
| 0.7.0 | 29.04.2026 | Mattis Weigold | Add Nameplate Backend Test |
| 1.0.0 | 01.05.2026 | Mattis Weigold | Add manual Fields Test | 

## Table of Contents

1. [Introduction](#1-introduction)  
    1.1 [Purpose](#11-purpose)  
    1.2 [Scope](#12-scope)  
2. [Product Names and Attributes](#2-product-names-and-attributes)  
3. [Requirements](#3-requirements)  
4. [Test Methodology](#4-test-methodology)  
    4.1 [Test Approach](#41-test-approach)   
    4.2 [Test Types](#42-test-types)   
    4.3 [Test Environment](#43-test-environment)    
    4.4 [Test Execution](#44-test-execution)  
    4.5 [Entry and Exit Criteria](#45-entry-and-exit-criteria)  
5. [Test Naming Convention](#5-test-naming-convention)  
6. [Test Cases](#6-test-cases)  
7. [References](#7-references)  

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
| [FR.002 / Sorting (SORT)](SRS.md#42-fr002--sorting) | Dynamic sorting of shells by key attributes. | A | [TS.SORT.001.FAS](#61-tssort001fas-aas-sorting-validation) |
| [FR.003 / Filtering (FLTR)](SRS.md#43-fr003--search) | Add Filters for searching shells. | A | [TS.FLTR.001.FAS](#62-tsfltr001fas-aas-filtering-validation) |
| [FR.004 / Nameplate generator integration (GEN)](SRS.md#44-fr004--nameplate-generator-integration) | Integrate submodule into digital nameplate plugin. | B | [TS.GEN.001.FAS](#63-tsgen001fas-correct-frontend-communication-for-nameplate-generator); [TS.GEN.002.FAS](#64-tsgen002fas-correct-backend-communication-for-nameplate-generator) |
| [FR.005 / CreatedAt and UpdatedAt support (FIELDS)](SRS.md#45-fr005--api-enhancements) | Adds two datetime fields to be recieved from the API | D | [TC.FIELDS.001.F](#65-tcfields001f-display-and-integrity-of-datetime-fields) |
| [FR.006 / Improved labeling](SRS.md#46-fr006--improved-labeling) | Add extra labels for Boolean values in "Operations" submodules to a visual switch instead of text. | C | [TS.BOOL.001.FAS](#66-tsbool001fas-boolean-input-validation) |
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

- **UI Testing (Manual)**  
  Verifies correct rendering and interaction behavior.

### 4.3 Test Environment

Tests are executed in the following environment:

- Web browser (e.g., Firefox)  
- Local or test deployment of the BaSyx AAS Web UI  
- Backend services in a local or test setup  
- Predefined test data  

### 4.4 Test Execution

Tests are executed:

- Automatically via unit and integration tests  
- Manually for UI validation  

A test is successful if the observed behavior matches the expected requirement.

### 4.5 Entry and Exit Criteria

**Entry Criteria:**
- Features are implemented  
- Test environment is ready  

**Exit Criteria:**
- All test cases executed  
- No critical defects remain  
- Results documented in the STR

## 5. Test Naming Convention

Test cases and Test Suits will be named in the following way:

TCT.FUNC.SQNR.TT

– TCT = Testcase Type (TS = Test Suite TC = Testcase)
– FUNC = Abbreviation for the related requirement functionality
– SEQNR = sequential numbering of testcase (001)
– TT = Test type (C = Conformance, F = Functional, L = Load/Stress, combined with A = Automated and/or S = Smoke/Regression)

## 6. Test Cases/Suites

### 6.1 <TS.SORT.001.FAS> AAS Sorting Validation
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test Suite
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TS.SORT.001.FAS&gt;</td>
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
      The test suite verifies that with a given input, AAS Shells are correctly sorted in the search list.
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

### 6.2 <TS.FLTR.001.FAS> AAS Filtering Validation
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test Suite
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TS.FLTR.001.FAS&gt;</td>
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
      The test suite verifies that with a given input, AAS Shells are correctly filtered in the search list.
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

### 6.3 <TS.GEN.001.FAS> Correct Frontend Communication for Nameplate Generator
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test Suite
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TS.GEN.001.FAS&gt;</td>
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
      The test suite verifies that the Nameplate Generator api gets correctly called from the frontend and responses get handled appropriately.
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Unit test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">SOURCE/aas-web-ui/tests/components/Nameplate_v3_0.text.ts</td>
  </tr>
</table>

### 6.4 <TS.GEN.002.FAS> Correct Backend Communication for Nameplate Generator
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test Suite
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TS.GEN.002.FAS&gt;</td>
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
      The test suite verifies that the Nameplate Generator api correctly handles calls and returns valid data by
      accepting and parsing the request,
      calling an external API and
      returning generated HTML (or an error)
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Integration test
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">
      SOURCE/aas-test-backend/nameplate-generator-backend/tests/nameplate.test.js
    </td>
  </tr>
</table>

### 6.5 <TC.FIELDS.001.F> Display and Integrity of Datetime Fields
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test Case
    </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px; ">&lt;TC.FIELDS.001.F&gt;</td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      Display and Integrity of Datetime Fields
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
      The test case verifies that AAS Files containing 'createdAt' and 'updatedAt' Fields can be uploaded and will be correctly displayed in the AAS Web UI.
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Preconditions:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      <ul>
        <li>System is running</li>
        <li>Test dataset is available</li>
        <li>Backend reachable</li>
      </ul>
    </td>
  </tr>

  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;">
      Test Steps
    </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">1</th>
    <td colspan="2" style="border:1px solid black; padding:8px;">
      Upload AAS file with 'createdAt' and/or 'updatedAt' to the backend
    </td>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">2</th>
    <td colspan="2" style="border:1px solid black; padding:8px;">
      Refresh AAS list
    </td>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">3</th>
    <td colspan="2" style="border:1px solid black; padding:8px;">
      Open uploaded AAS entry
    </td>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">4</th>
    <td colspan="2" style="border:1px solid black; padding:8px;">
      Verify displayed datetime fields on the bottom metadata panel
    </td>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;"><strong>Expected Results:</strong></th>
    <td colspan="2" style="border:1px solid black; padding:8px;">
      <ul>
        <li>Fields are displayed only if present in input</li>
        <li>Values match backend JSON exactly</li>
        <li>Format is correctly rendered</li>
        <li>No UI errors occur</li>
      </ul>
    </td>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;"><strong>Pass Criteria:</strong></th>
    <td colspan="2" style="border:1px solid black; padding:8px;">
      All validations succeed for all datasets
    </td>
  </tr>
</table>

### 6.6 <TS.BOOL.001.FAS> Boolean Input Validation
<table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif;">
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;"> Test Suite </th>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;"> &lt;TS.BOOL.001.FAS&gt; </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Name:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;"> Boolean Input Validation </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;"> FR.006 </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      This test suite verifies that the BooleanInput component correctly handles boolean values within the AAS UI. It includes validation of input normalization (string to boolean), correct visual representation (labels and styling), event emission on user interaction, and reactivity to prop changes.
    </td>
  </tr>
  <tr>
    <th colspan="3" style="border:1px solid black; padding:8px; text-align:center;"> Unit test </th>
  </tr>
  <tr>
    <th style="border:1px solid black; padding:8px; text-align:center;">Found in:</th>
    <td colspan="2" style="border:1px solid black; padding:8px; text-align:center;">
      SOURCE/aas-web-ui/tests/components/BooleanInput.test.ts
    </td>
  </tr>
</table>

## 7. References

- [Software Requirements Specification (SRS)](SRS.md)
