import { describe, expect, it } from 'vitest'
import { latestVersion, parseModels3D, versionTitle } from '@/components/Plugins/Submodels/Models3D_v1_0/utils/parseModel3D'
import {
  formatLabel,
  levelOfDetail,
  modelFacts,
  statusColor,
  technicalGroups,
  versionLabel,
} from '@/components/Plugins/Submodels/Models3D_v1_0/utils/presentation'
import ur5eSubmodel from './fixtures/models3d.ur5e.json'

// A Submodel as delivered by the repository: top-level elements live in `submodelElements`
const submodel = () => structuredClone(ur5eSubmodel) as any

describe('parseModels3D', () => {
  it('parses the UR5e Virtual Factory submodel', () => {
    const [model, ...rest] = parseModels3D(submodel())

    expect(rest).toHaveLength(0)
    expect(model.isPrimary).toBe(true)
    expect(model.valueIds).toEqual(['ur5e'])
    expect(model.objectType).toBe('Robot')
    expect(model.origin).toBe('Designed')
    expect(model.positivePurposes).toEqual(['Visualisation', 'Virtual commissioning', 'Training'])
    expect(model.negativePurposes).toEqual(['Manufacturing (not a CAD model)'])
    expect(model.simplification?.description).toContain('Low-poly')
    expect(model.representation).toBe('Mesh')
    expect(model.lengthUnit).toBe('m')
    expect(model.consumingApplications).toEqual([
      {
        name: 'Godot Engine',
        version: '4.7',
        qualifier: 'Virtual Factory runtime (Compatibility renderer)',
        vendor: 'Godot Foundation',
      },
    ])
    expect(model.classifications[0]).toMatchObject({ id: '3D-VIS', system: 'VirtualFactory' })

    expect(model.versions).toHaveLength(1)
    const [version] = model.versions
    expect(version).toMatchObject({
      fileName: 'ur5e.glb',
      versionId: '1.1',
      status: 'Released',
      setDate: '2026-10-04',
      format: { name: 'glTF', version: '2.0', qualifier: 'binary (.glb)' },
      providingOrganization: 'VF Automation Systems GmbH',
    })
    expect(version.previewFile?.contentType).toBe('image/png')
    expect(version.digitalFile?.value).toBe('/aasx/files/ur5e_type/ur5e.glb')
    expect(version.sourceApplication).toMatchObject({ name: 'Blender', vendor: 'Blender Foundation' })
  })

  it('returns no models without a Model3D list', () => {
    expect(parseModels3D({ submodelElements: [] })).toEqual([])
    expect(parseModels3D(undefined)).toEqual([])
  })

  it('tolerates missing optional blocks and numbered idShorts', () => {
    const [model] = parseModels3D({
      submodelElements: [
        {
          idShort: 'Model3D',
          modelType: 'SubmodelElementList',
          value: [
            {
              modelType: 'SubmodelElementCollection',
              value: [
                {
                  idShort: 'File',
                  modelType: 'SubmodelElementCollection',
                  value: [
                    {
                      idShort: 'FileVersion',
                      modelType: 'SubmodelElementList',
                      value: [
                        {
                          modelType: 'SubmodelElementCollection',
                          value: [{ idShort: 'FileName01', modelType: 'Property', value: 'part.stl' }],
                        },
                        {
                          modelType: 'SubmodelElementCollection',
                          value: [
                            { idShort: 'FileName', modelType: 'Property', value: 'part.glb' },
                            { idShort: 'DigitalFile', modelType: 'File', value: '' },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    expect(model.versions.map(version => version.fileName)).toEqual(['part.stl', 'part.glb'])
    expect(model.versions[1].digitalFile).toBeNull()
    expect(model.simplification).toBeNull()
    expect(model.boundingBoxes).toEqual([])
  })

  it('collects external files', () => {
    const source = submodel()
    const fileVersion = source.submodelElements[0].value[0].value[0].value[1].value[0]
    fileVersion.value.push({
      idShort: 'ExternalFile',
      modelType: 'SubmodelElementList',
      value: [
        {
          modelType: 'SubmodelElementCollection',
          value: [
            { idShort: 'ExternalUrl', modelType: 'Property', value: 'https://example.com/ur5e.glb' },
            {
              idShort: 'HostOrganization',
              modelType: 'SubmodelElementCollection',
              value: [{ idShort: 'OrganizationName', modelType: 'Property', value: 'Example Corp' }],
            },
          ],
        },
        { modelType: 'SubmodelElementCollection', value: [{ idShort: 'FileIdentifier', modelType: 'Property', value: 'no-url' }] },
      ],
    })

    const [model] = parseModels3D(source)
    expect(model.versions[0].externalFiles).toEqual([
      { url: 'https://example.com/ur5e.glb', identifier: '', host: 'Example Corp' },
    ])
  })
})

describe('version helpers', () => {
  it('picks the latest version by date', () => {
    const versions = [
      { key: 'a', setDate: '2026-01-01' },
      { key: 'b', setDate: '2026-03-01' },
      { key: 'c', setDate: '2026-02-01' },
    ] as any
    expect(latestVersion(versions)?.key).toBe('b')
    expect(latestVersion([])).toBeUndefined()
  })

  it('derives the title from the version, file name or index', () => {
    const [model] = parseModels3D(submodel())
    expect(versionTitle(model.versions[0], model, 0)).toBe('UR5e robot arm with PG-85 gripper (visualisation model)')
    expect(versionTitle({ ...model.versions[0], title: [] }, model, 0)).toBe('ur5e.glb')
    expect(versionTitle(undefined, { ...model, valueIds: [] }, 1)).toBe('3D Model 2')
  })
})

describe('presentation', () => {
  it('describes format and level of detail', () => {
    const [model] = parseModels3D(submodel())
    expect(formatLabel(model.versions[0])).toBe('glTF 2.0')
    expect(levelOfDetail(model)).toContain('Low-poly')
    expect(levelOfDetail({ ...model, simplification: null })).toBe('Mesh')
  })

  it('labels versions and colors statuses', () => {
    const [model] = parseModels3D(submodel())
    expect(versionLabel(model.versions[0], 0)).toBe('v1.1')
    expect(versionLabel({ ...model.versions[0], versionId: '' }, 2)).toBe('Version 3')
    expect(statusColor('Released')).toBe('success')
    expect(statusColor('In progress')).toBe('warning')
    expect(statusColor('Deprecated')).toBe('error')
    expect(statusColor('Whatever')).toBeUndefined()
    expect(statusColor('Invalid')).toBe('error')
    expect(statusColor('Not approved')).toBe('error')
    expect(statusColor('Unreleased')).toBe('error')
    expect(statusColor('Valid')).toBe('success')
    expect(statusColor('Approved for release')).toBe('success')
  })

  it('lists the key facts of the model', () => {
    const [model] = parseModels3D(submodel())
    expect(modelFacts(model).map(fact => [fact.label, fact.value])).toEqual([
      ['Object type', 'Robot'],
      ['Origin', 'Designed'],
      ['Representation', 'Mesh'],
      ['Unit', 'm'],
    ])

    const withBox = { ...model, boundingBoxes: [{ kind: 'Aligned', x: '0.4', y: '0.4', z: '1.2' }] }
    expect(modelFacts(withBox).at(-1)).toMatchObject({ label: 'Bounding box', value: '0.4 × 0.4 × 1.2 m' })
  })

  it('groups the remaining metadata and drops empty groups', () => {
    const [model] = parseModels3D(submodel())
    const groups = technicalGroups(model, model.versions[0])

    expect(groups.map(group => group.key)).toEqual(['file', 'applications', 'classification'])
    expect(groups[0].rows).toContainEqual({ label: 'Format', value: 'glTF 2.0 (binary (.glb))', icon: undefined })
    expect(groups[1].rows).toContainEqual({
      label: 'Created with',
      value: 'Blender 5.2 (Blender Foundation)',
      icon: undefined,
    })
    expect(groups[2].rows[0].value).toBe('3D-VIS – 3D visualisation model')

    expect(technicalGroups({ ...model, consumingApplications: [], classifications: [] }, undefined)).toEqual([])
  })
})
