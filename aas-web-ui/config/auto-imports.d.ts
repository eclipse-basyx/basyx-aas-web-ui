interface TypeAutoImport {
  name: string
  type: true
}

export const vueRuntimeAutoImports: string[]
export const vueAutoImportPreset: {
  from: string
  imports: Array<string | TypeAutoImport>
}
