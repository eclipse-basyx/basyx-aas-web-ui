# System Test Report (STR)

**Project:** BaSyx Viewer Plugin Extensions  
**Test Suite ID:** <TS.GEN.002.FAS>  
**Test Suite Name:** Correct Backend Communication for Nameplate Generator  
**Tester:** Mattis Weigold  
**Date:** 01.05.2026    
**Environment:** Windows 10, Unit Test    

---

## 1. Test Objective

The test suite verifies that the Nameplate Generator api correctly handles calls and returns valid data by accepting and parsing the request, calling an external API and returning generated HTML (or an error)

---

## 2. Preconditions

- Jest, supertest and node dependencies for backend installed

---

## 3. Test Execution Summary

| Data Set ID | Executed (Y/N) | Result (Pass/Fail) | Notes                                                                                  |
| :---------- | :------------- | :----------------- | :------------------------------------------------------------------------------------- |
| TD-001      | Y              | Pass               | Valid request returns HTML response (`200`, `text/html`, contains generated nameplate) |
| TD-002      | Y              | Pass               | Returns `500` when external API responds with failure (`ok = false`)                   |
| TD-003      | Y              | Pass               | Returns `500` when fetch throws exception (e.g., network error)                        |
| TD-004      | Y              | Pass               | Handles `OPTIONS` request correctly (`204 No Content`)                                 |
| TD-005      | Y              | Pass               | Handles malformed/missing URL query → returns `500`                                    |

---

## 4. Overall Result

**Final Result:** Pass   

---