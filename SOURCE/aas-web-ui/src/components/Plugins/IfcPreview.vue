<template>
    <v-container fluid class="pa-0">
        <v-card title="3D Viewer" class="mb-4">
            <v-divider></v-divider>
            <v-card-text>
                <div id="ifcContainer" style="min-height: 400px; width: 100%" class="border rounded"></div>
            </v-card-text>
        </v-card>
        <v-card>
            <v-card-title class="d-flex align-center">
                <span>Element Properties</span>
            </v-card-title>
            <v-divider></v-divider>
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
                <div id="properties-container" ref="propertiesTableContainer" class="properties-table-container"></div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import * as OBC from '@thatopen/components';
    import * as OBCF from '@thatopen/components-front';
    import * as BUI from '@thatopen/ui';
    import * as BUIC from '@thatopen/ui-obc';
    import * as THREE from 'three';
    import { nextTick, onMounted, onUnmounted, ref } from 'vue';
    import { useSMRepositoryClient } from '@/composables/Client/SMRepositoryClient';

    const props = defineProps({
        submodelElementData: {
            type: Object as () => Record<string, unknown>,
            default: () => ({}),
        },
    });

    const { fetchAttachmentFile } = useSMRepositoryClient();

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
    let world: OBC.World | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let propertiesTable: any = null;
    let updatePropertiesTable: any | null = null;
    let highlighter: any = null;

    onMounted(async () => {
        try {
            BUI.Manager.init();

            // Initialize the BUIC manager for view cube support
            if (BUIC.Manager && BUIC.Manager.init) {
                BUIC.Manager.init();
                // console.log('BUIC Manager initialized');
            } else {
                console.warn('No BUIC Manager found - view cube may not work properly');
            }

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

            world = worlds.create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();

            world.scene = new OBC.SimpleScene(components);
            (world.scene as any).setup();
            (world.scene.three as THREE.Scene).background = null;

            world.renderer = new OBC.SimpleRenderer(components, ifcContainer.value!);
            world.camera = new OBC.OrthoPerspectiveCamera(components);

            components.init();

            // Create grid using official pattern
            try {
                const grids = components.get(OBC.Grids);
                grids.create(world);
                // console.log('Grid created successfully');
            } catch (gridError) {
                console.warn('Grid setup error (non-critical):', gridError);
            }

            // Set up IFC loader with proper WASM configuration
            const ifcLoader = components.get(OBC.IfcLoader);
            await ifcLoader.setup({
                autoSetWasm: false,
                wasm: {
                    path: './wasm/',
                    absolute: true,
                },
            });

            // Use the local worker file bundled with the app
            const fragments = components.get(OBC.FragmentsManager);
            await fragments.init('./worker.mjs');

            if (world.camera.controls) {
                world.camera.controls.addEventListener('rest', () => fragments.core.update(true));
            }

            // Ensures that once the Fragments model is loaded
            // (converted from the IFC in this case),
            // it utilizes the world camera for updates
            // and is added to the scene.
            fragments.list.onItemSet.add(({ value: model }) => {
                if (world && world.camera) {
                    model.useCamera(world.camera.three as THREE.PerspectiveCamera | THREE.OrthographicCamera);
                    world.scene.three.add(model.object);
                    fragments.core.update(true);
                }
            });

            setupCamera();
            setupRenderer();
            setupLighting();
            setupResizeHandler();

            await loadIfcModel();

            // Set up highlighter after loading model
            setupHighlighter();

            // Add view cube for better navigation after everything is set up
            setupViewCube();

            // Set a closer, better initial view with proper null checks
            if (world && world.camera && world.camera.controls) {
                await world.camera.controls.setLookAt(25, 15, 25, 0, 8, 0);

                // Make camera controls smoother
                world.camera.controls.smoothTime = 0.1;
            }

            isLoading.value = false;
        } catch (error) {
            handleError('Error setting up the viewer', error);
        }
    }

    function setupCamera(): void {
        if (!world || !ifcContainer.value) return;

        const container = ifcContainer.value;
        const aspect = container.clientWidth / container.clientHeight;

        // The OrthoPerspectiveCamera handles perspective/orthographic switching automatically
        // We just need to ensure it knows about the aspect ratio
        if (world.camera && world.camera.three) {
            const camera = world.camera.three as THREE.PerspectiveCamera;
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
        }
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

    function setupViewCube(): void {
        if (!world || !world.camera || !ifcContainer.value) return;

        try {
            // Create view cube element following the official documentation
            const viewCube = document.createElement('bim-view-cube') as any;

            // Check if the element was created successfully
            if (!viewCube) {
                console.error('Failed to create bim-view-cube element');
                return;
            }

            viewCube.camera = world.camera.three;

            // console.log('View cube element created and styled');

            // Add the view cube to the IFC container
            ifcContainer.value.appendChild(viewCube);

            // console.log('View cube added to container');

            // Update view cube orientation when camera moves
            if (world.camera.controls) {
                world.camera.controls.addEventListener('update', () => {
                    if (viewCube && viewCube.updateOrientation) {
                        viewCube.updateOrientation();
                    }
                });
            }

            // Add preset view event listeners following the documentation pattern
            viewCube.addEventListener('leftclick', () => {
                if (world && world.camera && world.camera.controls) {
                    world.camera.controls.setLookAt(-25, 15, 0, 0, 8, 0, true);
                }
            });

            viewCube.addEventListener('rightclick', () => {
                if (world && world.camera && world.camera.controls) {
                    world.camera.controls.setLookAt(25, 15, 0, 0, 8, 0, true);
                }
            });

            viewCube.addEventListener('frontclick', () => {
                if (world && world.camera && world.camera.controls) {
                    world.camera.controls.setLookAt(0, 15, 25, 0, 8, 0, true);
                }
            });

            viewCube.addEventListener('backclick', () => {
                if (world && world.camera && world.camera.controls) {
                    world.camera.controls.setLookAt(0, 15, -25, 0, 8, 0, true);
                }
            });

            viewCube.addEventListener('topclick', () => {
                if (world && world.camera && world.camera.controls) {
                    world.camera.controls.setLookAt(0, 50, 0, 0, 0, 0, true);
                }
            });

            viewCube.addEventListener('bottomclick', () => {
                if (world && world.camera && world.camera.controls) {
                    world.camera.controls.setLookAt(0, -50, 0, 0, 0, 0, true);
                }
            });

            // console.log('View cube created successfully');
        } catch (error) {
            console.warn('View cube setup error (non-critical):', error);
        }
    }

    async function loadIfcModel() {
        if (!world || !components) return;

        // console.log('Starting IFC model loading...');

        try {
            const fileBlob = await fetchAttachmentFile(props.submodelElementData.path as string);
            if (!fileBlob) {
                throw new Error('Failed to fetch IFC file');
            }

            const data = await fileBlob.arrayBuffer();
            const buffer = new Uint8Array(data);

            // console.log(`IFC file size: ${buffer.length} bytes`);

            // Get the IFC loader (should already be set up from initViewer)
            const ifcLoader = components.get(OBC.IfcLoader);

            // Load the IFC file using the official pattern
            // console.log('Loading IFC using ifcLoader.load...');
            await ifcLoader.load(buffer, false, props.submodelElementData.idShort as string, {
                processData: {
                    progressCallback: (progress: number) => console.warn('Loading progress:', progress),
                },
            });

            console.warn('IFC model loaded successfully');

            // Update the camera to better frame the model
            if (world.camera && world.camera.controls) {
                // Get bounding box of the loaded model to position camera properly
                const box = new THREE.Box3();
                world.scene.three.traverse((child: any) => {
                    if (child.isMesh) {
                        box.expandByObject(child);
                    }
                });

                if (!box.isEmpty()) {
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const distance = maxDim * 1.5;

                    await world.camera.controls.setLookAt(
                        center.x + distance,
                        center.y + distance * 0.5,
                        center.z + distance,
                        center.x,
                        center.y,
                        center.z
                    );

                    // console.log('Camera positioned to show model');
                }
            }

            return { success: true, name: props.submodelElementData.idShort as string };
        } catch (error: any) {
            console.error('Error in loadIfcModel:', error);

            // Fallback: Create a simple placeholder if IFC loading fails
            console.warn('IFC loading failed!');
        }
    }

    function setupHighlighter(): void {
        if (!world || !components) return;

        try {
            // Set up the highlighter for element selection
            highlighter = components.get(OBCF.Highlighter as any);
            highlighter.setup({ world });

            // When an element is highlighted (selected) - using official pattern
            highlighter.events.select.onHighlight.add((modelIdMap: any) => {
                // Get the first key from the modelIdMap to display
                const modelIds = Object.keys(modelIdMap);
                if (modelIds.length > 0) {
                    selectedElementInfo.value = `Element ID: ${modelIds[0]}`;
                } else {
                    selectedElementInfo.value = null;
                }

                // Store the current selection for later use
                const currentSelection = { ...modelIdMap };

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
                                updatePropertiesTable({ modelIdMap: currentSelection });
                            }
                        });
                    });
                } else {
                    // Panel is already visible, just update the table
                    if (updatePropertiesTable) {
                        updatePropertiesTable({ modelIdMap });
                    }
                }
            });

            // When selection is cleared
            highlighter.events.select.onClear.add(() => {
                selectedElementInfo.value = null;
                if (updatePropertiesTable) {
                    updatePropertiesTable({ modelIdMap: {} });
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

            // Create the properties table component using official pattern
            try {
                // Use the official BUIC.tables.itemsData pattern
                if (BUIC.tables && BUIC.tables.itemsData) {
                    // console.log('Using BUIC itemsData table (official pattern)');
                    [propertiesTable, updatePropertiesTable] = BUIC.tables.itemsData({
                        components,
                        modelIdMap: {},
                    });
                } else {
                    // console.log('BUIC itemsData table not available, creating fallback');

                    // Create a working properties display
                    propertiesTable = document.createElement('div');
                    propertiesTable.className = 'properties-table';
                    propertiesTable.innerHTML = '<p class="no-selection">Select an element to view its properties</p>';

                    // Update function compatible with both modelIdMap and fragmentIdMap
                    updatePropertiesTable = (data: any) => {
                        if (!propertiesTable) return;

                        const idMap = data.modelIdMap || data.fragmentIdMap || {};
                        const ids = Object.keys(idMap);

                        if (ids.length === 0) {
                            propertiesTable.innerHTML = '<p class="no-selection">No element selected</p>';
                            return;
                        }

                        let html = `<div class="element-properties">`;
                        html += `<h4>Selected Element</h4>`;
                        html += `<div class="property-list">`;

                        for (const [id, indices] of Object.entries(idMap)) {
                            html += `<div class="property-item">`;
                            html += `<span class="property-key">ID:</span> `;
                            html += `<span class="property-value">${id}</span>`;
                            html += `</div>`;

                            if (Array.isArray(indices) && indices.length > 0) {
                                html += `<div class="property-item">`;
                                html += `<span class="property-key">Elements:</span> `;
                                html += `<span class="property-value">[${indices.join(', ')}]</span>`;
                                html += `</div>`;
                            }
                        }

                        html += `</div></div>`;
                        propertiesTable.innerHTML = html;
                    };
                }

                // console.log('Properties table setup completed');
            } catch (error) {
                console.error('Error creating properties table:', error);
                return;
            }

            if (propertiesTable) {
                // Configure properties table
                propertiesTable.preserveStructureOnFilter = true;
                propertiesTable.indentationInText = false;

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

    function handleError(message: string, error: any): void {
        console.error(message, error);
        errorMessage.value = `${message}: ${error.message || 'Unknown error'}`;
        showError.value = true;
        isLoading.value = false;
    }

    function toggleExpansion(): void {
        if (propertiesTable) {
            propertiesTable.expanded = !propertiesTable.expanded;
            propertiesExpanded.value = propertiesTable.expanded;
        }
    }

    function filterProperties(): void {
        if (propertiesTable && propertySearchQuery.value !== undefined) {
            propertiesTable.queryString = propertySearchQuery.value !== '' ? propertySearchQuery.value : null;
        }
    }

    async function copyAsTSV(): Promise<void> {
        if (propertiesTable) {
            await navigator.clipboard.writeText(propertiesTable.tsv);
        }
    }
</script>
