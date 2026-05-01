# Test Data Specification  
**Test Case ID:** <TC.FIELDS.001.F>  
**Test Case Name:** Display and Integrity of Datetime Fields  

---

## 1. Description

This document defines the input datasets used to validate the correct handling and display of `createdAt` and `updatedAt` fields in the AAS Web UI.

---

## 2. Data Sets Overview

| Data Set ID | Description | createdAt | updatedAt | Expected Behavior |
|:--|:--|:--|:--|:--|
| TD-001 | Both fields present (valid ISO format) | ✔ | ✔ | Both fields displayed correctly |
| TD-002 | Only createdAt present | ✔ | ✘ | updatedAt will be set to current datetime |
| TD-003 | Only updatedAt present | ✘ | ✔ | Only updatedAt shown |
| TD-004 | No datetime fields | ✘ | ✘ | No fields displayed |
| TD-005 | Invalid datetime format | ✔ (invalid) | ✔ (invalid) | Error handling / fallback display |
| TD-006 | Edge values (past/future dates) | ✔ | ✔ | Correct display without UI issues |

---

## 3. Detailed Test Data

### TD-001 – Valid Datetime Fields

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.001.json"

### TD-002 – Only createdAt

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.002.json"

### TD-003 – Only updatedAt

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.003.json"

### TD-004 – No Fields

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.004.json"

### TD-005 – Invalid Format

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.005.json"

### TD-006 – Edge Cases (updatedAt in future)

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.006.json"

### TD-007 – Switched Dates

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.007.json"

### TD-008 – Impossible Date

Location: "PROJECT/TEST DATA/TC.FIELDS.001.F.TD.008.json"

## 4. Execution Notes

- Each dataset must be uploaded individually or as part of a batch
- Ensure UI refresh after upload
- Record observed behavior in the Test Report (STR)

## 5. Expected Output Summary

- Fields displayed only when present
- Values match input exactly
- No crashes or rendering issues
- Invalid values handled gracefully