# TINF24F_2-MOD-1v0 — Module Documentation (MOD)

**Project:** BaSyx Viewer Plugin Extension  
**Module:** Digital Nameplate Generator & Exporter  
**Team:** Team 2  
**Role owner:** Manuel Sposato (Project Leader / Feature Lead)  
**Date:** 2026-05-01  
**Status:** Draft v1.0  

---

## Table of Contents

- [Version Control](#version-control)
- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Definitions, Acronyms, Abbreviations](#13-definitions-acronyms-abbreviations)
- [2. Module: Nameplate Generator & Exporter](#2-module-nameplate-generator--exporter)
  - [2.1 Overview](#21-overview)
  - [2.2 User Flow](#22-user-flow)
  - [2.3 Architecture & File Structure](#23-architecture--file-structure)
  - [2.4 Key Components](#24-key-components)
  - [2.5 Data Flow](#25-data-flow)
  - [2.6 Error Handling](#26-error-handling)
- [3. Setup & Run Instructions](#3-setup--run-instructions)
  - [3.1 Critical Backend Initialization](#31-critical-backend-initialization)
- [4. Module Tests](#4-module-tests)
- [5. Known Limitations](#5-known-limitations)

---

## Version Control

| Version | Date       | Author         | Notes                                                                 |
|---------|------------|----------------|-----------------------------------------------------------------------|
| 1.0     | 2026-05-01 | Manuel Sposato | Initial Draft for Nameplate Generator implementation & UI integration |

---

## 1. Introduction

### 1.1 Purpose

This Module Documentation (MOD) describes the **Digital Nameplate Generator & Exporter** feature implemented as part of the BaSyx Viewer Plugin Extension. It explains how a standalone Nameplate Generator backend (adopted from a previous development group) was successfully integrated, modified, and connected to the BaSyx Vue.js frontend.

The intended readers are developers, testers, and project owners who want to understand how the generation pipeline is triggered and how the backend API serves the frontend component.

### 1.2 Scope

This document covers the bridging between the BaSyx Web UI and the Nameplate Generator Backend. It explicitly focuses on:
*   The frontend trigger mechanism in `Nameplate_v3_0.vue`.
*   The backend entry point in `api.js`.

**Out of Scope for Testing:** The deep underlying logic inside the `DataRetrieval` and `NameplateGeneration` directories of the backend. These were adopted from a previous team, integrated as legacy modules, and modified only to the extent necessary to ensure full functionality with the current system. They do not require extensive architectural re-testing.

### 1.3 Definitions, Acronyms, Abbreviations

| Term | Meaning |
|------|---------|
| AAS | Asset Administration Shell |
| Legacy-Peer-Deps | An npm flag required to bypass strict dependency tree resolution for older, adopted Node.js packages |
| API | Application Programming Interface (the `api.js` bridging the frontend and backend) |

---

## 2. Module: Nameplate Generator & Exporter

### 2.1 Overview

The module provides users with the ability to dynamically generate and download a digital nameplate directly from an Asset Administration Shell's submodel. 

Instead of rewriting the entire generation logic, the project adopted an existing `nameplate-generator-backend`. The primary engineering achievement of this module is the successful integration and API-bridging of this backend into the modern BaSyx `aas-web-ui`, making the feature accessible via a seamless UI interaction.

### 2.2 User Flow
```text
1. User navigates through the AAS registry in the BaSyx Viewer.
        ↓
2. User opens an AAS that contains a "Nameplate" folder/submodel.
        ↓
3. User switches to the "Visualization" tab within the submodel view.
        ↓
4. User scrolls down to the dedicated Nameplate Generation section.
        ↓
5. User clicks the action button to generate and download the nameplate.
        ↓
6. The generated file is provided as a local download by the browser.
