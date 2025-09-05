// occt-import-js.d.ts
// TypeScript type definitions for occt-import-js

declare module 'occt-import-js' {
    /**
     * The main OCCT import interface.
     * All functions are provided once the WebAssembly module is fully loaded.
     */
    export interface OcctImport {
        /**
         * Reads a STEP file from a binary buffer and returns the parsed geometry data.
         * @param buffer STEP file content as Uint8Array
         * @param config Optional import configuration
         */
        ReadStepFile(buffer: Uint8Array, config?: StepIgesImportConfig | null): ImportResult;

        /**
         * Reads an IGES file from a binary buffer and returns the parsed geometry data.
         * @param buffer IGES file content as Uint8Array
         * @param config Optional import configuration
         */
        ReadIgesFile(buffer: Uint8Array, config?: StepIgesImportConfig | null): ImportResult;

        /**
         * Reads a BREP file from a binary buffer and returns the parsed geometry data.
         * @param buffer BREP file content as Uint8Array
         */
        ReadBrepFile(buffer: Uint8Array): ImportResult;

        /**
         * Export geometry data to STEP file format.
         */
        WriteStepFile(data: ExportData, config?: StepIgesExportConfig | null): Uint8Array;

        /**
         * Export geometry data to IGES file format.
         */
        WriteIgesFile(data: ExportData, config?: StepIgesExportConfig | null): Uint8Array;

        /**
         * Export geometry data to BREP file format.
         */
        WriteBrepFile(data: ExportData): Uint8Array;
    }

    export interface StepIgesImportConfig {
        /**
         * Import units (e.g., "mm", "inch"). If undefined, defaults are used.
         */
        lengthUnit?: string;
        /**
         * Whether to sew edges into a solid (default: true).
         */
        sewDtol?: number;
        /**
         * Whether to allow free edges (default: false).
         */
        allowFreeEdges?: boolean;
    }

    export interface StepIgesExportConfig {
        /**
         * Export units (e.g., "mm", "inch"). If undefined, defaults are used.
         */
        lengthUnit?: string;
        /**
         * STEP schema ("AP203" or "AP214").
         */
        schema?: string;
    }

    export interface ImportResult {
        meshes: ImportedMesh[];
        shapes?: any[]; // optional raw OCCT shape data
    }

    export interface ImportedMesh {
        name?: string;
        positions: number[]; // x,y,z triplets
        normals?: number[]; // nx,ny,nz triplets
        triangles: number[]; // vertex indices
        color?: { r: number; g: number; b: number; a?: number };
        edges?: EdgeData[];
    }

    export interface EdgeData {
        vertices: [number, number, number][];
    }

    export interface ExportData {
        shapes: any[]; // raw OCCT shape objects
    }

    /**
     * Loads the OCCT WebAssembly module asynchronously
     */
    function occtimportjs(options?: unknown): Promise<OcctImport>;

    export default occtimportjs;
}
