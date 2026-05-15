# AAS Creation Wizard

This module provides a guided workflow for creating an Asset Administration Shell (AAS) together with selected standardized submodels in the BaSyx Web UI.

The current implementation focuses on helping users create an AAS through a multi-step wizard instead of manually assembling the full AAS/submodel JSON structure. 

The wizard currently covers the following steps:
1. **Asset Information**
   - Basic AAS and asset metadata


2. **Digital Nameplate**
   - Template-driven rendering of the Digital Nameplate submodel


3. **Technical Data**
   - Template-driven technical data submodel
   - Additional custom technical property areas
   - Arbitrary nested structures for user-defined technical data

4. **Handover Documentation**
   - Template-driven or structured collection of handover documentation submodel

## Main Concepts

### 1. Wizard Page

The main entry point is the wizard page, usually represented by an `index.vue` file.

It is responsible for:

- Displaying the Vuetify stepper
- Rendering the currently active step
- Passing navigation callbacks such as `next` and `prev`
- Resetting step components when required
- Coordinating the overall creation flow

### 2. Step Components

Each step component handles one part of the AAS creation process.

Typical responsibilities of a step component:

- Load or import the relevant template data
- Initialize local form state
- Render fields or nested submodel elements
- Validate required fields before moving forward
- Save completed data into the shared Pinia store
- Call `next()` after successful validation/save

The main step components are conceptually:

```text
StepAssetInformation.vue
StepDigitalNamePlate.vue
StepTechnicalData.vue
StepHandoverDocumentation.vue
```

### 3. Shared Store

A Pinia store is used to keep wizard data centralized.


## Recursive Submodel Renderer

The renderer takes normalized submodel elements and renders the correct input UI based on the element type.

Supported element types include:

- `Property`
- `MultiLanguageProperty`
- `File`
- `SubmodelElementCollection`
- `SubmodelElementList`

Conceptual component structure:

```text
SubmodelRenderer.vue
  ├── SubmodelDataElement.vue
  ├── SubmodelCollection.vue
  └── SubmodelList.vue
```

The renderer is responsible for:

- Dispatching elements to the correct UI component based on `modelType`
- Rendering nested collections recursively
- Supporting repeatable elements
- Updating parent form state through emitted events

## Form State Model

The renderer stores user input in a generic form-state object.

Conceptual shape:

```ts
type FormStateObject = Record<string, FormStateValue>

type FormStateValue =
  | string
  | number
  | boolean
  | File
  | null
  | LangString[]
  | FormStateObject
  | FormStateObject[]
```

## Template Normalization

Submodel templates may contain metadata, cardinality information, nested structures, or missing inline structures depending on the source template.

Normalization utilities prepare templates for rendering and building.

Typical responsibilities:

- Normalize submodel element structures
- Attach or preserve cardinality metadata
- Ensure nested children are available for rendering
- Prepare collections/lists for recursive rendering
- Reuse known structures such as Contact Information where the source template references them indirectly

## Cardinality and Validation

The module uses cardinality metadata from submodel templates to decide which elements are required, optional, or repeatable.

Typical cardinality helpers:

```ts
isRequiredElement(element)
isOptionalSingleElement(element)
isRepeatableElement(element)
```

## Building the Final Submodel 

After user input is collected, builder functions transform the generic form state into AAS-compatible JSON structures.

Builder files are found inside ```./builders```
The Final AAS along with its submodels is built in the composable file. 
```ts
useAASCreationSubmission.ts
```

## Technical Data: Custom Property Areas

The Technical Data step contains two important parts:

1. **Template-driven technical data**
   - Rendered through the recursive submodel renderer
   - Based on the available Technical Data template structure

2. **Custom Technical Property Areas**
   - Created by the user through a dedicated arbitrary structure editor
   - Allows flexible nested technical data beyond the fixed template

A technical property area can contain arbitrary nested nodes such as:

- Section
- Property
- Multi-language property
- Range

Conceptual data model:

A generic arbitrary node model is used to represent user-defined technical structures.The arbitrary editor allows the user to build nested structures visually. These structures are then converted into AAS submodel elements.

Conceptual arbitrary node model:

```ts
type ArbitraryNodeType =
  | 'section'
  | 'property'
  | 'multiLanguageProperty'
  | 'range'
```
### `ArbitraryStructureEditor.vue`
Responsibilities:

- Add/remove sections
- Add/remove custom properties
- Add/remove multi-language properties
- Add/remove ranges
- Support nested structures
- Maintain arbitrary node state

