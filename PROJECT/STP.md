# System Test Plan

## Revision History

| Version | Date | Author | Comment |
| :-- | :-- | :-- | :-- |
| 0.1.0 | 18.03.2026 | Mattis Weigold | Rough Structure and Introduction |
| 0.1.1 | 14.04.2026 | Mattis Weigold | Add Req. ID Links to SRS |

## Table of Contents

1. [Introduction](#1-introduction)
    1.1 [Purpose](#11-purpose)
    1.2 [Scope](#12-scope)
2. [Product Names and Attributes](#2-product-names-and-attributes)
3. [Requirements](#3-requirements)
4. [Test Preparation Strategy](#4-test-preparation-strategy)
5. [Test Execution Strategy](#5-test-execution-strategy)
6. [Test Equipment](#6-test-equipment)
7. [Test Schedule and Budget](#7-test-schedule-and-budget)
8. [Test Planning](#8-test-planning)
9. [References](#9-references)
10. [Appendix](#10-appendix)

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

| Req. ID / Name | Functionality | Priority | Testsuit |
| :-- | :-- | :-- | :-- |
| [FR.001 / Preserve existing functionality](SRS.md#41-fr001--preserve-existing-functionality) | All existing viewer functions must remain intact after enhancement. |  | TODO |
| [FR.002 / Sorting](SRS.md#42-fr002--sorting) | Implement dynamic sorting of shells by key attributes. |  | TODO |
| [FR.003 / Search](SRS.md#43-fr003--search) | Extend search functionality recursively through AAS content. |  | TODO |
| [FR.004 / Nameplate generator integration](SRS.md#44-fr004--nameplate-generator-integration) | Integrate submodule into digital nameplate plugin. |  | TODO |
| [FR.005 / API enhancements](SRS.md#45-fr005--api-enhancements) | Extend JSON output for `/shells` endpoint. |  | TODO |
| [FR.006 / Improved labeling](SRS.md#46-fr006--improved-labeling) | Add extra labels for Boolean values. |  | TODO |
| [NFR.001 / Usability](SRS.md#51-nfr001--usability) | UI improvements must reduce average task time. |  | TODO |
| [NFR.002 / Performance](SRS.md#52-nfr002--performance) | No significant delay from enhancements. |  | TODO |
| [NFR.003 / Stability](SRS.md#53-nfr003--stability) | Application should not crash under standard or rapid usage. |  | TODO |
| [NFR.004 / Maintainability](SRS.md#54-nfr004--maintainability) | Clear documentation and readable code. |  | *no testing* |
| [NFR.005 / Licensing](SRS.md#55-nfr005--licensing) | Maintain current open-source license. |  | *no testing* |

## 4. Test Preparation Strategy

## 5. Test Execution Strategy

## 6. Test Equipment

## 7. Test Schedule and Budget

## 8. Test Planning

## 9. References

- [Software Requirements Specification (SRS)](SRS.md)

## 10. Appendix
