# Railway Fire Protection visualization

Submodel plugin for [IDTA 02102 *Fire Protection on Railway Vehicles* v1.0](https://github.com/admin-shell-io/submodel-templates/tree/main/published/Fire%20Protection%20on%20Railway%20Vehicles/1/0).
It shows the fire protection data of a railway component per EN 45545-2: which requirement sets the product meets, at which hazard level, and the test reports that prove it.

The entry component is [`RailwayFireProtection_v1_0.vue`](../RailwayFireProtection_v1_0.vue), one level up. Like every plugin in `Plugins/Submodels`, it is registered in `main.ts` through its `semanticId` and shown in the visualization panel for every submodel whose semanticId matches:

```text
https://admin-shell.io/idta/cds/RailwayFireProtection/1
```

## What it shows

1. **Product and material summary**
   - Product designation, manufacturer, order code and article number.
   - Material name and manufacturer, and the tested material combination.
   - `MaterialCharacteristics` (an index from 0 to 100) as a read-only slider, as a range when min and max differ.
   - Total and combustible mass per unit, with a donut chart of the combustible share. The chart is left out when a mass is missing, isn't a number, or the combustible mass exceeds the total.
2. **Requirement sets**, one tile each
   - Named by the requirement set code in the `Requirement` value (e.g. `R22`), otherwise by its idShort or `Set N`.
   - Sorted naturally by name (R1, R2, … R10), whatever the order in the submodel.
   - Hazard level as a badge and colored top border, plus a three-segment meter for HL1–HL3.
   - The first three tests of the linked reports (procedure and result), then `+ N more tests`.
   - The number of reports, with a warning icon when a report reference had to be repaired or couldn't be resolved.
   - Filter chips above the tiles, one per hazard level that occurs, with its count.
3. **Details dialog**, opened by clicking a tile
   - The full requirement text and the hazard level, with the original value when it differs from the standard label.
   - One card per linked report: report document (preview for PDFs and images, download), comment, a table of all tests (procedure, result, date, report number) and the laboratory (name, accreditation, author, address, email, phone, website).
   - A note on each report whose reference was repaired, and a warning with the key chain for each reference that couldn't be resolved. External references are shown as links.
   - The dialog flips and zooms out of its tile and back into it when closed. Users who prefer reduced motion get a fade. On phones the dialog is fullscreen.
4. **FCIL download**, in the header of the requirement sets card
   - Fills the UNIFE *Fire Certificate Inventory List* template with the submodel data and downloads it as an Excel file. See [FCIL export](#fcil-export).

## Hazard levels

The values of `HazardLevel` are defined in IDTA 02102, Table 6. The plugin reads the `valueId` first. Without a matching `valueId`, it reads the value text, ignoring case and surrounding quotes and accepting both `HL3` and `Hazard Level 3`.

| Code | Meaning | Color |
| --- | --- | --- |
| `HL1`–`HL3` | Compliant: Hazard Level 1–3 | success |
| `AFNR` | Approved Functional Necessity Report | info |
| `MTR` | Missing Test Results | warning |
| `NC` | Not Compliant | error |
| `unknown` | No value or an unrecognized value | grey |

The filter chips show the levels in this order: HL3, HL2, HL1, AFNR, MTR, NC, unknown.

## Submodel structure read by the parser

[`parseRailwayFireProtection`](utils/parseRailwayFireProtection.ts) turns the submodel into the plain data model in [`types/index.ts`](types/index.ts). The components only render that model and never touch the submodel themselves.

```text
RailwayFireProtection
├── ManufacturerInformation
│   └── ManufacturerName, ManufacturerProductDesignation,
│       OrderCodeOfManufacturer, ProductArticleNumberOfManufacturer
├── Material
│   ├── MaterialName, MaterialManufacturer, TestedMaterialCombinationDescription
│   ├── MaterialCharacteristics            (Range, 0–100)
│   └── Masses
│       └── TotalMassPerUnit, CombustibleMassPerUnit, Unit
└── FireProtectionCertificates
    ├── RequirementsSets[]
    │   ├── Requirement
    │   ├── HazardLevel                     (value + valueId)
    │   └── ReportReferences[]              (ReferenceElements)
    └── Reports[]
        ├── ReportFile, ReportComment
        ├── Tests[]
        │   └── TestProcedure, TestResult, TestDate, TestComment, TestReportNumber
        └── LabInformation
            ├── LabName, LabAccreditation, ReportAuthor
            └── LabAddress                  (Contact Information 1.0)
```

Multi-language values are shown in English, otherwise in the first language available.

### Tolerance for flawed submodels

The official IDTA 02102 example has a few flaws, so the parser is lenient:

- **Lookup by idShort first.** A child is found by its idShort (a numeric suffix such as `Report01` is accepted), and only then by its semanticId. The example gives some elements the wrong semanticId, e.g. `LabInformation` has the one of `ReportComment`.
- **Quoted values.** One pair of surrounding quotes is removed, since the example stores some strings with literal quotes (`"Compliant: Hazard Level 3"`).
- **Broken report references.** Each `ReportReference` is resolved by [`resolveReportLink`](utils/parseRailwayFireProtection.ts) to one of four statuses:

  | Status | When |
  | --- | --- |
  | `resolved` | The key path leads to an entry of `Reports`, or to an element inside one (e.g. its `ReportFile`). |
  | `repaired` | The key path is broken, but the report can be found from the key after `Reports` (otherwise the last key), either as a list index or as a report idShort. Also used when the reference names a different submodel id but the report is found in this one. The example uses `FCIL` instead of `FireProtectionCertificates`, so its references end up here. |
  | `external` | An `ExternalReference` or a `GlobalReference` key, e.g. a URL to a report document. |
  | `unresolved` | None of the above. The note says which key couldn't be followed. |

## FCIL export

The *Download FCIL* button fills the UNIFE [*EN 45545 – Fire Certificate Inventory List Template*](https://www.unife.org/activities/standards-and-regulation/firesafetylist/) (UNIFE Doc TGFS.06, revision 06, English). Rail suppliers use that Excel workbook to list their combustible materials and the test reports that prove EN 45545-2 compliance.

### The template is not part of this repository

UNIFE grants no licence for the template, and its [terms of use](https://www.unife.org/terms-of-use/) forbid copying and distributing its content; the workbook also contains the registered UNIFE logo. The plugin therefore doesn't ship it:

1. The first export opens a dialog that links to the UNIFE page. The user downloads the template there and selects it.
2. The selected file is checked: the *Cover Sheet* must name `TGFS.06` and `Revision: 06`. The cell layout differs between revisions and languages, so other files are rejected, including the German version.
3. The export runs in the browser. Only if it succeeds is the template remembered in the browser's IndexedDB ([`templateStorage.ts`](utils/templateStorage.ts)), so later exports download directly. *Choose another FCIL template* replaces it. Where IndexedDB is unavailable, e.g. in a private window, the template is asked for again next time.

The template never leaves the user's browser.

### Filled cells

Only the template's input cells, which it marks in light yellow, are written. [`fcilExport.ts`](utils/fcilExport.ts) checks the fill of every cell before writing it and fails otherwise. The grey cells are the template's own lookups, e.g. the requirement set (AM) and the test reference numbers, and keep their formulas.

The sheet *FCIL* gets one row per requirement set, in the order of the tiles, starting in row 11. Each row has room for six test methods of six columns each (AN–AS for test method 1, AT–AY for 2, … BR–BW for 6); further tests continue in the next row.

| Cell | Content |
| --- | --- |
| *Cover Sheet* K27 (System / Product) | `ManufacturerProductDesignation` |
| *Cover Sheet* F36 (Company details) | `ManufacturerName` |
| N (Supplier part number) | `ProductArticleNumberOfManufacturer`, otherwise `OrderCodeOfManufacturer` |
| P (Part name) | `ManufacturerProductDesignation` |
| Q, R (Material and manufacturer name) | `MaterialName`, `MaterialManufacturer` |
| S (Material characteristics) | `MaterialCharacteristics`, e.g. `70 – 85` |
| T, U and V, W (Mass and combustible mass per unit) | `TotalMassPerUnit` and `CombustibleMassPerUnit` as numbers, each with `Unit` |
| X (Quantity per product) | `1`: the submodel describes one product, so the template's combustible mass per product (Y) equals the combustible mass per unit |
| AJ (Material tested) | `TestedMaterialCombinationDescription` |
| AK (Product category) | Only if the tests leave exactly one, see below |
| AP–AS per test method (result, laboratory, report number, date) | `TestResult`, `LabName` of the report, `TestReportNumber` (otherwise the report's numbers), `TestDate` as dd/mm/yyyy |
| BY (Hazard Level Met) | `HazardLevel`, as the IDTA 02102 label; these are also the entries of the template's list |
| CA (Comments / Remarks) | The requirement set, the test procedures by test method, the product category candidates, `ReportComment` and links to external reports |

Also cleared: the sample product categories the template ships in AK, and the vehicle's hazard level in O6, which the customer chooses.

The workbook is edited in its XML ([`xlsxTemplate.ts`](utils/xlsxTemplate.ts)), so formatting, lists, images and the other sheets stay as UNIFE made them. Excel recalculates all formulas on opening.

### Product category (column AK)

The template looks up the requirement set (AM) and the test methods from the product category, so [`fcilClassification.ts`](utils/fcilClassification.ts) works backwards from the tests:

1. **Test procedure → test method.** A code in the procedure is used as is (the official example writes `DIN EN ISO 5659-2; T10.03`). Otherwise the test standard is matched by its number (e.g. EN ISO 9239-1 → T04).
2. **Test methods → requirement sets.** A requirement set fits if, at the row's hazard level, every method it requires has a test and every test belongs to it. Methods in parentheses or without a limit (`CITG: -`) are optional; `T02/T04` accepts either. These rules come from the template's *Requirements* sheet. If the template knows the requirement set named in `Requirement` (e.g. `R10`), only that one is kept.
3. **Requirement sets → product categories**, from the template's *EN45545 classifications* sheet. The names are written exactly as in the template's list.

If exactly one product category is left, it goes into AK and the template fills the grey columns. Otherwise the candidates are listed in CA. In the official example none of the requirement sets has a single candidate: R10 leaves IN1C and IN15, R24 leaves EL9 (R24) and *Grouping Rule 2*, R26 leaves EL9 (R26) and EL10.

Limitations:

- The test results aren't compared with the required values.
- The template has a single hazard level (O6) for all its lookups. Left empty, the lookups use the HL3 requirements, even in rows with another hazard level.

## Files

```text
RailwayFireProtection_v1_0.vue          Entry: loading, filter, tile grid, dialog
RailwayFireProtection_v1_0/
├── components/
│   ├── RailwayFireProtectionSummary.vue        Product and material cards
│   ├── RailwayFireProtectionMassChart.vue      Donut chart of the combustible share
│   ├── RailwayFireProtectionTile.vue           One requirement set tile
│   ├── RailwayFireProtectionDetails.vue        Dialog content of a requirement set
│   ├── RailwayFireProtectionReport.vue         One report with file, tests and laboratory
│   ├── RailwayFireProtectionFlipTransition.vue Dialog transition out of the tile
│   ├── RailwayFireProtectionFcilDownload.vue   FCIL download button
│   └── RailwayFireProtectionFcilTemplateDialog.vue  Asks for the FCIL template
├── types/index.ts                      Data model produced by the parser
└── utils/
    ├── parseRailwayFireProtection.ts   Submodel → data model, report reference resolution
    ├── hazardLevel.ts                  Hazard level parsing and display metadata
    ├── presentation.ts                 Sorting, filtering, counting and label helpers
    ├── flipAnimation.ts                Flip-and-zoom animation (Web Animations API)
    ├── text.ts                         Quote stripping, language selection
    ├── fcilExport.ts                   Data model → FCIL rows, fills the template
    ├── fcilClassification.ts           Product category from the tests
    ├── xlsxTemplate.ts                 Writes cells into an XLSX file's XML
    └── templateStorage.ts              Remembers the FCIL template in the browser
```

`fcilExport.ts` and the ZIP library `fflate` are loaded only when the user downloads an FCIL.

`main.ts` loads every `.vue` file below `Plugins/Submodels`, but registers only components with a `semanticId`. The sub-components therefore must not declare one.

## Tests

```bash
pnpm test:run tests/components/Plugins/Submodels/RailwayFireProtection_v1_0
```

- [`RailwayFireProtection_v1_0.parser.test.ts`](../../../../../tests/components/Plugins/Submodels/RailwayFireProtection_v1_0.parser.test.ts): the parser, report reference resolution, hazard levels and presentation helpers.
- [`RailwayFireProtection_v1_0.test.ts`](../../../../../tests/components/Plugins/Submodels/RailwayFireProtection_v1_0.test.ts): the mounted plugin, from the empty state to opening the details of a tile.
- [`RailwayFireProtection_v1_0.fcil.test.ts`](../../../../../tests/components/Plugins/Submodels/RailwayFireProtection_v1_0.fcil.test.ts): the FCIL export, from reading the template to the filled workbook.

The first two use the official IDTA 02102 example, which [`tests/helpers/idtaExamples.ts`](../../../../../tests/helpers/idtaExamples.ts) downloads from `admin-shell-io/submodel-templates` at test time instead of keeping a copy in this repository. The FCIL tests likewise download the UNIFE template from unife.org with [`tests/helpers/unifeTemplates.ts`](../../../../../tests/helpers/unifeTemplates.ts). Without network access, the tests that need a download are skipped and the rest still run.
