<template>
    <v-container fluid class="pa-0">
        <VisualizationHeader :submodel-element-data="submodelElementData" default-title="Handover Documentation" />

        <!-- Loading -->
        <v-card v-if="isLoading" class="mb-4">
            <v-skeleton-loader type="list-item-avatar, divider, list-item-avatar" :height="144" />
        </v-card>

        <template v-else>
            <!-- ROOT: Documents + (later) Entities -->
            <v-expansion-panels v-model="rootPanel">
                <!-- Documents container -->
                <v-expansion-panel>
                    <v-expansion-panel-title>
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-folder-outline</v-icon>
                            </template>

                            <v-list-item-title>
                                {{ documentsSml ? nameToDisplay(documentsSml) : 'Documents' }}
                                <DescriptionTooltip :description-array="documentsSml?.description" />
                            </v-list-item-title>
                        </v-list-item>
                    </v-expansion-panel-title>

                    <v-expansion-panel-text class="pt-4">
                        <!-- Inner: each Document -->
                        <v-expansion-panels v-if="documents.length > 0" v-model="panel">
                            <v-expansion-panel v-for="(document, i) in documents" :key="document.idShort ?? i">
                                <v-expansion-panel-title>
                                    <v-list-item class="pa-0">
                                        <template #prepend>
                                            <v-icon size="small">mdi-file-outline</v-icon>
                                        </template>

                                        <v-list-item-title>
                                            {{ nameToDisplay(document) }}
                                            <DescriptionTooltip :description-array="document?.description" />
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-expansion-panel-title>

                                <v-divider v-if="panel === i" />

                                <v-expansion-panel-text class="pt-4">
                                    <!-- Section title -->
                                    <div class="text-subtitle-2 mb-2">Document Ids</div>

                                    <!-- DocumentIds -->
                                    <template v-if="(document.documentIds ?? []).length > 0">
                                        <v-card variant="outlined" class="mt-3">
                                            <v-table>
                                                <thead>
                                                    <tr>
                                                        <th
                                                            v-for="idProperty in document.documentIds?.[0]?.value ?? []"
                                                            :key="idProperty.idShort">
                                                            <div class="text-caption">
                                                                <span>{{ nameToDisplay(idProperty) }}</span>
                                                                <DescriptionTooltip
                                                                    :description-array="idProperty?.description" />
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    <tr
                                                        v-for="(documentIdSMC, j) in getDocumentIds(document)"
                                                        :key="documentIdSMC.idShort ?? String(j)"
                                                        v-show="hasValue(documentIdSMC)"
                                                        :class="Number(j) % 2 === 0 ? 'bg-tableEven' : 'bg-tableOdd'">
                                                        <td
                                                            v-for="idProperty in documentIdSMC.value ?? []"
                                                            :key="idProperty.idShort">
                                                            <!-- MultiLanguageProperty -->
                                                            <template
                                                                v-if="idProperty.modelType === 'MultiLanguageProperty'">
                                                                <!-- Show english value, if available -->
                                                                <div
                                                                    v-if="valueToDisplay(idProperty)"
                                                                    class="text-caption text-subtitleText">
                                                                    {{ valueToDisplay(idProperty) }}
                                                                </div>

                                                                <!-- Otherwise show all available values -->
                                                                <div v-else>
                                                                    <template
                                                                        v-for="(langStringSet, k) in getLangSets(
                                                                            idProperty
                                                                        )"
                                                                        :key="k">
                                                                        <div class="text-caption">
                                                                            <v-chip size="x-small" label class="mr-1">
                                                                                {{ langStringSet.language }}
                                                                            </v-chip>
                                                                            {{ langStringSet.text }}
                                                                        </div>
                                                                    </template>
                                                                </div>
                                                            </template>

                                                            <!-- Default -->
                                                            <span v-else class="text-caption text-subtitleText">
                                                                {{ valueToDisplay(idProperty) }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </v-table>
                                        </v-card>
                                    </template>

                                    <v-alert
                                        v-else
                                        class="mt-3"
                                        density="compact"
                                        type="warning"
                                        variant="outlined"
                                        text="No Document IDs available" />

                                    <!-- Document Versions -->
                                    <div class="mt-6 text-subtitle-2 mb-2">Document Versions</div>

                                    <template v-if="(document.documentVersionInfo ?? []).length > 0">
                                        <div class="text-caption text-subtitleText">
                                            <!-- Versions found: {{ (document.documentVersionInfo ?? []).length }} -->
                                            <template v-if="(document.documentVersionInfo ?? []).length > 0">
                                                <v-expansion-panels variant="accordion" class="mt-2">
                                                    <v-expansion-panel
                                                        v-for="(versionSmc, v) in document.documentVersionInfo ?? []"
                                                        :key="versionSmc.idShort ?? versionSmc.id ?? `version-${v}`">
                                                        <v-expansion-panel-title>
                                                            <v-list-item class="pa-0">
                                                                <template #prepend>
                                                                    <v-icon size="small"
                                                                        >mdi-file-document-outline</v-icon
                                                                    >
                                                                </template>

                                                                <v-list-item-title>
                                                                    {{ nameToDisplay(versionSmc) }}
                                                                    <DescriptionTooltip
                                                                        :description-array="versionSmc?.description" />
                                                                </v-list-item-title>
                                                            </v-list-item>
                                                        </v-expansion-panel-title>

                                                        <v-expansion-panel-text class="pt-4">
                                                            <div class="text-caption text-subtitleText">
                                                                <!-- Version element children:
                                                                {{ (versionSmc.value ?? []).length }} -->
                                                                <v-expansion-panel-text class="pt-4">
                                                                    <v-card variant="outlined">
                                                                        <v-table>
                                                                            <tbody>
                                                                                <tr
                                                                                    v-for="(child, c) in (
                                                                                        versionSmc.value ?? []
                                                                                    ).filter(
                                                                                        (x: any) =>
                                                                                            !isAttachmentChild(x)
                                                                                    )"
                                                                                    :key="
                                                                                        child.idShort ??
                                                                                        child.id ??
                                                                                        `child-${c}`
                                                                                    "
                                                                                    :class="
                                                                                        Number(c) % 2 === 0
                                                                                            ? 'bg-tableEven'
                                                                                            : 'bg-tableOdd'
                                                                                    ">
                                                                                    <td style="width: 35%">
                                                                                        <div class="text-caption">
                                                                                            {{ nameToDisplay(child) }}
                                                                                            <DescriptionTooltip
                                                                                                :description-array="
                                                                                                    child?.description
                                                                                                " />
                                                                                        </div>
                                                                                    </td>

                                                                                    <td>
                                                                                        <!-- MultiLanguageProperty -->
                                                                                        <template
                                                                                            v-if="
                                                                                                child.modelType ===
                                                                                                'MultiLanguageProperty'
                                                                                            ">
                                                                                            <div
                                                                                                v-if="
                                                                                                    valueToDisplay(
                                                                                                        child
                                                                                                    )
                                                                                                "
                                                                                                class="text-caption text-subtitleText">
                                                                                                {{
                                                                                                    valueToDisplay(
                                                                                                        child
                                                                                                    )
                                                                                                }}
                                                                                            </div>
                                                                                            <div v-else>
                                                                                                <div
                                                                                                    v-for="(
                                                                                                        langStringSet, k
                                                                                                    ) in getLangSets(
                                                                                                        child
                                                                                                    )"
                                                                                                    :key="k"
                                                                                                    class="text-caption">
                                                                                                    <v-chip
                                                                                                        size="x-small"
                                                                                                        label
                                                                                                        class="mr-1">
                                                                                                        {{
                                                                                                            langStringSet.language
                                                                                                        }}
                                                                                                    </v-chip>
                                                                                                    {{
                                                                                                        langStringSet.text
                                                                                                    }}
                                                                                                </div>
                                                                                            </div>
                                                                                        </template>

                                                                                        <!-- SubmodelElementList (e.g., Language list, RefersToEntities list, DigitalFiles list) -->
                                                                                        <!-- <template
                                                                                            v-else-if="
                                                                                                child.modelType ===
                                                                                                'SubmodelElementList'
                                                                                            ">
                                                                                            <div
                                                                                                class="text-caption text-subtitleText">
                                                                                                List entries:
                                                                                                {{
                                                                                                    (child.value ?? [])
                                                                                                        .length
                                                                                                }}
                                                                                            </div>
                                                                                        </template> -->
                                                                                        <template
                                                                                            v-else-if="
                                                                                                child.modelType ===
                                                                                                'SubmodelElementList'
                                                                                            ">
                                                                                            <div
                                                                                                v-if="
                                                                                                    (child.value ?? [])
                                                                                                        .length === 0
                                                                                                "
                                                                                                class="text-caption text-subtitleText">
                                                                                                —
                                                                                            </div>

                                                                                            <div v-else>
                                                                                                <div
                                                                                                    v-for="(
                                                                                                        entry, e
                                                                                                    ) in child.value ??
                                                                                                    []"
                                                                                                    :key="
                                                                                                        entry.idShort ??
                                                                                                        entry.id ??
                                                                                                        `entry-${e}`
                                                                                                    "
                                                                                                    class="text-caption text-subtitleText">
                                                                                                    <!-- entry can be Property, ReferenceElement, File etc -->
                                                                                                    <template
                                                                                                        v-if="
                                                                                                            entry.modelType ===
                                                                                                            'MultiLanguageProperty'
                                                                                                        ">
                                                                                                        {{
                                                                                                            valueToDisplay(
                                                                                                                entry
                                                                                                            )
                                                                                                        }}
                                                                                                    </template>

                                                                                                    <template v-else>
                                                                                                        {{
                                                                                                            valueToDisplay(
                                                                                                                entry
                                                                                                            )
                                                                                                        }}
                                                                                                    </template>
                                                                                                </div>
                                                                                            </div>
                                                                                        </template>
                                                                                        <!-- File -->
                                                                                        <template
                                                                                            v-else-if="
                                                                                                child.modelType ===
                                                                                                'File'
                                                                                            ">
                                                                                            <div
                                                                                                class="text-caption text-subtitleText">
                                                                                                {{ child.contentType }}
                                                                                                <span
                                                                                                    v-if="child.value">
                                                                                                    —
                                                                                                    {{
                                                                                                        child.value
                                                                                                    }}</span
                                                                                                >
                                                                                            </div>
                                                                                        </template>

                                                                                        <!-- Default -->
                                                                                        <span
                                                                                            v-else
                                                                                            class="text-caption text-subtitleText">
                                                                                            {{ valueToDisplay(child) }}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </v-table>
                                                                    </v-card>
                                                                    <!-- Tabs for File and Digital Files -->
                                                                    <!-- <v-sheet
                                                                        v-if="
                                                                            versionSmc.value?.some(
                                                                                (sme: any) =>
                                                                                    sme.modelType === 'File' ||
                                                                                    (sme.modelType ===
                                                                                        'SubmodelElementList' &&
                                                                                        sme.value?.some(
                                                                                            (entry: any) =>
                                                                                                entry.modelType ===
                                                                                                'File'
                                                                                        ))
                                                                            )
                                                                        "
                                                                        class="mt-4"
                                                                        variant="outlined">
                                                                        <v-tabs v-model="tab" color="primary">
                                                                            <v-tab value="one">Preview File</v-tab>
                                                                            <v-tab value="two">Digital Files</v-tab>
                                                                            <v-tab value="three">Item Three</v-tab>
                                                                        </v-tabs>

                                                                        <v-divider></v-divider>

                                                                        <v-tabs-window v-model="tab">
                                                                            <v-tabs-window-item value="one">
                                                                                <v-sheet class="pa-5" color="purple">
                                                                                    >One
                                                                                </v-sheet>
                                                                            </v-tabs-window-item>
                                                                            <v-tabs-window-item value="two">
                                                                                <v-sheet class="pa-5" color="orange"
                                                                                    >Two</v-sheet
                                                                                >
                                                                            </v-tabs-window-item>
                                                                            <v-tabs-window-item value="three">
                                                                                <v-sheet class="pa-5" color="brown"
                                                                                    >Three</v-sheet
                                                                                >
                                                                            </v-tabs-window-item>
                                                                        </v-tabs-window>
                                                                    </v-sheet> -->
                                                                    <!-- Attachments and Files -->
                                                                    <!-- Attachments -->
                                                                    <div v-if="hasAttachments(versionSmc)" class="mt-4">
                                                                        <div class="text-subtitle-2 mb-2">
                                                                            Attachments
                                                                        </div>

                                                                        <v-tabs
                                                                            :model-value="getFileTab(versionSmc)"
                                                                            @update:model-value="
                                                                                (val) => setFileTab(versionSmc, val)
                                                                            "
                                                                            density="compact"
                                                                            color="primary">
                                                                            <v-tab value="preview">Preview File</v-tab>
                                                                            <v-tab value="digital">Digital Files</v-tab>
                                                                        </v-tabs>

                                                                        <v-divider class="mt-2" />

                                                                        <v-window
                                                                            :model-value="getFileTab(versionSmc)"
                                                                            class="mt-3">
                                                                            <!-- Preview -->
                                                                            <v-window-item value="preview">
                                                                                <template
                                                                                    v-if="getPreviewFile(versionSmc)">
                                                                                    <template
                                                                                        v-for="pf in [
                                                                                            getPreviewFile(versionSmc),
                                                                                        ]"
                                                                                        :key="
                                                                                            pf?.id ?? pf?.path ?? 'pf'
                                                                                        ">
                                                                                        <!-- Render preview based on contentType -->
                                                                                        <ImagePreview
                                                                                            v-if="
                                                                                                pf?.contentType?.includes(
                                                                                                    'image'
                                                                                                )
                                                                                            "
                                                                                            :submodel-element-data="
                                                                                                pf
                                                                                            " />
                                                                                        <PDFPreview
                                                                                            v-else-if="
                                                                                                pf?.contentType?.includes(
                                                                                                    'pdf'
                                                                                                )
                                                                                            "
                                                                                            :submodel-element-data="
                                                                                                pf
                                                                                            " />
                                                                                        <CADPreview
                                                                                            v-else-if="
                                                                                                pf?.contentType &&
                                                                                                (pf.contentType.includes(
                                                                                                    'sla'
                                                                                                ) ||
                                                                                                    pf.contentType.includes(
                                                                                                        'stl'
                                                                                                    ) ||
                                                                                                    pf.contentType.includes(
                                                                                                        'model'
                                                                                                    ) ||
                                                                                                    pf.contentType.includes(
                                                                                                        'obj'
                                                                                                    ) ||
                                                                                                    pf.contentType.includes(
                                                                                                        'gltf'
                                                                                                    ))
                                                                                            "
                                                                                            :submodel-element-data="
                                                                                                pf
                                                                                            " />
                                                                                        <v-alert
                                                                                            v-else
                                                                                            text="No preview available for this file type"
                                                                                            density="compact"
                                                                                            type="warning"
                                                                                            variant="outlined"
                                                                                            class="mt-3" />

                                                                                        <v-card-actions
                                                                                            class="pt-4 pb-0 pr-0">
                                                                                            <v-spacer />
                                                                                            <v-btn
                                                                                                size="small"
                                                                                                color="primary"
                                                                                                variant="elevated"
                                                                                                prepend-icon="mdi-download"
                                                                                                class="text-buttonText"
                                                                                                @click="
                                                                                                    downloadFile(pf)
                                                                                                ">
                                                                                                Download Preview File
                                                                                            </v-btn>
                                                                                        </v-card-actions>
                                                                                    </template>
                                                                                </template>

                                                                                <v-alert
                                                                                    v-else
                                                                                    text="No available preview file"
                                                                                    density="compact"
                                                                                    type="warning"
                                                                                    variant="outlined" />
                                                                            </v-window-item>

                                                                            <!-- Digital -->
                                                                            <v-window-item value="digital">
                                                                                <template
                                                                                    v-if="
                                                                                        getDigitalFiles(versionSmc)
                                                                                            .length > 0
                                                                                    ">
                                                                                    <v-expansion-panels
                                                                                        variant="accordion">
                                                                                        <v-expansion-panel
                                                                                            v-for="(
                                                                                                fileEl, f
                                                                                            ) in getDigitalFiles(
                                                                                                versionSmc
                                                                                            )"
                                                                                            :key="
                                                                                                fileEl.id ??
                                                                                                fileEl.path ??
                                                                                                fileEl.idShort ??
                                                                                                `digital-${f}`
                                                                                            ">
                                                                                            <v-expansion-panel-title>
                                                                                                <v-list-item
                                                                                                    class="pa-0">
                                                                                                    <template #prepend>
                                                                                                        <v-icon
                                                                                                            size="small"
                                                                                                            >mdi-paperclip</v-icon
                                                                                                        >
                                                                                                    </template>
                                                                                                    <v-list-item-title>
                                                                                                        {{
                                                                                                            nameToDisplay(
                                                                                                                fileEl
                                                                                                            ) ||
                                                                                                            fileEl.idShort ||
                                                                                                            `Digital file ${f + 1}`
                                                                                                        }}
                                                                                                    </v-list-item-title>
                                                                                                </v-list-item>
                                                                                            </v-expansion-panel-title>

                                                                                            <v-expansion-panel-text
                                                                                                class="pt-4">
                                                                                                <ImagePreview
                                                                                                    v-if="
                                                                                                        fileEl?.contentType?.includes(
                                                                                                            'image'
                                                                                                        )
                                                                                                    "
                                                                                                    :submodel-element-data="
                                                                                                        fileEl
                                                                                                    " />
                                                                                                <PDFPreview
                                                                                                    v-else-if="
                                                                                                        fileEl?.contentType?.includes(
                                                                                                            'pdf'
                                                                                                        )
                                                                                                    "
                                                                                                    :submodel-element-data="
                                                                                                        fileEl
                                                                                                    " />
                                                                                                <CADPreview
                                                                                                    v-else-if="
                                                                                                        fileEl?.contentType &&
                                                                                                        (fileEl.contentType.includes(
                                                                                                            'sla'
                                                                                                        ) ||
                                                                                                            fileEl.contentType.includes(
                                                                                                                'stl'
                                                                                                            ) ||
                                                                                                            fileEl.contentType.includes(
                                                                                                                'model'
                                                                                                            ) ||
                                                                                                            fileEl.contentType.includes(
                                                                                                                'obj'
                                                                                                            ) ||
                                                                                                            fileEl.contentType.includes(
                                                                                                                'gltf'
                                                                                                            ))
                                                                                                    "
                                                                                                    :submodel-element-data="
                                                                                                        fileEl
                                                                                                    " />
                                                                                                <v-alert
                                                                                                    v-else
                                                                                                    text="No preview available for this file type"
                                                                                                    density="compact"
                                                                                                    type="warning"
                                                                                                    variant="outlined"
                                                                                                    class="mt-3" />

                                                                                                <v-card-actions
                                                                                                    class="pt-4 pb-0 pr-0">
                                                                                                    <v-spacer />
                                                                                                    <v-btn
                                                                                                        size="small"
                                                                                                        color="primary"
                                                                                                        variant="elevated"
                                                                                                        prepend-icon="mdi-download"
                                                                                                        class="text-buttonText"
                                                                                                        @click="
                                                                                                            downloadFile(
                                                                                                                fileEl
                                                                                                            )
                                                                                                        ">
                                                                                                        Download Digital
                                                                                                        File
                                                                                                    </v-btn>
                                                                                                </v-card-actions>
                                                                                            </v-expansion-panel-text>
                                                                                        </v-expansion-panel>
                                                                                    </v-expansion-panels>
                                                                                </template>

                                                                                <v-alert
                                                                                    v-else
                                                                                    text="No available digital files"
                                                                                    density="compact"
                                                                                    type="warning"
                                                                                    variant="outlined" />
                                                                            </v-window-item>
                                                                        </v-window>
                                                                    </div>
                                                                </v-expansion-panel-text>
                                                            </div>
                                                        </v-expansion-panel-text>
                                                    </v-expansion-panel>
                                                </v-expansion-panels>
                                            </template>
                                        </div>
                                    </template>

                                    <v-alert
                                        v-else
                                        class="mt-3"
                                        density="compact"
                                        type="warning"
                                        variant="outlined"
                                        text="No Document Versions available" />
                                    <!-- <div class="mt-6 text-subtitle-2">Document Classifications (TODO)</div> -->
                                    <!-- <div class="mt-3 text-subtitle-2">Documented Entities (TODO)</div> -->
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>

                        <v-alert
                            v-else
                            class="mt-3"
                            density="compact"
                            type="info"
                            variant="outlined"
                            text="No Documents available" />
                    </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Entities container placeholder -->
                <v-expansion-panel>
                    <v-expansion-panel-title>
                        <v-list-item class="pa-0">
                            <template #prepend>
                                <v-icon size="small">mdi-folder-outline</v-icon>
                            </template>

                            <v-list-item-title> Entities </v-list-item-title>
                        </v-list-item>
                    </v-expansion-panel-title>

                    <v-expansion-panel-text class="pt-4">
                        <v-alert
                            class="mt-3"
                            density="compact"
                            type="info"
                            variant="outlined"
                            text="Entities visualization will be added later." />
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </template>
    </v-container>
