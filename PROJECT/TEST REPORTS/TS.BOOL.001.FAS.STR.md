# System Test Report (STR)

**Project:** BaSyx Viewer Plugin Extensions  
**Test Suite ID:** <TS.BOOL.001.FAS>  
**Test Suite Name:** Boolean Input Validation  
**Tester:** Mattis Weigold  
**Date:** 01.05.2026    
**Environment:** Windows 10, Unit Test    

---

## 1. Test Objective

This test suite verifies that the BooleanInput component correctly handles boolean values within the AAS UI. It includes validation of input normalization (string to boolean), correct visual representation (labels and styling), event emission on user interaction, and reactivity to prop changes.

---

## 2. Preconditions

- Vitest and node dependencies installed

---

## 3. Test Execution Summary

| Data Set ID | Executed (Y/N) | Result (Pass/Fail) | Notes                                                               |
| :---------- | :------------- | :----------------- | :------------------------------------------------------------------ |
| TD-001      | Y              | Pass               | Converts string `"true"` to boolean `true` and displays correctly   |
| TD-002      | Y              | Pass               | Converts string `"false"` to boolean `false` and displays correctly |
| TD-003      | Y              | Pass               | Accepts boolean `true` and renders correctly                        |
| TD-004      | Y              | Pass               | Accepts boolean `false` and renders correctly                       |
| TD-005      | Y              | Pass               | Renders `"true"` with `text-success` class                          |
| TD-006      | Y              | Pass               | Renders `"false"` with `text-warning` class                         |
| TD-007      | Y              | Pass               | Emits updated boolean value (`true`) when toggled                   |
| TD-008      | Y              | Pass               | Updates internal state when `modelValue` prop changes               |

---

## 4. Overall Result

**Final Result:** Pass   

---