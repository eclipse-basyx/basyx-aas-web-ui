<template>
    <v-container fluid class="pa-0">
        <!-- Header -->
        <v-card class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">
                    {{ visualizationTitle }}
                </div>
            </v-card-title>
            <v-card-text v-if="descriptionToDisplay(submodelElementData)" class="pt-0">
                {{ descriptionToDisplay(submodelElementData) }}
            </v-card-text>
        </v-card>
        <!-- BoM Graph -->
        <v-card>
            <v-card-text id="BoMCard">
                <!-- Archetype -->
                <v-list-item class="px-2 pb-3">
                    <v-list-item-title>
                        <span class="text-subtitle-2 mr-2">{{ 'Archetype: ' }}</span>
                        <v-chip label size="x-small" border color="primary" style="margin-top: -3px">{{
                            archetype
                        }}</v-chip>
                    </v-list-item-title>
                </v-list-item>
                <div id="BoMDiagram" style="position: relative; max-width: 100%"></div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import mermaid from 'mermaid';
    import { defineComponent } from 'vue';
    import { useRouter } from 'vue-router';
    import { useTheme } from 'vuetify';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';

    declare global {
        interface Window {
            callback: any;
        }
    }

    export default defineComponent({
        name: 'BillsOfMaterial',
        mixins: [RequestHandling, SubmodelElementHandling],
        props: ['submodelElementData'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();
            const router = useRouter();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
                router, // Router Object
            };
        },

        data() {
            return {
                archetype: '', // Archetype of the BoM
                customDefaultThemeColors: {
                    nodeBorder: '#000', // change the color of the node borders
                    lineColor: '#000', // change the color of the arrow lines
                    mainBkg: '#fff', // change the background color of the nodes
                },
                customDarkThemeColors: {
                    nodeBorder: '#fff', // change the color of the node borders
                    lineColor: '#fff', // change the color of the arrow lines
                    mainBkg: '#000', // change the background color of the nodes
                },
            };
        },

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },

            // returns the primary color of the current theme
            primaryColor() {
                if (this.isDark) {
                    return this.$vuetify.theme.themes.dark.colors.primary;
                } else {
                    return this.$vuetify.theme.themes.light.colors.primary;
                }
            },

            visualizationTitle() {
                const visualizationTitle = this.nameToDisplay(this.submodelElementData);
                if ([this.submodelElementData.idShort, ''].includes(visualizationTitle)) return 'Bills of Material';
                return visualizationTitle;
            },
        },

        watch: {
            // watch for changes in the vuetify theme and update the chart options
            isDark() {
                this.applyTheme();
            },
        },

        mounted() {
            window.callback = this.callback; // set the callback function
            this.initializeBoM(); // initialize BoM Plugin
        },

        beforeUnmount() {
            window.callback = null; // remove the callback function
        },

        methods: {
            initializeBoM() {
                // console.log('Initialize BoM Plugin:', this.submodelElementData);
                // apply the primary color to the mermaid settings
                this.customDefaultThemeColors.nodeBorder = this.primaryColor;
                this.customDefaultThemeColors.mainBkg = this.primaryColor + '0A';
                this.customDarkThemeColors.nodeBorder = this.primaryColor;
                this.customDarkThemeColors.mainBkg = this.primaryColor + '0A';
                // get the archetype of the BoM
                this.archetype = this.getArchetype();
                // initialize mermaid
                mermaid.initialize({
                    startOnLoad: false,
                    theme: this.isDark ? 'dark' : 'default',
                    themeVariables: this.isDark ? this.customDarkThemeColors : this.customDefaultThemeColors,
                    securityLevel: 'loose',
                });
                // render mermaid graph
                this.drawDiagram();
            },

            async drawDiagram() {
                try {
                    let element = document.querySelector('#BoMDiagram');
                    // create the graphDefinition
                    const graphDefinition = this.createGraphDefinition();
                    const { svg, bindFunctions } = await mermaid.render('BoMDiagram', graphDefinition);
                    if (element) {
                        element.innerHTML = svg;
                        let foreignObjects = element.querySelectorAll('foreignObject');
                        foreignObjects.forEach((foreignObject) => {
                            let div = foreignObject.querySelector('div');
                            if (div) {
                                // Calculate the required width based on content
                                let textLength = div.textContent?.length;
                                let baseWidth = Math.max(150, (textLength ?? 0) * 8); // Base width estimation
                                let contentWidth = div.scrollWidth; // Actual content width

                                // Choose the larger of the two widths and add a buffer
                                let newWidth = Math.max(baseWidth, contentWidth) + 20; // Add a 20px buffer

                                foreignObject.setAttribute('width', newWidth.toString());
                                div.style.maxWidth = `${newWidth}px`; // Set the same max-width for div
                            }
                        });
                        // add the element to the card
                        let card = document.querySelector('#BoMCard');
                        if (card) {
                            card.appendChild(element);
                        }
                        // bind the functions to the graph
                        bindFunctions?.(element);
                    }
                } catch (error) {
                    console.error('Error rendering Mermaid diagram:', error);
                }
            },

            callback(assetId: string) {
                // console.log('AssetId:', assetId);
                this.checkAssetId(assetId)
                    .then(({ success, aas }: { success: boolean; aas?: any }) => {
                        if (success) {
                            // console.log('AAS:', aas);
                            this.jumpToReferencedElement(aas, []);
                        } else {
                            this.navigationStore.dispatchSnackbar({
                                status: true,
                                timeout: 10000,
                                color: 'error',
                                btnColor: 'buttonText',
                                text: 'Could not find matching AAS in the AAS Discovery Service',
                            });
                        }
                    })
                    .catch(() => {
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 10000,
                            color: 'error',
                            btnColor: 'buttonText',
                            text: 'An error occured while trying to find linked AAS!',
                        });
                    });
            },

            createGraphDefinition(): string {
                let graphDefinition = 'graph LR\n';
                let callBacks = '';
                let entryNode = this.submodelElementData.submodelElements.find((element: any) => {
                    return (
                        element.semanticId.keys[0].value ===
                        'https://admin-shell.io/idta/HierarchicalStructures/EntryNode/1/0'
                    );
                });
                if (!entryNode) return graphDefinition;
                // console.log('Entry Node:', entryNode);

                if (!entryNode.statements) return graphDefinition;
                const hasChildren = entryNode.statements.some((element: any) => {
                    return element.modelType === 'Entity';
                });
                if (!hasChildren) return graphDefinition;

                [graphDefinition, callBacks] = this.addChildrenToGraph(entryNode, graphDefinition, callBacks); // Update the graphDefinition
                graphDefinition += callBacks; // add the callbacks to the graphDefinition

                // console.log('Graph Definition:\n', graphDefinition);
                return graphDefinition;
            },

            addChildrenToGraph(parentNode: any, graphDefinition: string, callBacks: string): [string, string] {
                // get all children of the parentNode
                let children = parentNode.statements.filter((element: any) => {
                    return element.modelType === 'Entity';
                });
                // console.log('Children:', children);
                // get all RelationShipElements of the parentNode
                let relationships = parentNode.statements.filter((element: any) => {
                    return element.modelType === 'RelationshipElement';
                });
                // extract the semanticId of the relationships (result should be relationships = [semanticId1, semanticId2, ...])
                relationships = relationships.map((element: any) => {
                    return element.semanticId.keys[0].value;
                });
                // console.log('Relationships:', relationships);
                // check if all relationships are the same
                const allEqual = relationships.every((element: any) => {
                    return element === relationships[0];
                });
                if (!allEqual)
                    this.navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 10000,
                        color: 'warning',
                        btnColor: 'buttonText',
                        text: 'Only one type of relationship is allowed!',
                    });
                // extract the first relationship
                let relationship = relationships[0];
                // translate the relationship semanticId to a readable string
                if (relationship === 'https://admin-shell.io/idta/HierarchicalStructures/HasPart/1/0') {
                    relationship = 'HasPart';
                } else if (relationship === 'https://admin-shell.io/idta/HierarchicalStructures/IsPartOf/1/0') {
                    relationship = 'IsPartOf';
                } else if (relationship === 'https://admin-shell.io/idta/HierarchicalStructures/SameAs/1/0') {
                    relationship = 'SameAs';
                } else {
                    relationship = '';
                }

                children.forEach((child: any) => {
                    graphDefinition +=
                        parentNode.idShort +
                        '(' +
                        parentNode.idShort +
                        ') -->|' +
                        relationship +
                        '| ' +
                        child.idShort +
                        '(' +
                        child.idShort +
                        ')\n'; // add the relationship to the graphDefinition
                    callBacks += 'click ' + child.idShort + ' call callback(' + child.globalAssetId + ')\n'; // add the callback to the callBacks
                    if (child.statements) {
                        const hasChildren = child.statements.some((element: any) => {
                            return element.modelType === 'Entity';
                        });
                        if (hasChildren) {
                            [graphDefinition, callBacks] = this.addChildrenToGraph(child, graphDefinition, callBacks); // Update graphDefinition with returned value
                        }
                    }
                });

                return [graphDefinition, callBacks]; // Return the updated string
            },

            getArchetype(): string {
                // find a submodelElement in the this.submodelElementData.submodelElements array whichs semanticId is equal to "https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0"
                let archetypeElement = this.submodelElementData.submodelElements.find((element: any) => {
                    return (
                        element.semanticId.keys[0].value ===
                        'https://admin-shell.io/idta/HierarchicalStructures/ArcheType/1/0'
                    );
                });
                // console.log('Archetype Element:', archetypeElement);
                if (archetypeElement) {
                    return archetypeElement.value;
                }
                return 'no archetype found';
            },

            // apply the theme to the mermaid graph
            applyTheme() {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: this.isDark ? 'dark' : 'default',
                    themeVariables: this.isDark ? this.customDarkThemeColors : this.customDefaultThemeColors,
                });
                this.drawDiagram();
            },
        },
    });
</script>
