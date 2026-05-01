# System Test Report (STR)

**Project:** BaSyx Viewer Plugin Extensions  
**Test Suite ID:** <TS.FLTR.001.FAS>  
**Test Suite Name:** AAS Filtering Validation  
**Tester:** Mattis Weigold  
**Date:** 01.05.2026    
**Environment:** Windows 10, Unit Test    

---

## 1. Test Objective

Test the filtering of AAS shells in the AASList module by calling the `onAttributeFiltersChange` function.

---

## 2. Preconditions

- Vitest and node dependencies installed

---

## 3. Test Execution Summary

| Data Set ID | Executed (Y/N) | Result (Pass/Fail) | Notes                                                                                   |
| :---------- | :------------- | :----------------- | :-------------------------------------------------------------------------------------- |
| TD-001      | Y              | Pass               | Filters by exact match `manufacturerName = siemens` → returns `1`                       |
| TD-002      | Y              | Pass               | Filters by exact match `manufacturerProductDesignation = pump` → returns `2`            |
| TD-003      | Y              | Pass               | Filters by exact match `manufacturerProductFamily = automation` → returns `3`           |
| TD-004      | Y              | Pass               | Filters by exact match `productClassId = c3` → returns `3`                              |
| TD-005      | Y              | Pass               | Substring match: `manufacturerName = sie` → returns `1`                                 |
| TD-006      | Y              | Pass               | Substring negative case: `manufacturerName = xyz` → returns empty result                |
| TD-007      | Y              | Pass               | Substring match: `manufacturerProductDesignation = mot` → returns `1`                   |
| TD-008      | Y              | Pass               | Substring negative case: `manufacturerProductDesignation = nope` → returns empty result |
| TD-009      | Y              | Pass               | Multi-field AND match (siemens + motor + drive + a1) → returns `1`                      |
| TD-010      | Y              | Pass               | Multi-field AND match (bosch + pump + hydraulics + b2) → returns `2`                    |
| TD-011      | Y              | Pass               | Invalid multi-field combination (siemens + pump + a1) → returns empty result            |
| TD-012      | Y              | Pass               | Cross-field mismatch (bosch + sensor + a1) → returns empty result                       |
| TD-013      | Y              | Pass               | Case-insensitive filtering (`SIEMENS` → matches `siemens`)                              |
| TD-014      | Y              | Pass               | Handles undefined values safely (`manufacturerNameLower = undefined`)                   |
| TD-015      | Y              | Pass               | Empty filters return full unfiltered dataset (length matches baseline)                  |

---

## 4. Overall Result

**Final Result:** Pass   

---