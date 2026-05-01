# System Test Report (STR)

**Project:** BaSyx Viewer Plugin Extensions  
**Test Suite ID:** <TS.SORT.001.FAS>  
**Test Suite Name:** AAS Sorting Validation  
**Tester:** Mattis Weigold  
**Date:** 01.05.2026    
**Environment:** Windows 10, Unit Test    

---

## 1. Test Objective

Test the sorting of AAS shells in the AASList module by calling the `setSortOptions` function.

---

## 2. Preconditions

- Vitest and node dependencies installed

---

## 3. Test Execution Summary

| Data Set ID | Executed (Y/N) | Result (Pass/Fail) | Notes                                                                  |
| :---------- | :------------- | :----------------- | :--------------------------------------------------------------------- |
| TD-001      | Y              | Pass               | Sorts by `id` ascending (`a → b → c`)                                  |
| TD-002      | Y              | Pass               | Sorts by `id` descending (`c → b → a`)                                 |
| TD-003      | Y              | Pass               | Sorts by `idShort` ascending (`aaa → bbb → ccc`)                       |
| TD-004      | Y              | Pass               | Sorts by `idShort` descending (`ccc → bbb → aaa`)                      |
| TD-005      | Y              | Pass               | Sorts by `createdAt` ascending (2022 → 2023 → 2024)                    |
| TD-006      | Y              | Pass               | Sorts by `createdAt` descending (2024 → 2023 → 2022)                   |
| TD-007      | Y              | Pass               | Sorts by `updatedAt` ascending (2022 → 2023 → 2024)                    |
| TD-008      | Y              | Pass               | Sorts by `updatedAt` descending (2024 → 2023 → 2022)                   |
| TD-009      | Y              | Pass               | Handles missing `createdAt` gracefully (undefined values sorted first) |
| TD-010      | Y              | Pass               | Sorts by custom `nameToDisplay` mapping (`Alpha → Bravo → Charlie`)    |
| TD-011      | Y              | Pass               | Throws error for unknown sort field                                    |

---

## 4. Overall Result

**Final Result:** Pass   

---