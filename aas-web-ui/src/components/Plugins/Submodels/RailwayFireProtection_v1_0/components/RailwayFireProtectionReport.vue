<template>
  <v-card border flat>
    <v-card-item>
      <template #prepend>
        <v-icon color="primary" icon="mdi-file-document-check-outline" />
      </template>

      <v-card-title class="text-title-medium text-wrap">{{ reportTitle(report) }}</v-card-title>
      <v-card-subtitle v-if="report.lab?.name" class="text-wrap">{{ report.lab.name }}</v-card-subtitle>
    </v-card-item>

    <v-card-text class="d-flex flex-column ga-4">
      <v-alert
        v-if="repairNote"
        density="compact"
        icon="mdi-link-variant"
        title="Reference repaired"
        type="info"
        variant="tonal"
      >
        <div class="text-body-small">{{ repairNote }}</div>
      </v-alert>

      <!-- Report file -->
      <section>
        <div class="text-label-large mb-2">Report document</div>

        <div v-if="report.file" class="d-flex flex-wrap align-center ga-2">
          <v-icon :icon="isPdf ? 'mdi-file-pdf-box' : 'mdi-file-outline'" />
          <span class="text-body-medium text-break flex-grow-1">{{ fileName(report.file.value) }}</span>

          <v-btn
            v-if="canPreview"
            :prepend-icon="showPreview ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            size="small"
            variant="tonal"
            @click="showPreview = !showPreview"
          >
            {{ showPreview ? 'Hide preview' : 'Preview' }}
          </v-btn>

          <v-btn
            class="text-buttonText"
            color="primary"
            prepend-icon="mdi-download"
            size="small"
            variant="elevated"
            @click="downloadFile(report.file)"
          >
            Download
          </v-btn>
        </div>

        <div v-else class="text-body-medium text-medium-emphasis">No report document available</div>

        <v-expand-transition>
          <div v-if="showPreview && report.file" class="mt-3">
            <PDFPreview v-if="isPdf" :submodel-element-data="report.file" />
            <ImagePreview v-else :submodel-element-data="report.file" />
          </div>
        </v-expand-transition>
      </section>

      <section v-if="report.comment">
        <div class="text-label-large mb-1">Comment</div>
        <div class="text-body-medium">{{ report.comment }}</div>
      </section>

      <!-- Tests -->
      <section>
        <div class="text-label-large mb-2">Test results</div>

        <v-table v-if="report.tests.length > 0" class="border rounded" density="compact">
          <thead>
            <tr>
              <th>Test procedure</th>
              <th>Result</th>
              <th>Date</th>
              <th>Report no.</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="test in report.tests" :key="test.key">
              <td>
                <div>{{ test.procedure || test.idShort }}</div>
                <div v-if="test.comment" class="text-body-small text-medium-emphasis">{{ test.comment }}</div>
              </td>

              <td class="font-weight-medium">{{ test.result || '–' }}</td>
              <td class="text-no-wrap">{{ test.date || '–' }}</td>
              <td class="text-no-wrap">{{ test.reportNumber || '–' }}</td>
            </tr>
          </tbody>
        </v-table>

        <div v-else class="text-body-medium text-medium-emphasis">No tests listed</div>
      </section>

      <!-- Laboratory -->
      <section v-if="labRows.length > 0">
        <div class="text-label-large mb-1">Laboratory</div>

        <v-list class="py-0" density="compact">
          <v-list-item v-for="row in labRows" :key="row.label" class="px-0" :prepend-icon="row.icon">
            <v-list-item-subtitle class="text-label-small">{{ row.label }}</v-list-item-subtitle>

            <v-list-item-title class="text-body-medium text-wrap">
              <a v-if="row.href" :href="row.href" rel="noopener noreferrer" target="_blank">{{ row.value }}</a>
              <span v-else>{{ row.value }}</span>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </section>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
  import type { FireReport } from '../types'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
  import { useContactInformation_v1_0Utils } from '@/composables/AAS/SubmodelTemplates/ContactInformation_v1_0Utils'
  import { fileName, reportTitle, websiteUrl } from '../utils/presentation'

  // Types
  interface LabRow { label: string, value: string, icon: string, href?: string }

  defineOptions({
    name: 'RailwayFireProtectionReport',
  })

  // Props
  const props = defineProps<{
    report: FireReport
    /** Shown when the reference to this report had to be repaired */
    repairNote?: string
  }>()

  // Composables
  const { downloadFile } = useSMEFile()
  const { determineAddress } = useContactInformation_v1_0Utils()

  // Reactive data
  const showPreview = ref(false)

  // Computed properties
  const contentType = computed(() => (props.report.file?.contentType ?? '').toLowerCase())
  const isPdf = computed(() => contentType.value.includes('pdf') || /\.pdf$/i.test(props.report.file?.value ?? ''))
  const isImage = computed(() => contentType.value.startsWith('image/'))
  const canPreview = computed(() => isPdf.value || isImage.value)

  const labRows = computed<LabRow[]>(() => {
    const lab = props.report.lab
    if (!lab) {
      return []
    }
    const website = websiteUrl(lab.website)
    const rows: Array<LabRow | null> = [
      lab.name ? { label: 'Name', value: lab.name, icon: 'mdi-domain' } : null,
      lab.accreditation ? { label: 'Accreditation', value: lab.accreditation, icon: 'mdi-certificate-outline' } : null,
      lab.author ? { label: 'Report author', value: lab.author, icon: 'mdi-account-edit-outline' } : null,
      lab.address ? { label: 'Address', value: determineAddress(lab.address), icon: 'mdi-map-marker-outline' } : null,
      lab.email ? { label: 'Email', value: lab.email, icon: 'mdi-email-outline', href: `mailto:${lab.email}` } : null,
      lab.phone ? { label: 'Phone', value: lab.phone, icon: 'mdi-phone-outline' } : null,
      lab.website ? { label: 'Website', value: lab.website, icon: 'mdi-web', href: website || undefined } : null,
    ]
    return rows.filter((row): row is LabRow => !!row && row.value.trim() !== '')
  })
</script>
