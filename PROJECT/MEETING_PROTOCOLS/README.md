# Meeting Protocol - Team 6 BaSyx DPP API


## Table of Contents
- [Meeting 28.10.2025 - Feedback from Herr Rentschler](#review)
- [Meeting 06.11.2025 - Quick Meeting for Presentation](#presentationMeeting)
- [Meeting 04.11.2025 - Status team members II](#status2)
- [Meeting 28.10.2025 - Status team members I](#status)
- [Meeting 22.10.2025 - Document Distribution and Jira/GitHub Tasks](#documentDistribution)
- [Meeting 17.10.2025 - Discussion of Task Distribution](#discussionBriefing)
- [Meeting 15.10.2025 - Task Distribution](#TaskDistribution)
- [Meeting 09.10.2025 - Next Steps](#next-steps)
- [Meeting 30.09.2025 - Research](#research)
- [Meeting 29.09.2025 - Foundations](#foundations)


<a id="review">

## Meeting 06.11.2025 – Feedback from Herr Rentschler
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">

| No. | Topic | Responsibility | Time (min) |
|-----|--------|----------------|-------------|
|1|CRS|Magnus Lörcher|20 min|
|2|SRS|Luca Schmoll|30 min|
|3|SAS|Noah Becker|20 min|
|4|PM|Nataliia Chubak|20 min|

</td>
<td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** Teams Meeting  
**Date:** 07.11.2025  
**Time:** 13:00 – 14:40   
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type:** Review  
</td>
</tr>
</table>

---

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher, Felix Schulz, Fabian Steiß, Herr Rentschler  

---

### I. Goal  
Receive feedback from Herr Rentschler so that we can improve the documents.

### II. Status  

### III. Risks / Issues

### IV. Discussion Points

**Herr Rentschler** offered us the opportunity to present our project to the **BaSyx Community**, if we would like to.  

**Contact to Product Owner of BaSyx Aaron Zielstorff:**  
Contact person BaSyx: **Aaron Zielstorff**,  
**Aaron.zielstorff@iese.fraunhofer.de**  

---

## CRS

- References (sources) are missing (link to the original task description)  
- No team division  
- Add history (Version Control)  
- Grammar errors (Nonfunctional requirements, conformity, in BP03 Documentation, FR02 Norm conformity)  
- UC04 → functionality, not a Use Case  

---

## SRS

- Missing context on where we are → copy from CRS  
- Table of contents incorrect  
- Missing link to task description  
- Leave out "Geltungsbereich" or rename to "Systemumgebung"  
- Terminology should appear earlier (e.g. 1.2)  
- System architecture is actually SAS, but according to him, keep it as is  

### Use Cases
- Cases 1–3 go into the Architecture Specification, as they are not real use cases  
- Use Case is fine but should be moved into the CRS (all Use Cases into CRS, in SRS only reference them)  
  → from SRS refer to CRS  

- FR01 and FR02 belong together  
- FR03 add **Harting** example (link + more pictures)  
- FR05 and FR03 should be clustered together  
- FR04 belongs in Frontend requirements  
- FR06 is not a Functional Requirement → it is a test environment topic  

### Frontend Requirements
- Should describe what is provided by the frontend  
- FR09 goes into CRS + include more of Rentschler’s ideas  
- *Scope of Submodels* goes into SRS + expand it  

- The written NFRs are actually test parameters according to him
- NFR05 was not well received  

- External Interfaces (6) provide no information gain for him  

### Point 8
- The graphic would fit the Use Case, but it "hangs in the air"  
- Usability concept & workflow are missing according to him; he recommends screenshots  

### Point 9
- Most are not non-functional requirements  

### Point 10
- Move everything into CRS  

### Point 11
- Delete everything (lol)  

### Formal
- There are no references to the CRS (he wants that); for requirements, justify with a link to CRS  
- A references chapter for sources is missing (license, task description, norm, BaSyx environment)  
- Ensure a consistent layout across all documents  
- Chapter 3 → rename to “Functional something”  
- Scope of Submodel (screenshot from Nataliia’s notes)  

---

## SAS

- Consistent layout missing  
- Remove team division (belongs in the product plan), remove stakeholders  
- Delete 2.2  
- In 4.1, remove “Technology” from the image  
- Remove duplicate “Vue.js” (redundancy, once is enough)  
- Move 5.2 higher up, not so far down  
- Delete everything under 6  
- **Data model** is very important (Where does it come from, where does it go, …)  

---

## PM

- Layout and format must be consistent  
- Version Control directly under the header  
- Remove "Details" from Project Assignment (keep only the headline)  
- In Project Context, two fields are missing; for Temporal Context, he didn’t understand what was meant  

### Strategy Plan
- Dev. API must be included (DPP API from Grok), e.g. in point 3.1  

- 2.0 Design Mapping Concept + Frontend Design  
- 4.0 Testing → write “Test Strategy” instead of “Write Tests”




### V. Future meeting
The next meeting is planned for 10.11.2025.


---

### To-dos

| **To-Do** | **Responsible Person(s)** | **Due Date** |
|----------------------------------------------------|----------------------------|---------------|
||||
---

**Notes:**  

---


<a id="presentationMeeting">

## Meeting 06.11.2025 – Quick Meeting for Presentation
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">

| No. | Topic | Responsibility | Time (min) |
|-----|--------|----------------|-------------|
| 1 |Who is going to do what in the presentation|All|8 min|
||||

</td>
<td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 06.11.2025  
**Time:** 12:00 – 12:08 
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type:** Briefing  
</td>
</tr>
</table>

---

**Attendees:**  
Noah Becker, Nataliia Chubak, Manuel Lutz, Magnus Lörcher, Luca Schmoll, Felix Schulz, Fabian Steiß  

---

### I. Goal  
Quick overview of who is presenting a topic

### II. Status  

### III. Risks / Issues

### IV. Discussion Points

- Vorstellung macht jeder selbst
- Manuel macht die Vorstellung des projekts + (Tests von Lucas SRS)
- Use Case Luca
- Funktionale Anforderungen macht Luca
- Nicht Funktionale Anforderungen macht Magnus 
- Business Case macht Nataliia
- Verwendete Tools macht Fabian
- Projektplan macht Nataliia 
- Risikoanalyse macht Nataliia
- Systemarchitektur macht Noah
- Lösungsansatz macht Noah
- Mockups macht Felix
- Fragen - alle


### V. Future meeting
The next meeting is planned for 10.11.2025.


---

### To-dos

| **To-Do** | **Responsible Person(s)** | **Due Date** |
|----------------------------------------------------|----------------------------|---------------|
||||
---

**Notes:**  

---


<a id="status2">

## Meeting 04.11.2025 – Status team members II
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">

| No. | Topic | Responsibility | Time (min) |
|-----|--------|----------------|-------------|
| 1 |Documentation status|All|20 min|
||||

</td>
<td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 04.11.2025  
**Time:** 11:30 – 12:00 
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type:** Weekly  
</td>
</tr>
</table>

---

**Attendees:**  
Noah Becker, Nataliia Chubak, Manuel Lutz, Magnus Lörcher, Luca Schmoll, Felix Schulz, Fabian Steiß  

---

### I. Goal  
Team members share there documentation status and other discussions

### II. Status  
- CRS finished
- SRS and SAS will be soon finished
- Presentation in progress but needs more information from team members

### III. Risks / Issues

### IV. Discussion Points

- Document status query
  CRS from Magnus complete, feedback from Rentschler via Nataliia

  SRS complete, wireframes have to be added

  SAS will be finished soon


- Presentation
  Manuel waits for infos from team members




### V. Future meeting
The next meeting is planned for 04.11.2025.


---

### To-dos

| **To-Do** | **Responsible Person(s)** | **Due Date** |
|----------------------------------------------------|----------------------------|---------------|
|Pushing needed Infos for presentation|all|10.11.2025|
|CRS Feedback from Herr Rentschler |Nataliia Chubak|10.11.2025|
|Questions regarding frontend to Herr Rentschler |Noah Becker|10.11.2025|
---

**Notes:**  

---



## Meeting 28.10.2025 – Status team members
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">

| No. | Topic | Responsibility | Time (min) |
|-----|--------|----------------|-------------|
| 1 |Mockup presentation|Felix Schulz|5 min|
| 2 |Presentation task distribution|all|10 min|
| 3 |Pull request rule question|Fabian|2 min|
| 4 |Security concept|all|5 min|
</td>
<td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 28.10.2025  
**Time:** 11:30 – 12:04  
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type:** Weekly  
</td>
</tr>
</table>

---

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher, Luca Schmoll, Felix Schulz, Fabian Steiß  

---

### I. Goal  
To check the status of the team members

### II. Status  
- SRS will be finalized this week
- 2 mockups have been created
- SAS deadline in 2 days, still some work to do
- Transfer of tasks from Jira to GitHub Project successful

### III. Risks / Issues

### IV. Discussion Points

- Presentation of mockups
  - Team appreciated designidea
  - Recognized the problem of dynamic value integration, for example: an object has 4 values, another object has 1000 values

- Presentation
  - Discussion who will do what in the presentation
  - Will be specified in the next meeting

- UML diagrams in SRS
  - Magnus and Luca are going to do it

- Pull requests must be consistently followed through

- Languages and Tools
  - Backend: Django
  - Frontend: React with Typescript and Tailwind for design

- No test driven development

- Security concept
  - Authentication in the web app with a login page



### V. Future meeting
The next meeting is planned for 04.11.2025.


---

### To-dos

| **To-Do** | **Responsible Person(s)** | **Due Date** |
|----------------------------------------------------|----------------------------|---------------|
|Create presentation|Manuel Lutz|20.11.2025|
|Finish writing SAS|Noah Becker|14.11.2025|
|Finish writing SRS|Luca Schmoll|14.11.2025|
|Mockup of the login page|Felix Schulz|15.11.2025|
|Email for trial presentation to Herr Rentschler|Nataliia Chubak|28.10.2025|

---

**Notes:**  
- Manuel Lutz not present
---



---
<a id="documentDistribution">

## Meeting 22.10.2025 – Document Distribution and Jira/GitHub Tasks
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">

| No. | Topic | Responsibility | Time (min) |
|-----|--------|----------------|-------------|
| 1 | Who writes which documents | All | 10 min |
| 2 | GitHub Issues and Jira | All | 10 min |
</td>
<td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 22.10.2025  
**Time:** 12:40 – 13:05  
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type:** Weekly  
</td>
</tr>
</table>

---

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher,  
Manuel Lutz, Luca Schmoll, Felix Schulz, Fabian Steiß  

---

### I. Goal  
- To get an overview of who writes which documents

### II. Status  
✔️ BaSyx Environment is now [reachable](https://srv01.noah-becker.de/uni/swe/basyx/) and fully functional

### III. Risks / Issues  

### IV. Discussion Points  

- **Document Distribution:**
  - SRS – Luca Schmoll  
  - CRS – Magnus Lörcher  
  - BC – Nataliia Chubak  
  - PM – Nataliia Chubak  
  - SAS – Noah Becker  
  - MOD (Web-Interface) - Felix Schulz   
  - STR, STP – Manuel Lutz  
  - Presentation – Manuel Lutz, Felix Schulz  
  - Meeting Minutes, User Manual – Fabian Steiß  

- **More Git Issues**
  - Discussion on whether Jira tasks should be created as GitHub Issues.  
    **Result:** Ask Rentschler what is preferred  

- **Upstream Changes**
  - Do not make upstream changes from the original repository. If at all, only at the end when necessary  

### V. Future Meeting  
The next meeting is planned for **29.10.2025**.  

---

### To-Do’s

| **To-Do** | **Responsible Person(s)** | **Due Date** |
|----------------------------------------------------|----------------------------|---------------|
| Ask Herr Rentschler whether Jira tasks should be created as GitHub Issues | Luca Schmoll | 24.10.2025 |
| Fix file upload in BaSyx Environment | Noah Becker | 24.10.2025 |

---

**Notes:**  
---

<a id="discussionBriefing">

## Meeting 17.10.2025 – Discussion of Task Description
<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">

| No. | Topic              | Responsibility | Time (min) |
|-----|--------------------|----------------|-------------|
| 1   | Explaination / discussion of project goal| All       | 10          |
</td>
<td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 17.10.2025  
**Time:** 10:30 – 10:40  
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type:** Briefing  
</td>
</tr>
</table>

---

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher, Luca Schmoll, Fabian Steiß  

---

### I. Goal  
The goal is to understand what we need to do with the API.

### II. Status  

### III. Risks / Issues  

### IV. Discussion Points  
- Noah Becker spoke with Herr. Rentschler. We need to extend the existing REST API’s OpenAPI specifications, both in the backend and the frontend.

---




<a id="TaskDistribution"></a>

## Meeting 15.10.2025 - Task Distribution

<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">

| No. | Topic                | Responsibility   | Time (min) |
|-----|----------------------|------------------|-------------|
| 1   | Task Distribution    | Nataliia Chubak  | 10          |
| 2   | Task unclear         |All                  |             15|


</td>
<td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 15.10.2025  
**Time:** 12:40 – 13:05  
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type** Weekly

</td>
</tr>
</table>

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher,  
Manuel Lutz, Luca Schmoll, Felix Schulz, Fabian Steiß  

---

### I. Goal  

### II. Status  
✔️ Business Case completed  
✔️ BaSyx environment is active  
✔️ Link to Swagger is up  

### III. Risks / Issues  
- **File uploading not working**  
- **Basic functionality unclear — what exactly needs to be done**  

### IV. Discussion Points  
- **Task Distribution**  
  - Manuel Lutz: Presentation and testing  
  - Magnus Lörcher, Fabian Steiß, Luca Schmoll: Backend  
  - Felix Schulz: Frontend, UI Design   and presentation
  - Noah Becker: Fullstack  


  **Documents:**  
  - **Setup of BaSyx environment**  
  - File upload in BaSyx AASX Web UI not working, but Swagger works  
  → Therefore, email to Herr. Rentschler asking for clarification of the project goal  

### V. Future Meeting  
The next meeting is planned for 22.10.2025.  

---

### To-Do’s

| **To-Do**                                          | **Responsible Person(s)** | **Due Date** |
|----------------------------------------------------|----------------------------|---------------|
| Email Herr Rentschler about clarification of project goal | Nataliia Chubak            | 15.10.2025    |



**Notes:**  
  - [**Swagger UI**](https://srv01.noah-becker.de/uni/swe/swagger/)
---

<a id="next-steps"></a>
## Meeting 09.10.2025 - Next Steps

<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">



| No. | Topic           | Responsibility | Time (min) |
|-----|-----------------|----------------|-------------|
| 1   | Documents       | All            | 10          |
| 2   | Jira            | All            | 5           |
| 3   | Weekly Meetings | All            | 5           |

</td>
    <td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 09.10.2025  
**Time:** 13:00 – 13:22  
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type** Weekly

</td>
  </tr>
</table>

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher,  
Manuel Lutz, Luca Schmoll, Felix Schulz, Fabian Steiß

---


### I. Goal
Overview of the next steps and documents to be submitted.

### II. Status
✔️ Business Case completed

### III. Risks / Issues
- Wrong repository forked, fixed by Manuel.

### IV. Discussion Points
- **Documents to be created:** Epic Stories, process model, timeline, and usability concepts.  
  Overview of which documents must be submitted at the end.  
  To be written by Magnus, Luca, and Nataliia.

- **Tasks in Jira:**  
  The team decided to use Jira to manage and assign tasks.

- **Weekly Meetings:**  
  Planned for Tuesdays during the break (from 11:30 AM).

- **Build Pipelines:**  
  To be set up by Noah and Manuel for the BaSyx environment.

- **Unit Tests:**  
  Decided to follow a Test Driven Design approach.

### V. Future Meeting
The next meeting is planned for 14.10.2025.



---

### To-Do’s
| **To-Do**                                  | **Responsible Person(s)**                      | **Due Date**     |
|--------------------------------------------|------------------------------------------------|------------------|
| Get an overview of the BaSyx project        | All                                            | 14.10.2025       |
| Epic Stories, process model, timeline, usability concepts | Nataliia Chubak, Magnus Lörcher, Luca Schmoll | open       |
| Create issues on GitHub                     | Fabian Steiß                                   | 14.10.2025       |
| Set up Swagger on the server for the API    | Noah Becker                                   | 14.10.2025       |

**Notes:**

-	Manuel Lutz was 3 minutes late.

-	**Jira Board:** [https://zerodayz.atlassian.net/jira/software/projects/BDA/boards/67](https://zerodayz.atlassian.net/jira/software/projects/BDA/boards/67)

---

<a id="research"></a>
## Meeting 30.09.2025 - Research

<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">



| No. | Topic         | Responsibility | Time (min) |
|-----|----------------|----------------|-------------|
| 1   | What is BaSyX  | All            | 10          |
| 2   | Research Phase | All            | 15          |
| 3   | Discussion     | All            | 35          |

</td>
    <td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 30.09.2025  
**Time:** 10:00 – 11:00  
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type** Weekly

</td>
  </tr>
</table>

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher,  
Manuel Lutz, Luca Schmoll, Felix Schulz, Fabian Steiß

---

### I. Goal
Conducting initial research on BaSyx and project-related topics.

### II. Status
Research ongoing.

### III. Risks / Issues
None identified.

### IV. Discussion Points
- **Research Phase:**  
  The team mainly conducted research on BaSyx and Industry 4.0 concepts to build a foundational understanding.  
  Each member summarized their findings to align on project direction.

- **Next Steps:**  
  Plan for documentation and technical specification (System Architecture, OpenAPI).

### V. Future Meeting
The next meeting is planned for Thursday, 09.10.2025.

---

### To-Do’s
| **To-Do**                       | **Responsible Person(s)** | **Due Date** |
|---------------------------------|----------------------------|--------------|


**Notes:**  
- Full team attendance.  
- This session focused mainly on **research and understanding BaSyx**.

---
<a id="foundations"></a>
## Meeting 29.09.2025 - Foundations

<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:60%; vertical-align:top;">



| No. | Topic | Responsibility | Time (min) |
|-----|--------|----------------|-------------|
| 1 | Project Topic | All | 10 |
| 2 | Role Distribution | All | 15 |
| 3 | First Steps | All | 35 |

</td>
    <td style="width:40%; vertical-align:bottom; text-align:center;">

**Location:** DHBW Stuttgart  
**Date:** 26.09.2025  
**Time:** 10:00 – 11:00  
**Moderator:** Nataliia Chubak  
**Minutes:** Fabian Steiß  
**Type** Weekly

</td>
  </tr>
</table>

**Attendees:**  
Noah Becker, Nataliia Chubak, Magnus Lörcher,  
Manuel Lutz, Luca Schmoll, Felix Schulz, Fabian Steiß

---

### I. Goal
Definition of basic project prerequisites.

### II. Status
None

### III. Risks / Issues
None

### IV. Discussion Points
- **Decision on project topic:**  
  The team decided to work on the *Team6-BaSyx-DPP-API* project.

- **Role distribution:**  
  The following roles were assigned:

  | Role              | Responsible Person(s)             |
  |-------------------|-----------------------------------|
  | Project Manager   | Nataliia Chubak                   |
  | Product Manager   | Luca Schmoll, Magnus Lörcher      |
  | Test Manager      | Manuel Lutz                       |
  | System Architect  | Noah Becker                       |
  | Documentation     | Fabian Steiß                      |
  | UI Designer       | Felix Schulz                      |
  | Developer         | All                               |

### V. Future Meeting
The next meeting is planned for Thursday, 09.10.2025.

---

### To-Do’s
| **To-Do**                   | **Responsible Person(s)**                      | **Due Date**     |
|------------------------------|------------------------------------------------|------------------|
| Clone repository             | Manuel Lutz                                   | 03.10.2025       |
| Write business case          | Nataliia Chubak                               | 07.10.2025       |
| Write CRS                    | Nataliia Chubak, Magnus Lörcher, Luca Schmoll | open       |
| Set up BaSyx infrastructure  | Noah Becker                                   | 10.10.2025       |

**Notes:**  
- Full team attendance.