</template>

<script lang="ts" setup>
    import { onMounted, ref } from 'vue';
    import { useReferableUtils } from '@/composables/AAS/ReferableUtils';
    import { useSMHandling } from '@/composables/AAS/SMHandling';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useSME } from '@/composables/AAS/SubmodelElements/SubmodelElement';
    import { getSubmodelElementBySemanticId, getSubmodelElementsBySemanticId } from '@/utils/AAS/SemanticIdUtils';
    // import { getLanguageName } from '@/utils/LocaleUtils';

    defineOptions({
        name: 'HandoverDocumentation',
        semanticId: '0173-1#01-AHF578#003',
    });
    // Composables
    const { setData } = useSMHandling();
    const { nameToDisplay } = useReferableUtils();
    const { hasValue, valueToDisplay } = useSME();
    const { downloadFile } = useSMEFile();

    // Properties
    const props = defineProps({
        submodelElementData: {
            type: Object as any,
            default: {} as any,
        },
    });

    // Data
    const rootPanel = ref<number | null>(0);
    const isLoading = ref(false);
    const handoverDocumentationData = ref({} as any);
    const panel = ref(null as number | null);
    const documents = ref([] as any);
    // const documentIds = ref([] as any);
    const documentsSml = ref<any>(null);
    // const tab = ref('one');
    type FileTab = 'preview' | 'digital';
    const versionFileTab = ref<Record<string, FileTab>>({});

    onMounted(() => {
        initializeVisualization();
    });

    async function initializeVisualization(): Promise<void> {
        isLoading.value = true;

        if (!props.submodelElementData || Object.keys(props.submodelElementData).length === 0) {
            handoverDocumentationData.value = {};
            isLoading.value = false;
            return;
        }

        handoverDocumentationData.value = await setData(
            { ...props.submodelElementData },
            props.submodelElementData.path
        );

        //  Get Documents SML (container)
        documentsSml.value = getSubmodelElementBySemanticId('0173-1#02-ABI500#003', handoverDocumentationData.value);
        console.log('Extracted Documents SML:', documentsSml.value);
        // Safety check
        if (
            !documentsSml.value?.value ||
            !Array.isArray(documentsSml.value.value) ||
            documentsSml.value.value.length === 0
        ) {
            console.log('No Documents SML found');
            documents.value = [];
            isLoading.value = false;
            return;
        }
        //  Get Document SMC entries (many)
        const documentSmcs = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI500#003/0173-1#01-AHF579#003',
            documentsSml.value
        );
        documents.value = documentSmcs;
        console.log('Document SMC entries:', documents.value);

        //  For each Document → get DocumentIds
        documents.value.forEach((doc: any) => {
            //function for Document Versions
            extractDocumentVersionInfo(doc);

            //function for DocumentIds
            // 3a Get DocumentIds SML (container, one per document)
            const documentIdsSml = getSubmodelElementBySemanticId('0173-1#02-ABI501#003', doc);
            if (!documentIdsSml || !documentIdsSml.value) {
                doc.documentIds = [];
                return;
            }

            // 3b️ Get DocumentId SMC entries (many)
            const documentIdSmcs = getSubmodelElementsBySemanticId(
                '0173-1#02-ABI501#003/0173-1#01-AHF580#003',
                documentIdsSml
            );

            doc.documentIds = documentIdSmcs;
        });
        // console.log('Final Documents with DocumentIds:', documents.value);
        isLoading.value = false;
    }

    function getLangSets(idProperty: any): any[] {
        // return only entries that have text
        return (idProperty?.value ?? []).filter((ls: any) => ls?.text?.length > 0);
    }

    function getDocumentIds(document: any): any[] {
        return Array.isArray(document?.documentIds) ? document.documentIds : [];
    }

    function extractDocumentVersionInfo(doc: any): void {
        // Get Document Version Info SML (container, one per document)
        const documentVersionInfoSml = getSubmodelElementBySemanticId('0173-1#02-ABI503#003', doc);

        if (
            !documentVersionInfoSml ||
            !Array.isArray(documentVersionInfoSml.value) ||
            documentVersionInfoSml.value.length === 0
        ) {
            doc.documentVersionInfo = [];
            return;
        }
        // Get Document Version Info SMC entries (many)
        const documentVersionInfoSmcs = getSubmodelElementsBySemanticId(
            '0173-1#02-ABI503#003/0173-1#01-AHF582#003',
            documentVersionInfoSml
        ).filter((sme: any) => hasValue(sme));

        console.log('Document Version Info SMC entries:', documentVersionInfoSmcs);

        doc.documentVersionInfo = documentVersionInfoSmcs;
        return;
    }
    function versionKey(versionSmc: any): string {
        // use a stable key if available
        return versionSmc?.id ?? versionSmc?.path ?? versionSmc?.idShort ?? 'unknown';
    }

    function getFileTab(versionSmc: any): FileTab {
        const key = versionKey(versionSmc);
        return versionFileTab.value[key] ?? 'preview';
    }

    function setFileTab(versionSmc: any, tab: FileTab) {
        const key = versionKey(versionSmc);
        versionFileTab.value[key] = tab;
    }
    function getPreviewFile(versionSmc: any): any | null {
        const children = versionSmc?.value ?? [];
        return children.find((c: any) => c?.modelType === 'File' && c?.idShort === 'PreviewFile') ?? null;
    }

    function getDigitalFiles(versionSmc: any): any[] {
        const children = versionSmc?.value ?? [];
        const digitalFilesSml = children.find(
            (c: any) => c?.modelType === 'SubmodelElementList' && c?.idShort === 'DigitalFiles'
        );
        return Array.isArray(digitalFilesSml?.value) ? digitalFilesSml.value : [];
    }
    function hasAttachments(versionSmc: any): boolean {
        return !!getPreviewFile(versionSmc) || getDigitalFiles(versionSmc).length > 0;
    }
    function isAttachmentChild(child: any): boolean {
        return child?.idShort === 'PreviewFile' || child?.idShort === 'DigitalFiles';
    }
</script>
