import type { DetailGroup, DetailRow, Model3DApplication, Model3DEntry, Model3DVersion } from '../types'
import { pickLangString } from './parseModel3D'

function row (label: string, value: string | undefined, icon?: string): DetailRow | null {
  return value && value.trim() !== '' ? { label, value, icon } : null
}

function compact (rows: Array<DetailRow | null>): DetailRow[] {
  return rows.filter((entry): entry is DetailRow => entry !== null)
}

function applicationLabel (application: Model3DApplication): string {
  const name = [application.name, application.version].filter(Boolean).join(' ')
  return application.vendor ? `${name} (${application.vendor})` : name
}

/** e.g. "glTF 2.0" */
export function formatLabel (version: Model3DVersion | undefined): string {
  return [version?.format.name, version?.format.version].filter(Boolean).join(' ')
}

/** "Level of detail": the simplification description, otherwise the geometry representation */
export function levelOfDetail (model: Model3DEntry): string {
  return model.simplification?.description || model.representation
}

export function versionLabel (version: Model3DVersion, index: number): string {
  return version.versionId ? `v${version.versionId}` : `Version ${index + 1}`
}

/** Colors well-known status values (IDTA does not define a fixed value list) */
export function statusColor (status: string): string | undefined {
  const value = status.toLowerCase()
  if (/released|approved|published|valid|final/.test(value)) {
    return 'success'
  }
  if (/draft|review|progress|preliminary|proposed/.test(value)) {
    return 'warning'
  }
  if (/obsolete|deprecated|withdrawn|rejected|invalid|retired/.test(value)) {
    return 'error'
  }
  return undefined
}

/** The properties of the model that are shown next to the viewer */
export function modelFacts (model: Model3DEntry): DetailRow[] {
  const box = model.boundingBoxes.find(entry => entry.x && entry.y && entry.z)

  return compact([
    row('Object type', model.objectType, 'mdi-shape-outline'),
    row('Origin', model.origin, 'mdi-pencil-ruler-outline'),
    row('Representation', model.representation, 'mdi-vector-polygon'),
    row('Unit', model.lengthUnit, 'mdi-ruler'),
    box ? row('Bounding box', `${box.x} × ${box.y} × ${box.z} ${model.lengthUnit}`.trim(), 'mdi-cube-scan') : null,
  ])
}

/** The remaining metadata, shown in the collapsible "Technical details" */
export function technicalGroups (model: Model3DEntry, version: Model3DVersion | undefined): DetailGroup[] {
  const format = [formatLabel(version), version?.format.qualifier && `(${version.format.qualifier})`]
    .filter(Boolean)
    .join(' ')

  const groups: DetailGroup[] = [
    {
      key: 'file',
      title: 'File',
      icon: 'mdi-file-cog-outline',
      rows: compact([
        row('File name', version?.fileName),
        row('Format', format),
        row('Version', version?.versionId),
        row('Date', version?.setDate),
        row('Provided by', version?.providingOrganization),
      ]),
    },
    {
      key: 'applications',
      title: 'Applications',
      icon: 'mdi-application-cog-outline',
      rows: compact([
        row('Created with', version?.sourceApplication ? applicationLabel(version.sourceApplication) : ''),
        ...model.consumingApplications.map(application => row('Used by', applicationLabel(application))),
      ]),
    },
    {
      key: 'classification',
      title: 'Classification',
      icon: 'mdi-tag-outline',
      rows: compact([
        ...model.classifications.map(classification =>
          row(
            classification.system || 'Class',
            [classification.id, pickLangString(classification.name)].filter(Boolean).join(' – '),
          ),
        ),
        row('Embedded information', model.embeddedInfo.join(', ')),
        row('State', model.states.join(', ')),
      ]),
    },
  ]

  return groups.filter(group => group.rows.length > 0)
}
