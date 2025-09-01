<template>
    <v-container fluid class="pa-0">
        <v-card id="viewerCard">
            <!-- CAD File Preview -->
            <div ref="viewerContainer" class="viewer"></div>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
    import { ViewHelper } from 'three/examples/jsm/helpers/ViewHelper.js';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
    import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
    import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useSMEFile } from '@/composables/AAS/SubmodelElements/File';
    import { useAuthStore } from '@/store/AuthStore';

    // Props
    const props = defineProps<{
        submodelElementData: any;
    }>();

    // Template refs
    const viewerContainer = ref<HTMLElement>();

    // Composables and stores
    const authStore = useAuthStore();
    const { valueUrl } = useSMEFile();

    // Reactive data
    const localPathValue = ref('');

    // Computed properties
    const authToken = computed(() => authStore.getToken);

    // Watchers
    watch(
        () => props.submodelElementData,
        () => {
            if (props.submodelElementData.modelType == 'File') {
                localPathValue.value = valueUrl(props.submodelElementData).url;
            }
        }
    );

    onMounted(() => {
        if (props.submodelElementData.modelType == 'File') {
            localPathValue.value = valueUrl(props.submodelElementData).url;
            initThree();
        }
    });

    // Methods
    function initThree(): void {
        // create a new Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x343434);

        // get the container element
        const container = viewerContainer.value as HTMLElement;

        // create a new Three.js camera
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 5);

        // create a new Three.js renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Get the v-card element
        const vCard = document.getElementById('viewerCard') as HTMLElement;

        // Add a resize observer to the v-card
        new ResizeObserver(() => {
            // Update the size of the renderer
            renderer.setSize(vCard.clientWidth, vCard.clientHeight);

            // Update the aspect ratio of the camera
            camera.aspect = vCard.clientWidth / vCard.clientHeight;
            camera.updateProjectionMatrix();
        }).observe(vCard);

        // create a new Three.js OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // clock
        const clock = new THREE.Clock();

        // check the mime type of the file
        let contentType = props.submodelElementData.contentType;
        // check if the file is a STL file
        if (
            contentType == 'application/sla' ||
            contentType == 'application/vnd.ms-pki.stl' ||
            contentType == 'application/stl' ||
            contentType == 'model/stl' ||
            contentType == 'text/stl' ||
            contentType == 'text/x-stl' ||
            contentType == 'text/x-sla'
        ) {
            importSTL(scene);
            // check if the file is an obj file
        } else if (contentType == 'application/obj') {
            importOBJ(scene);
            // check if the file is a gltf file
        } else if (contentType == 'model/gltf+json') {
            importGLTF(scene);
        } else {
            // console.log('Unsupported File Type');
            return;
        }

        // add a view cube with three.js view helper
        const viewHelper = new ViewHelper(camera, renderer.domElement);
        // add orbiatlcontrols to the view helper
        viewHelper.center = controls.target;

        const div = document.createElement('div');
        div.id = 'viewHelper';
        div.style.position = 'absolute';
        div.style.right = String(0);
        div.style.bottom = String(0);
        div.style.height = `${128}px`;
        div.style.width = `${128}px`;

        container.appendChild(div);

        div.addEventListener('pointerup', (event) => viewHelper.handleClick(event));

        // add a directional light to the scene
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        scene.add(directionalLight);

        // add ambient light to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        // create an outline effect instance
        const outline = new OutlineEffect(renderer, {
            defaultThickness: 0.003,
            defaultColor: new THREE.Color('black').toArray(),
        });

        // render the scene
        const animate = () => {
            // render main scene
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            if (viewHelper.animating) viewHelper.update(delta);

            // use the outline effect to render the scene
            outline.render(scene, camera);

            // save the current autoClear value
            const wasAutoClear = renderer.autoClear;

            // disable autoClear
            renderer.autoClear = false;

            // render view helper
            viewHelper.render(renderer);

            // restore the previous autoClear value
            renderer.autoClear = wasAutoClear;

            controls.update();
        };
        animate();
    }

    // Function to import a STL file
    function importSTL(scene: THREE.Scene): void {
        fetch(localPathValue.value, {
            headers: {
                Authorization: `Bearer ${authToken.value}`,
            },
        })
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
                const stlLoader = new STLLoader();
                const geometry = stlLoader.parse(buffer);
                const material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    metalness: 0.2,
                    roughness: 0.5,
                    envMapIntensity: 1.0,
                    transparent: true,
                    opacity: 0.5,
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.scale.multiplyScalar(0.03);
                scene.add(mesh);
            })
            .catch((error) => console.error('Error loading STL:', error));
    }

    // Function to import a OBJ file
    function importOBJ(scene: THREE.Scene): void {
        fetch(localPathValue.value, {
            headers: {
                Authorization: `Bearer ${authToken.value}`,
            },
        })
            .then((response) => response.text())
            .then((text) => {
                const objLoader = new OBJLoader();
                const object = objLoader.parse(text);
                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        mesh.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0.2,
                            roughness: 0.5,
                        });
                        mesh.scale.multiplyScalar(0.03);
                    }
                });
                scene.add(object);
            })
            .catch((error) => console.error('Error loading OBJ:', error));
    }

    // Function to import a GLTF file
    function importGLTF(scene: THREE.Scene): void {
        fetch(localPathValue.value, {
            headers: {
                Authorization: `Bearer ${authToken.value}`,
            },
        })
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
                const gltfLoader = new GLTFLoader();
                gltfLoader.parse(buffer, '', (gltf) => {
                    gltf.scene.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh;
                            mesh.scale.multiplyScalar(0.03);
                        }
                    });
                    scene.add(gltf.scene);
                });
            })
            .catch((error) => console.error('Error loading GLTF:', error));
    }
</script>

<style>
    .viewer {
        width: 100%;
        height: 600px;
    }
</style>
