<template>
    <v-tooltip :open-delay="600" location="right">
        <template #activator="{ props: tooltipProps }">
            <v-btn
                v-bind="tooltipProps"
                icon="mdi-help-circle"
                variant="plain"
                size="small"
                style="top: -10px"
                @click="openHelpLink">
            </v-btn>
        </template>
        <span style="white-space: pre-line">{{ tooltipContent }}</span>
    </v-tooltip>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import helpLinks from './help-links.json';

    interface Props {
        helpType: string;
    }

    const props = defineProps<Props>();

    // Help content for tooltips
    const additionalHelp: Record<string, string> = {
        aas: 'Standardized digital representation of an asset.',
        globalAssetId: 'Identifier of the asset, the Asset Administration Shell is representing.',
        specificAssetIds:
            'Additional domain-specific, typically proprietary identifier for the asset like serial number,\n' +
            'manufacturer part ID, customer part IDs, etc.',
        assetType:
            'In case AssetInformation/assetKind is not NotApplicable the AssetInformation/assetType is the asset ID\n' +
            'of the type asset of the asset under consideration as identified by AssetInformation/globalAssetId.',
        assetKind:
            'Enumeration for denoting whether an asset is a type asset or an instance asset or is a role\n' +
            'or whether this kind of classification is not applicable',
        defaultThumbnail: 'Thumbnail of the asset represented by the Asset Administration Shell;\nused as default.',
        submodel: 'Representation of an aspect of an asset.',
        identifier: 'Unique identifier\n(string with max 2048 and min 1 characters).',
        idShort: 'Short name of the element\n(string with max 128 and min 1 characters).',
        modellingKind: 'Enumeration for denoting whether an element\nis a template or an instance.',
        displayName: 'Display name;\ncan be provided in several languages.',
        description: 'Description or comments on the element.\nThe description can be provided in several languages.',
        category:
            'The category is a value that gives further meta information w.r.t. the class of the element.\n' +
            'It affects the expected existence of attributes and the applicability of constraints.',
        version: 'Version of the element.',
        revision: 'Revision of the element.',
        creator: 'The subject ID of the subject\nresponsible for making the element.',
        templateId: 'Identifier of the template that guided\nthe creation of the element.',
        semanticId:
            'Identifier of the semantic definition of the element called semantic ID\n' +
            'or also main semantic ID of the element.',
        dataType: 'External reference to the data specification\ntemplate used by the element.',
        'range-minmax':
            'The minimum and maximum values of the range.\nIf the min value is missing, the value is assumed to be negative infinite.',
        'property-value': 'The value of the property instance.',
        'mlp-value': 'The value of the property instance',
        'file-path': 'Path and name of the file (with file extension).\nThe path can be absolute or relative.',
        'file-contentType': 'Content type of the content of the file.',
        'blob-content': 'The value of the blob instance of a blob data element.',
        'blob-contentType':
            'Content type of the content of the blob.\nThe content type (MIME type) states which file extensions the file can have.',
        'sml-orderRelevant':
            'Defines whether order in list is relevant.\nIf orderRelevant = false, the list represents a set or a bag.',
        'sml-typeValueListElement': 'The submodel element type of the submodel elements contained in the list.',
        'sml-valueTypeListElement': 'The value type of the submodel element contained in the list.',
        entityType: 'Enumeration for denoting whether an entity is a self-managed entity or a co-managed entity.',
    };

    const helpLinksData = helpLinks as Record<string, string>;

    const DEFAULT_HELP_URL = 'https://example.com/help/default';

    const tooltipContent = computed((): string => {
        return additionalHelp[props.helpType] || helpLinksData[props.helpType] || 'No help available';
    });

    function openHelpLink(): void {
        const url = helpLinksData[props.helpType] || DEFAULT_HELP_URL;
        window.open(url, '_blank');
    }
</script>
