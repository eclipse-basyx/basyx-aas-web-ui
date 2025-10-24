# PROJECT STRUCTURE PLAN: BaSyx DPP API

**TIN24F, SWL Practice project 2025/2026**

| | |
| :--- | :--- |
| **Author:** | Nataliia Chubak |
| **Project:** | BaSyx DPP API |
| **Clients:** | Rentschler Markus, Pawel Wojcik |
| **Address:** | Lerchenstraße 1, 70178 Stuttgart |

---

## Team 6: 

| **Position** | **Name** | **e-Mail** |
| :--- | :--- | :--- |
| Project Manager | Nataliia Chubak | `<inf24271@lehre.dhbw-stuttgart.de>` |
| Product Manager | Luca Schmoll | `<inf24137@lehre.dhbw-stuttgart.de>` |
| Product Manager | Magnus Lörcher | `<inf24155@lehre.dhbw-stuttgart.de>` |
| Test Manager | Manuel Lutz | `<inf24224@lehre.dhbw-stuttgart.de>` |
| System Architect | Noah Becker | `<inf24038@lehre.dhbw-stuttgart.de>` |
| Technical Writer | Fabian Steiß | `<inf24138@lehre.dhbw-stuttgart.de>` |
| UI-Designer | Felix Schulz | `<inf24075@lehre.dhbw-stuttgart.de>` |

---

## Version Control

| **Version** | **Date** | **Author** | **Comment** |
| :--- | :--- | :--- | :--- |
| 1.0 | 12.10.2025 | Nataliia Chubak | Created and added structure |
| 2.0 | 14.10.2025 | Nataliia Chubak | Added Milestones, Project Organisation and Gantt chart |
| 3.0 | 15.10.2025 | Nataliia Chubak | Risks analysis with suggestions from Luca Schmoll |
| 4.0 | 21.10.2025 | Nataliia Chubak | Deliverables |
| | | | |

---

## Table of Contents

