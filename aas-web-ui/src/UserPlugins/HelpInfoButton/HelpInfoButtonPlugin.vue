<template>
    <v-tooltip location="right">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          color="gray"
          variant="tonal"          
          size="40px"
          density="compact"

          style="top: -10px; right: 0;"

          @click="openHelpLink"
        >
          <v-icon>mdi-help-circle</v-icon>
        </v-btn>
      </template>
      <span>{{ tooltipContent }}</span>
    </v-tooltip>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import helpLinks from '@/UserPlugins/HelpInfoButton/help-links.json'; // Adjust path as needed
  
  export default defineComponent({
    name: 'HelpInfoButtonPlugin',
    props: {
      helpType: {
        type: String,
        required: true,
      },
    },
    data() {
      // Fresh data object for each instance
      return {
        helpLinksData: helpLinks as Record<string, string>,
        additionalHelp: {
          'general': 'General information about AAS creation and editing.',
          'settings': 'Configure asset kind and related settings.',
          'external-files': 'Add external files related to the asset.',
          'parseKblVec': 'Upload KBL/VEC files for parsing technical data.',
          'submodel-files': 'Upload submodel files (.aasx, .xml, .json) to associate with this AAS.',

          'aas-General': 'Asset Administration Shell Information - Available Documentation.',

          'sub-General': 'Submodel Information - Available Documentation.',
          'sub-ID': 'Unique identifier for the submodel.',
          'sub-IdShort': 'Short, human-readable identifier for the submodel.',
          'sub-instance': 'Instance-specific information of the submodel.',
          'sub-displayname': 'Human-readable name for the submodel.',
          'sub-description': 'Detailed description of the submodel and its purpose.',
          'sub-category': 'Classification category of the submodel.',
          'sub-version': 'Version number of the submodel.',
          'sub-revision': 'Revision number indicating updates to the submodel.',
          'sub-creator': 'Entity or individual responsible for creating the submodel.',
          'sub-templateId': 'Template identifier used to standardize submodels.',
          'sub-semanticId': 'Reference to the semantic definition of the submodel.',
          'sub-DataType': 'Represent different types of information, from text to dates and times.',
        } as Record<string, string>,
      };
    },
    computed: {
      tooltipContent(): string {
        return this.getTooltipContent(this.helpType);
      },
    },
    methods: {
      openHelpLink() {
        const url = this.helpLinksData[this.helpType] || this.helpLinksData['default'] || 'https://example.com/help/default';
        window.open(url, '_blank');
      },
      getTooltipContent(helpType: string): string {
        return this.additionalHelp[helpType] || 
               this.helpLinksData[helpType] || 
               'No help available';
      },
    },
    mounted() {
      // Debug to confirm each instance mounts
      console.log(`HelpInfoButtonPlugin mounted with helpType: ${this.helpType}`);
    },
  });
  </script>