# System Test Report (STR)

**Project:** BaSyx Viewer Plugin Extensions  
**Test Suite ID:** <TS.GEN.001.FAS>  
**Test Suite Name:** Correct Frontend Communication for Nameplate Generator  
**Tester:** Mattis Weigold  
**Date:** 01.05.2026    
**Environment:** Windows 10, Unit Test    

---

## 1. Test Objective

The test suite verifies that the Nameplate Generator api gets correctly called from the frontend and responses get handled appropriately.

---

## 2. Preconditions

- Vitest and node dependencies installed

---

## 3. Test Execution Summary

| Data Set ID | Executed (Y/N) | Result (Pass/Fail) | Notes                                                                             |
| :---------- | :------------- | :----------------- | :-------------------------------------------------------------------------------- |
| TD-001      | Y              | Pass               | Generates iframe with correct structure after `generatePhysicalNameplate()`       |
| TD-002      | Y              | Pass               | Encodes submodel ID in iframe URL (ID not directly visible in `src`)              |
| TD-003      | Y              | Pass               | `isGenerating` flag is set during execution and reset to `false` after completion |
| TD-004      | Y              | Pass               | `triggerDownload()` sends `postMessage('trigger-svg-download', '*')` to iframe    |
| TD-005      | Y              | Pass               | Handles missing iframe safely (no exception thrown)                               |

---

## 4. Overall Result

**Final Result:** Pass   

---