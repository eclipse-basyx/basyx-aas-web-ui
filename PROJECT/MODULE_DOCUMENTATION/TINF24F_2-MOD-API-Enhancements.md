# TINF24F_2-MOD-1v0 — Module Documentation (MOD)

**Project:** BaSyx Viewer Plugin Extension  
**Module:** CreatedAt and UpdatedAt support  
**Team:** Team 2  
**Role owner:** Manuel Sposato (Project Leader / Feature Lead)  
**Date:** 2026-05-02 
**Status:** Draft v1.0 

---

## Table of Contents

- [Version Control](#version-control)
- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Definitions, Acronyms, Abbreviations](#13-definitions-acronyms-abbreviations)
- [2. CreatedAt and UpdatedAt support]
(#2-module-nameplate-generator--exporter)
  - [2.1 Overview](#21-overview)

---

## Version Control

| Version | Date       | Author         | Notes                                                                 |
|---------|------------|----------------|-----------------------------------------------------------------------|
| 1.0     | 2026-05-01 | Amon Rizzo | Initial Draft for CreatedAt and UpdatedAt support in API |

---

## 1. Introduction

### 1.1 Purpose

This Module Documentation (MOD) describes the **API CreatedAt and UpdatedAt support** implemented as part of the BaSyx Viewer Plugin Extension. It explains the behavior of these fields.

The intended readers are developers, testers, and project owners who want to understand how the generation pipeline is triggered and how the backend API serves the frontend component.

### 1.2 Scope

The scope of this change is the definition of the CreatedAt and UpdatedAt fields throughout the backend, API and viewer. Like defined in the [specification](https://industrialdigitaltwin.io/aas-specifications/IDTA-01001/v3.2/spec-metamodel/common.html)

### 1.3 Definitions, Acronyms, Abbreviations

| Term | Meaning |
|------|---------|
| AAS | Asset Administration Shell |
| API | Application Programming Interface (the `api.js` bridging the frontend and backend) |

---

## 2. Module: CreatedAt and UpdatedAt support

### 2.1 Overview

In the Administrative Information attribute of each shell, the fields 'createdAt' and 'updatedAt' are now supported. They can be set by posting directly to the API. They can be read out by calling the shells through the API or by looking under the tab 'Administrative Information'. When a shell that has no such fields is uploaded via the server-side upload, the createdAt field will be set to Unix time 0 and the updatedAt field to the current time. Note: No support in the AAS Editor was added for these fields.
