import type {
  DetailField,
  DetailSection,
  Model3DApplication,
  Model3DEntry,
  Model3DVersion,
} from '../types'
import { pickLangString } from './parseModel3D'

function field (label: string, ...parts: Array<string | undefined>): DetailField | null {
  const value = parts.filter(part => part && part.trim() !== '').join(' ')
  return value === '' ? null : { label, value }
}

function compact (fields: Array<DetailField | null>): DetailField[] {
  return fields.filter((entry): entry is DetailField => entry !== null)
}

export function formatLabel (version: Model3DVersion | undefined): string {
  const format = version?.format
  return [format?.name, format?.version].filter(Boolean).join(' ')
}

/** "Level of detail": the simplification description, otherwise the geometry representation */
export function levelOfDetail (model: Model3DEntry): string {
  return model.simplification?.description || model.representation
}

function applicationValue (application: Model3DApplication): string {
  const name = [application.name, application.version].filter(Boolean).join(' ')
  const details = [application.qualifier, application.vendor].filter(Boolean).join(', ')
  return details ? `${name} (${details})` : name
}

/** Groups the metadata of one model version into the sections rendered by `Models3DDetails` */
export function buildDetailSections (model: Model3DEntry, version: Model3DVersion | undefined): DetailSection[] {
  const sections: DetailSection[] = [
    {
      key: 'file',
      title: 'File',
      icon: 'mdi-file-cog-outline',
      fields: compact([
        field('Format', formatLabel(version)),
        field('Format Qualifier', version?.format.qualifier),
        field('File Name', version?.fileName),
        field('Version', version?.versionId),
        field('Status', version?.status),
        field('Date', version?.setDate),
        field('Provided by', version?.providingOrganization),
      ]),
      chipGroups: [],
    },
    {
      key: 'model',
      title: 'Model',
      icon: 'mdi-cube-scan',
      fields: compact([
        field('Level of Detail', levelOfDetail(model)),
        field('Object Type', model.objectType),
        field('Origin', model.origin),
        field('Representation', model.representation),
        field('Length Unit', model.lengthUnit),
        ...model.boundingBoxes.map(box =>
          field(
            box.kind ? `Bounding Box (${box.kind})` : 'Bounding Box',
            [box.x, box.y, box.z].every(Boolean) ? `${box.x} × ${box.y} × ${box.z}` : '',
          ),
        ),
      ]),
      chipGroups: [
        { label: 'Suitable for', items: model.positivePurposes, color: 'success' },
        { label: 'Not suitable for', items: model.negativePurposes, color: 'error' },
        { label: 'Reduced elements', items: model.simplification?.reducedElements ?? [] },
        { label: 'Embedded information', items: model.embeddedInfo },
        { label: 'State', items: model.states },
      ],
    },
    {
      key: 'usage',
      title: 'Applications & Classification',
      icon: 'mdi-application-cog-outline',
      fields: compact([
        field('Created with', version?.sourceApplication ? applicationValue(version.sourceApplication) : ''),
        ...model.consumingApplications.map(application => field('Used by', applicationValue(application))),
        ...model.classifications.map(classification =>
          field(
            classification.system ? `Classification (${classification.system})` : 'Classification',
            classification.id,
            pickLangString(classification.name) && `– ${pickLangString(classification.name)}`,
          ),
        ),
      ]),
      chipGroups: [],
    },
  ]

  return sections.filter(section => section.fields.length > 0 || section.chipGroups.some(group => group.items.length > 0))
}