1.  [Project Assignment](#project-assignment)
2.  [Project Context](#project-context)
3.  [Project Organisation](#project-organisation)
4.  [Milestones and delivarebles](#milestones-and-delivarebles)
5.  [Gantt chart 3rd Semester](#gantt-chart-3rd-semester)
6.  [Risks](#risks)
7.  [Soft- and Hardware requirements](#soft--and-hardware-requirements)
8.  [Communication and reporting](#communication-and-reporting)
9.  [End of project](#end-of-project)

---

## Project Assignment

| **Field** | **Details** |
| :--- | :--- |
| **Project Goal (Output)** | Development of a two-sided (Backend-Frontend) REST-API Digital Product Passport (DPP) solution in the BaSyx framework according to DIN standards. |
| **Project Use (Outcome)** | Standardized lifecycle management, improved DPP search capability, and increased service efficiency. |
| **Project Clients** | Rentschler Markus, Pawel Wojcik |
| **Team members** | Nataliia Chubak, Luca Schmoll, Magnus Lörcher, Manuel Lutz, Fabian Steiß, Noah Becker, Felix Schulz |
| **Main tasks** | Analysis, Design, Coding, Documentation, Testing |
| **Budget** | Can be found in the Business Case (BC) |
| **Timeline of the project** | Start: Introductory lecture, 19.09.2025; End: Final presentation and project delivery, #.#.2026 |

---

## Project Context

| **Topic** | **Details** |
| :--- | :--- |
| **Initial Situation** | During the project, we need to create and implement a REST API for a digital product passport (DPP). The project development involves the use of Eclipse BaSyx Framework, which includes frontend and backend. In addition, the project is also characterised by existing standard requirements and the lack of implementation of this standard in the Eclipse BaSyx platform. |
| **Temporal context** | An open-source platform BaSyx  developed in 2023 for the development and use of digital twins in the context of Industry 4.0.  |
| | Project phase: Full implementation of the API, hosting on a demo server, and acceptance in the open source project. |
| | Post-project phase: The BaSyx framework is enhanced with the standards-compliant DPP API, which increases interoperability.|

### Stakeholder Analysis

| **Stakeholder** | **Potential / Chance** | **Conflict / Risk** | **Actions** |
| :--- | :--- | :--- | :--- |
| Customer | Satisfied with the project | Changing the requirements during the project | Regular communication between supplier and customer|
| Supplier | Development of the solutions that meets the requirements | Miscommunication, Time pressure | Regular meetings, Structured project leading|
| User | Uses the system  | Needs more information or does not understand the provided documentation, Incorrect operation | Make documentation clear and easy to get. Create the usability concept and testing of catching errors |

---

## Project Organisation

| **Position** | **Description** | **Name** |
| :--- | :--- | :--- |
| Customer | Provides project | Rentschler Markus / Pawel Wojcik |
| Project Leader | Manages the project, monitors the progress of tasks | Nataliia Chubak |
| Project Team | Specialized on different tasks | |
| | - Product Manager | Luca Schmoll |
| | - Product Manager | Magnus Lörcher |
| | - System Architect | Noah Becker |
| | - Test Manager | Manuel Lutz |
| | - Technical Writer | Fabian Steiß |
| | - UI-Design | Felix Schulz |

![Project organisation](images/Roles.png)

*Figur.1* Project organisation

### Work breakdown structure (PSP)

![WSB](images/WBS.png)

*Figur.2* Work breakdown structure (PSP)
---


## Milestones and deliverables

### Phase I: Analysis

| Nr  | Milestone name             | Week   | Responsible person                  | Deliverable |
|-----|----------------------------|--------|-------------------------------------|-------------|
| M1  | Project-Kickoff            | 1      | Whole team                          | 1. Project kick-off protocol (protocol of the first meeting)<br>2. Task distribution matrix (roles and initial responsibilities) |
| M2  | Analysing the requirements | 2–4    | Nataliia Chubak, Magnus Lörcher     | 1. Detailed stakeholder analysis<br>2. Business case (BC)<br>3. Customer Requirements Specification (CRS) |
| M3  | Project plan               | 5–6    | Nataliia Chubak                     | 1. Project structure plan (initial rough schedule and scoping)<br>2. Initial product backlog (prioritised CRS requirements) |

### Phase II: Design

| Nr  | Milestone name                        | Week     | Responsible person                             | Deliverable |
|-----|----------------------------------------|----------|------------------------------------------------|-------------|
| M4  | Repository-Setup & Issue-Management    | 7        | Fabian Steiß, Noah Becker                      | 1. GitHub repository (basic structure)<br>2. Standard templates (README.md, PR templates)<br>3. Issue tracker setup (CRS, BC, SRS, SAS, STP, protocols) |
| M5  | Black-Box-Design (WHAT)                | 8–9      | Noah Becker, Luca Schmoll, Felix Schulz, Manuel Lutz | 1. Software Requirements Specification (SRS)<br>2. Software Architecture Specification (SAS)<br>3. Mockups/API design sketches, Usability/DX concept |
| M6  | White-Box-Design (HOW)                 | 9–10     | Whole team                                     | 1. Definition of modules and assignment as work packages |
| M7  | Final preparation                      | 11       | Whole team, Manuel Lutz                        | 1. Final project plan update (parallelised tasks, dependencies)<br>2. PowerPoint presentation (first version) |
| M8  | Semester-Review                        | 21.11.25 | Whole team                                     | 1. Presentation – results of analysis & design phase, final repository |

### List of tasks and responsible person

| **Person** | **Task** |
| :--- | :--- |
| **Nataliia Chubak**   | 
| Rolle: Project manager|  - Planning & control |
| *E-mail: inf24271@lehre.dhbw-stuttgart.de* |  - PSP (Project structure plan) |
| *MatrikelNr: 6401719* |  - BC (Business Case) |
| |  - CRS (Customer Requirement Specification) |
| |  - Coding (Frontend)|
| |  - Presentation |
| |  - PowerPoint |
| | - Usability concept |
| | - Meetings Minutes (X-X Weeks)
| **Magnus Lörcher** |
| Role: Product manager |  - CRS (Customer Requirements Specification) |
| *E-mail: inf24155@lehre.dhbw-stuttgart.de* | - Market and demand analysis|
| *MatrikelNr: 6699202* | - Coding (Backend) |
| |- Usability concept |
| | - Presentation |
| **Luca Schmoll** | |
| Role: Product manager |- SRS (System Requirements Specification) |
| *E-mail: inf24137@lehre.dhbw-stuttgart.de* | -  Usability concept |
| *MatrikelNr: 5919706* | - Coding (Backend) |
| | - Market and demand analysis|
| | - Presentation |
| **Fabian Steiß** | |
| Role: Technical writer | - Meetings Minutes (1-11 Weeks)|
| *E-mail: inf24138@lehre.dhbw-stuttgart.de* |  - Usability concept |
| *MatrikelNr: 5934347* |  - User Manual |
| | - MOD    |
| | - Readme |
| | - Wiki   |
| | - Coding (Backend)|
| | - Presentation |
| **Manuel Lutz** | | 
| Role: Test manager | - STP (Software Test Plan) |
| *E-mail: inf24224@lehre.dhbw-stuttgart.de* | - STR (System Test Report)|
| *MatrikelNr: 9414567* | - Test execution |
| | - Test planning |
| | - Coding (full stack) |
| | - Testing |
| | - Presentation |
| | - PowerPoint I |
| **Noah Becker** | |
| Role: System Architect | - SAS (Software Architecture Specification) |
| *E-mail: inf24038@lehre.dhbw-stuttgart.de* | - Backend implementation |
| *MatrikelNr: 1871817* | - Infrastructure setup |
| | - GitHub Repository |
| | - Usability concept |
| | - Coding (Frontend) |
| | - Presentation |
| **Felix Schulz** | |
| Role: UI-Designer | - UI-implementation |
| *E-mail: inf24075@lehre.dhbw-stuttgart.de* | - Prototyping |
| *MatrikelNr: 3954527* |  - BaSyx analysis |
| | - Executable|
| | - MOD (Web-Interface) |
| | - Coding (Frontend) |
| | - Testing |
| | - Presentation |
| | - PowerPoint I |

---

## Gantt chart 3rd Semester

![Gantt chart](images/Gantt_chart.png)

*Figur.3* Gantt chart 3rd Semester

---

## Risks

| **Nr** | **Risk** | **Probability** | **Amount of damage** | **Effects** | **Measure** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Planning risk| 20 % | Very low | The project might take longer than planned. | Creating a detailed project work plan and systematically monitoring of the progress.  |
| 2 | Communication risk | 40 % | Low| Insufficient communication between team members. | Holding regular meetings and use the GitHub and Jira services. |
| 3 | Miscommunication with client | 40 % | Medium | Final product might not satisfy customer. | Presenting parts of the project during developing. |
| 4 |Technical risk| 60 % | High | Technical complexity of BaSyx. |  Evaluation and expansion of BaSyx teaching aids. |
| 5 |Risk of ignoring risks | 20 % |Medium| Insufficiently realistic assessment of scenarios by each member of the test team. | Creating a list of possible risks and possible solutions. | 
| 6 | Budget risk | 80 % | Medium | The budget for the project is being significantly exceeded. | Good planning and concentrating on main task. | 
| 7 | Cyber attack| 20 % | Very high | The servers are hacked; data is lost. | Encryption of the server. | 
| 8 | Illness | 40 % | Medium | Depending on the duration of the illness, several days/weeks.| In the event of long-term illness, the tasks assigned to the team member may be transferred to other team members. | 


![Risk matrix](images/matrix.JPG)

*Figur.4* Risk matrix
---

## Soft- and Hardware requirements


| Component | Technology |
|------------|-------------|
| **Backend** | Java / Spring Boot (BaSyx SDK) |
| **API Definition** | OpenAPI 3.0 / Swagger |
| **Frontend** | React / TypeScript (BaSyx UI) |
| **Data Model** | Asset Administration Shell (AAS) |
| **Infrastructure** | Eclipse BaSyx Framework |
| **Hosting** | <div>Traefik (Reverse Proxy) & Docker<br><li> [Swagger](https://srv01.noah-becker.de/uni/swe/swagger/) OpenAPI Spezifikation<br><li> [BaSyx WebUI](https://srv01.noah-becker.de/uni/swe/basyx/) Applikation</div> |
| **Documentation** | Markdown, GitHub Wiki, Swagger UI |


---

## Communication and reporting

* **Within the team:** 

Meetings are every week. Meetings are held on the university premises. They are protocolled. Fabian Steiß is responsible for the protocols. 
At each meeting, every team member receives a task. In addition, every week, everyone reports on the progress of the task and any problems that may have arisen. The Teams platform is also used for communication, if clarification of a specific task is needed.
The Jira platform is also used for more detailed control over the progress of tasks, which is also convenient for the team.


* **With the customer:**

All documents are visible in the GitHub repository. The documents PM, BC, CRS, SAS, SRS and MeetingMinutes are in the PROJECT folder.

---

## End of project
The project´s deadline (first part) is officially set on 21.11.2025.

Officially, the following tasks must be completed in the project (first part):
* **GitHub:** The GitHub repository needs to be cleaned up, and its wiki has to be updated.
* **Documentation:** The complete set of documents must be delivered:
    * CRS (Customer Requirement Specification)
    * BC (Business Case)
    * SRS (Software Requirement Specification)
    * SAS (Software Architecture Specification)
    * PSP (Project structure plan - PM)
    * Protokolle (Protocols/Meeting Minutes)
* **Product presentation I**
