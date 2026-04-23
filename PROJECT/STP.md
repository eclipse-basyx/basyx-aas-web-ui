# System Test Plan

## Revision History

| Version | Date | Author | Comment |
| :-- | :-- | :-- | :-- |
| 0.1.0 | 18.03.2026 | Mattis Weigold | Rough Structure and Introduction |
| 0.1.1 | 14.04.2026 | Mattis Weigold | Add Req. ID Links to SRS |
| 0.2.0 | 22.04.2026 | Mattis Weigold | Add Test Cases 1-4 |
| 0.3.0 | 23.04.2026 | Mattis Weigold | Add Test Cases 5-6 |

## Table of Contents

1. [Introduction](#1-introduction)
    1.1 [Purpose](#11-purpose)
    1.2 [Scope](#12-scope)
2. [Product Names and Attributes](#2-product-names-and-attributes)
3. [Requirements](#3-requirements)
4. [Test Cases](#4-test-cases)
9. [References](#5-references)

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
| [FR.001 / Preserve existing functionality](SRS.md#41-fr001--preserve-existing-functionality) | All existing viewer functions must remain intact after enhancement. | -- | *automatically tested via existing unit tests* |
| [FR.002 / Sorting](SRS.md#42-fr002--sorting) | Implement dynamic sorting of shells by key attributes. | A | [TC.001](#41-tc001-aas-sorting-and-filtering-validation) |
| [FR.003 / Search](SRS.md#43-fr003--search) | Extend search functionality recursively through AAS content. | A | [TC.001](#41-tc001-aas-sorting-and-filtering-validation) |
| [FR.004 / Nameplate generator integration](SRS.md#44-fr004--nameplate-generator-integration) | Integrate submodule into digital nameplate plugin. | A | [TC.002](#42-tc002-correct-frontend-communication-for-nameplate-generator); [TC.003](#43-tc003-correct-backend-communication-for-nameplate-generator) |
| [FR.005 / API enhancements](SRS.md#45-fr005--api-enhancements) | Extend JSON output for `/shells` endpoint. | A | [TC.004](#44-tc004-json-conversion) |
| [FR.006 / Improved labeling](SRS.md#46-fr006--improved-labeling) | Add extra labels for Boolean values. | B | [TC.005](#45-tc005-boolean-input-reading); [TC.006](#46-tc006-boolean-input-setting) |
| [NFR.001 / Usability](SRS.md#51-nfr001--usability) | UI improvements must reduce average task time. | -- | *no testing* |
| [NFR.002 / Performance](SRS.md#52-nfr002--performance) | No significant delay from enhancements. | D | *no testing* |
| [NFR.003 / Stability](SRS.md#53-nfr003--stability) | Application should not crash under standard or rapid usage. | C | *no testing* |
| [NFR.004 / Maintainability](SRS.md#54-nfr004--maintainability) | Clear documentation and readable code. | -- | *no testing* |
| [NFR.005 / Licensing](SRS.md#55-nfr005--licensing) | Maintain current open-source license. | -- | *no testing* |

## 4. Test Cases

### 4.1 <TC.001> AAS Sorting and Filtering Validation
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
      AAS Sorting and Filter Validation
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Req.-ID:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      FR.002; FR.003
    </td>
  </tr>
  <tr>
    <td style="border:1px solid black; padding:8px;"><strong>Description:</strong></td>
    <td colspan="3" style="border:1px solid black; padding:8px;">
      The test case verifies that with a given input, AAS Shells are correctly filtered and sorted in the search list.
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

### 4.2 <TC.002> Correct Frontend Communication for Nameplate Generator
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

### 4.3 <TC.003> Correct Backend Communication for Nameplate Generator
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

### 4.4 <TC.004> JSON Conversion
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

### 4.5 <TC.005> Boolean Input Reading
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

### 4.6 <TC.006> Boolean Input Setting
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

## 5. References

- [Software Requirements Specification (SRS)](SRS.md)
