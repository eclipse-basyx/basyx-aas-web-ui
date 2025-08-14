<template>
    <v-row>
        <v-col cols="12">
            <v-card title="3D Viewer">
                <v-divider></v-divider>
                <v-card-text>
                    <div id="ifcContainer" style="min-height: 400px; width: 100%"></div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
    <v-row>
        <v-col cols="12">
            <v-card>
                <v-card-title class="d-flex align-center">
                    <span>Element Properties</span>
                    <v-spacer></v-spacer>
                    <v-btn icon @click="toggleProperties">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <v-alert v-if="selectedElementInfo" color="info" class="mb-4" density="compact">
                        Selected: {{ selectedElementInfo }}
                    </v-alert>
                    <v-text-field
                        v-model="propertySearchQuery"
                        label="Search Properties"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="mb-4"
                        @input="filterProperties"></v-text-field>
                    <v-btn class="mb-4 me-2" size="small" color="primary" variant="outlined" @click="toggleExpansion">
                        {{ propertiesExpanded ? 'Collapse' : 'Expand' }}
                    </v-btn>
                    <v-btn class="mb-4" size="small" color="primary" variant="outlined" @click="copyAsTSV">
                        Copy as TSV
                    </v-btn>
                    <div
                        id="properties-container"
                        ref="propertiesTableContainer"
                        class="properties-table-container"></div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
    import * as OBC from '@thatopen/components';
    import * as OBCF from '@thatopen/components-front';
    import * as BUI from '@thatopen/ui';
    import * as THREE from 'three';
    import { nextTick, onMounted, onUnmounted, ref } from 'vue';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';

    const ifcContainer = ref<HTMLDivElement | null>(null);
    const propertiesTableContainer = ref<HTMLDivElement | null>(null);
    const isLoading = ref(true);
    const showError = ref(false);
    const errorMessage = ref('');
    const showProperties = ref(false);
    const propertySearchQuery = ref('');
    const propertiesExpanded = ref(false);
    const selectedElementInfo = ref<string | null>(null);
    const propertiesTableInitialized = ref(false);

    // Store references to clean up later
    let components: OBC.Components | null = null;
    let world: OBC.SimpleWorld | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let propertiesTable: HTMLElement | null = null;
    let updatePropertiesTable: ((data: { fragmentIdMap: Record<string, Set<number>> }) => void) | null = null;
    let highlighter: OBCF.Highlighter | null = null;

    const { fetchAttachmentFile } = useSMRepositoryClient();

    const props = defineProps({
        submodelElementData: {
            type: Object as () => Record<string, unknown>,
            default: () => ({}),
        },
    });

    onMounted(async () => {
        try {
            BUI.Manager.init();
            if (!ifcContainer.value) {
                ifcContainer.value = document.getElementById('ifcContainer') as HTMLDivElement;
            }
            if (ifcContainer.value) {
                await initViewer();
            }
        } catch (error) {
            handleError('Failed to initialize viewer', error);
        }
    });

    onUnmounted(() => {
        // Clean up resources
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        if (components) {
            components.dispose();
        }
    });

    async function initViewer(): Promise<void> {
        isLoading.value = true;
        try {
            components = new OBC.Components();
            const worlds = components.get(OBC.Worlds);

            world = worlds.create<
                OBC.SimpleScene,
                OBC.SimpleCamera,
                OBC.SimpleRenderer
            >() as unknown as OBC.SimpleWorld<OBC.BaseScene, OBC.BaseCamera, OBC.BaseRenderer>;

            world.scene = new OBC.SimpleScene(components);
            world.renderer = new OBC.SimpleRenderer(components, ifcContainer.value!);
            world.camera = new OBC.SimpleCamera(components);

            components.init();

            setupCamera();
            setupRenderer();
            setupLighting();
            setupResizeHandler();

            await loadIfcModel();

            // Set up highlighter after loading model
            setupHighlighter();

            // Set a closer, better initial view with proper null checks
            if (world.camera && world.camera.controls) {
                world.camera.controls.setLookAt(2, 2, 2, 0, 0, 0);

                // Make camera controls smoother
                world.camera.controls.smoothTime = 0.1;
            }

            (world.scene as OBC.SimpleScene).setup();
            (world.scene.three as unknown as THREE.Scene).background = null;

            const grids = components.get(OBC.Grids);
            grids.create(world);

            isLoading.value = false;
        } catch (error) {
            handleError('Error setting up the viewer', error);
        }
    }

    function setupCamera(): void {
        if (!world || !ifcContainer.value) return;

        const container = ifcContainer.value;
        const aspect = container.clientWidth / container.clientHeight;
        const camera = world.camera.three as THREE.PerspectiveCamera;
        camera.aspect = aspect;
        camera.fov = 60;
        camera.updateProjectionMatrix();
    }

    function setupRenderer(): void {
        if (!world || !world.renderer) return;

        world.renderer.three.shadowMap.enabled = true;
        world.renderer.three.shadowMap.type = THREE.PCFSoftShadowMap;

        // Important for transparent objects
        world.renderer.three.sortObjects = true;
        world.renderer.three.setClearColor(0x222222, 1);

        // Optional: Enable alpha for better transparency
        world.renderer.three.autoClear = false;
    }

    function setupLighting(): void {
        if (!world) return;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        world.scene.three.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;

        // Improve shadow quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;

        world.scene.three.add(directionalLight);
    }

    function setupResizeHandler(): void {
        if (!world || !world.renderer || !ifcContainer.value) return;

        resizeObserver = new ResizeObserver(() => {
            if (!world || !world.renderer || !ifcContainer.value) return;

            const container = ifcContainer.value;
            const width = container.clientWidth;
            const height = container.clientHeight;

            // Update camera
            const camera = world.camera.three as THREE.PerspectiveCamera;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            // Update renderer
            world.renderer.three.setSize(width, height);
        });

        resizeObserver.observe(ifcContainer.value);
    }

    async function loadIfcModel(): Promise<unknown> {
        if (!world || !components) return;

        try {
            const fragmentIfcLoader = components.get(OBC.IfcLoader);

            await fragmentIfcLoader.setup();
            fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

            const fileBlob = await fetchAttachmentFile(props.submodelElementData.path as string);
            if (!fileBlob) {
                throw new Error('Failed to fetch IFC file');
            }
            
            const data = await fileBlob.arrayBuffer();
            const buffer = new Uint8Array(data);
            // Try loading with different parameter combinations based on the API
            let model;
            try {
                model = await fragmentIfcLoader.load(buffer, false, 'model.ifc');
            } catch {
                // Fallback to simpler API
                model = await fragmentIfcLoader.load(buffer, true, 'model.ifc');
            }
            
            // The model is automatically added to the fragments manager
            // Apply transparency and color to all fragments
            const fragments = components.get(OBC.FragmentsManager);
            for (const fragment of fragments.list.values()) {
                // Access the Three.js mesh from the fragment
                const mesh = fragment as unknown as THREE.Mesh;
                if (mesh.isMesh) {
                    applyTransparencyAndColor(mesh);
                }
            }

            return model;
        } catch (error) {
            handleError('Failed to load IFC model', error);
            throw error;
        }
    }

    function applyTransparencyAndColor(model: THREE.Object3D): void {
        // Define the color and opacity you want
        const uniformColor = new THREE.Color(0x888888);
        const opacity = 0.6; // 60% opacity, adjust as needed
        // If the model is using the OBC fragment system
        if ('material' in model) {
            // Try to access fragment materials directly
            const fragmentModel = model as THREE.Object3D & { material?: THREE.Material };
            if (fragmentModel.material) {
                fragmentModel.material.transparent = true;
                fragmentModel.material.opacity = opacity;
                if ('color' in fragmentModel.material) {
                    (fragmentModel.material as THREE.Material & { color: THREE.Color }).color.copy(uniformColor);
                }
            }
        }
        // Also traverse the model normally for standard THREE.js objects
        model.traverse((node: THREE.Object3D) => {
            if (
                node instanceof THREE.Mesh ||
                (node as THREE.Mesh).isMesh === true || // Some libraries use this pattern
                ('material' in node && 'geometry' in node)
            ) {
                const meshNode = node as THREE.Mesh;
                // Handle both single material and material array cases
                if (Array.isArray(meshNode.material)) {
                    for (let i = 0; i < meshNode.material.length; i++) {
                        const newMat = createTransparentMaterial(meshNode.material[i], uniformColor, opacity);
                        meshNode.material[i] = newMat;
                    }
                } else if (meshNode.material) {
                    const newMat = createTransparentMaterial(meshNode.material, uniformColor, opacity);
                    meshNode.material = newMat;
                }
            }
        });
    }

    function createTransparentMaterial(
        originalMat: THREE.Material,
        color: THREE.Color,
        opacity: number
    ): THREE.MeshPhysicalMaterial {
        // If we're dealing with a basic material, create a new one
        const material = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.8,
            depthWrite: false, // Change to false to help with transparency sorting
            depthTest: true, // Keep depth testing enabled
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
        
        return material;
    }

    function setupHighlighter(): void {
        if (!world || !components) return;

        try {
            // Set up the highlighter for element selection
            highlighter = components.get(OBCF.Highlighter);
            highlighter.setup({ world });

            // When an element is highlighted (selected)
            highlighter.events.select.onHighlight.add((fragmentIdMap: Record<string, Set<number>>) => {
                // Get the first key from the fragmentIdMap to display
                const fragmentIds = Object.keys(fragmentIdMap);
                if (fragmentIds.length > 0) {
                    selectedElementInfo.value = `Element ID: ${fragmentIds[0]}`;
                } else {
                    selectedElementInfo.value = null;
                }

                // Store the current selection for later use
                const currentSelection = { ...fragmentIdMap };

                // Make sure properties panel is visible
                if (!showProperties.value) {
                    // First set the flag to show the panel
                    showProperties.value = true;

                    // Then use nextTick to ensure DOM is updated before working with it
                    nextTick(() => {
                        // Always reinitialize the properties table when opening after being closed
                        // This ensures a fresh state
                        setupPropertiesTable();

                        // Make sure to update the properties table after it's initialized
                        nextTick(() => {
                            if (updatePropertiesTable) {
                                // Use the stored selection to update the table
                                updatePropertiesTable({ fragmentIdMap: currentSelection });
                            }
                        });
                    });
                } else {
                    // Panel is already visible, just update the table
                    if (updatePropertiesTable) {
                        updatePropertiesTable({ fragmentIdMap });
                    }
                }
            });

            // When selection is cleared
            highlighter.events.select.onClear.add(() => {
                selectedElementInfo.value = null;
                if (updatePropertiesTable) {
                    updatePropertiesTable({ fragmentIdMap: {} });
                }
            });
        } catch (error) {
            console.error('Error setting up highlighter:', error);
        }
    }

    function setupPropertiesTable(): void {
        // Ensure the container is available by checking both the ref and the DOM
        if (!propertiesTableContainer.value) {
            propertiesTableContainer.value = document.getElementById('properties-container') as HTMLDivElement;
        }

        // Verify we have both the components instance and the container
        if (!components) {
            console.error('Cannot set up properties table - missing components');
            return;
        }

        if (!propertiesTableContainer.value) {
            console.error('Cannot set up properties table - missing container');
            return;
        }

        try {
            // Clean up existing properties table if it exists
            if (propertiesTable) {
                try {
                    // Remove it from the DOM if possible
                    if (propertiesTable.parentNode) {
                        propertiesTable.parentNode.removeChild(propertiesTable);
                    }
                } catch (e) {
                    console.warn('Failed to clean up previous properties table:', e);
                }
                // Clear the references
                propertiesTable = null;
                updatePropertiesTable = null;
            }
            // Create the properties table component
            // Note: API may have changed, commenting out for now
            // [propertiesTable, updatePropertiesTable] = BUIC.tables.elementProperties({
            //     components,
            //     fragmentIdMap: {},
            // });
            
            // Create a simple properties display for now
            const propertiesDiv = document.createElement('div');
            propertiesDiv.innerHTML = '<p>Properties will be displayed here when an element is selected.</p>';
            propertiesTable = propertiesDiv;
            
            updatePropertiesTable = (data: { fragmentIdMap: Record<string, Set<number>> }) => {
                if (propertiesDiv && Object.keys(data.fragmentIdMap).length > 0) {
                    propertiesDiv.innerHTML =
                        '<p>Selected fragments: ' + JSON.stringify(Object.keys(data.fragmentIdMap)) + '</p>';
                } else if (propertiesDiv) {
                    propertiesDiv.innerHTML = '<p>No element selected.</p>';
                }
            };
            
            if (propertiesTable) {
                // Clear the container and append the table
                propertiesTableContainer.value.innerHTML = '';
                propertiesTableContainer.value.appendChild(propertiesTable);
                // Set the initialization flag
                propertiesTableInitialized.value = true;
            } else {
                console.error('Failed to create properties table');
            }
        } catch (error) {
            console.error('Error setting up properties table:', error);
        }
    }

    function handleError(message: string, error: Error | unknown): void {
        console.error(message, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errorMessage.value = `${message}: ${errorMsg}`;
        showError.value = true;
        isLoading.value = false;
    }

    function toggleProperties(): void {
        showProperties.value = !showProperties.value;
    }

    function filterProperties(): void {
        // Implement property filtering logic here
        // Filter based on propertySearchQuery.value
    }

    function toggleExpansion(): void {
        propertiesExpanded.value = !propertiesExpanded.value;
        // Implement expansion/collapse logic here
    }

    function copyAsTSV(): void {
        // Implement TSV copy functionality here
        // Copy properties data to clipboard in TSV format
    }
</script>
