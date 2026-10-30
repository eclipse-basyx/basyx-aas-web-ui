<template>
  <v-container class="pa-0" :class="{ 'h-100': fill }" fluid>
    <v-card v-show="showViewer" :class="{ 'h-100': fill }" :flat="fill">
      <!-- CAD File Preview -->
      <div
        ref="viewerContainer"
        class="position-relative w-100"
        :class="{ 'h-100': fill }"
        :style="fill ? undefined : { height: '600px' }"
      />
    </v-card>

    <v-container
      v-show="!showViewer"
      class="pa-0 ma-0 d-flex justify-center align-center"
      :class="{ 'h-100': fill }"
      fluid
      :style="fill ? undefined : { height: 'calc(100svh - 202px)' }"
    >
      <v-empty-state class="text-divider" title="No available CAD visualization" />
    </v-container>
  </v-container>
</template>

<script setup lang="ts">
  import * as THREE from 'three'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js'
  import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
  import { ViewHelper } from 'three/examples/jsm/helpers/ViewHelper.js'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
  import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
  import { useSMEFile } from '@/composables/AAS/SubmodelElements/File'
  import { useRequestHandling } from '@/composables/RequestHandling'
  import { type CadFormat, resolveCadFormat } from '@/utils/AAS/CadFormat'

  type ViewerSession = {
    scene: THREE.Scene
    fit: (object: THREE.Object3D) => void
    resetView: () => void
    dispose: () => void
  }

  // Props
  const props = withDefaults(
    defineProps<{
      submodelElementData: any
      /** Fill the height of the parent instead of using a fixed height */
      fill?: boolean
    }>(),
    { fill: false },
  )

  // Emits
  const emit = defineEmits<{
    loaded: []
    error: []
  }>()

  // Template refs
  const viewerContainer = ref<HTMLElement>()

  // Composables
  const { valueUrl } = useSMEFile()
  const { getRequest } = useRequestHandling()

  // Reactive data
  const localPathValue = ref('')
  const showViewer = ref(true)

  // Non-reactive state
  let session: ViewerSession | null = null
  let initToken = 0

  // Watchers
  watch(() => props.submodelElementData, initialize)

  onMounted(initialize)

  onBeforeUnmount(() => {
    initToken++
    disposeSession()
  })

  // Methods
  async function initialize (): Promise<void> {
    const token = ++initToken
    disposeSession()

    if (props.submodelElementData?.modelType != 'File') return

    localPathValue.value = valueUrl(props.submodelElementData).url

    // check the mime type (or file extension) of the file
    const format = resolveCadFormat(props.submodelElementData)
    if (!format) {
      // console.log('Unsupported File Type');
      showViewer.value = false
      emit('error')
      return
    }

    // the container needs its size before the renderer is created
    showViewer.value = true
    await nextTick()
    if (token !== initToken) return

    const current = createSession(viewerContainer.value as HTMLElement, format)
    session = current
    await loadModel(current, format)
  }

  function disposeSession (): void {
    session?.dispose()
    session = null
  }

  function resetView (): void {
    session?.resetView()
  }

  function createStandardMaterial (): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xff_ff_ff,
      metalness: 0.2,
      roughness: 0.5,
      envMapIntensity: 1,
      transparent: true,
      opacity: 0.5,
    })
  }

  function disposeObject (object: THREE.Object3D): void {
    object.traverse(child => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry?.dispose()
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        for (const value of Object.values(material)) {
          if ((value as THREE.Texture | undefined)?.isTexture) (value as THREE.Texture).dispose()
        }
        material.dispose()
      }
    })
  }

  function createSession (container: HTMLElement, format: CadFormat): ViewerSession {
    // Only glTF brings its own (PBR) materials; STL and OBJ get the uniform outlined look
    const useNativeMaterials = format == 'gltf'

    // create a new Three.js scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x34_34_34)

    // create a new Three.js camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / (container.clientHeight || 1), 0.1, 1000)
    camera.position.set(0, 0, 5)

    // create a new Three.js renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.append(renderer.domElement)

    // Add a resize observer to the container
    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth === 0 || container.clientHeight === 0) return

      // Update the size of the renderer
      renderer.setSize(container.clientWidth, container.clientHeight)

      // Update the aspect ratio of the camera
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(container)

    // create a new Three.js OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // clock
    const clock = new THREE.Clock()

    // add a view cube with three.js view helper
    const viewHelper = new ViewHelper(camera, renderer.domElement)
    // add orbiatlcontrols to the view helper
    viewHelper.center = controls.target

    const viewHelperElement = document.createElement('div')
    viewHelperElement.id = 'viewHelper'
    viewHelperElement.style.position = 'absolute'
    viewHelperElement.style.right = String(0)
    viewHelperElement.style.bottom = String(0)
    viewHelperElement.style.height = `${128}px`
    viewHelperElement.style.width = `${128}px`

    container.append(viewHelperElement)

    viewHelperElement.addEventListener('pointerup', event => viewHelper.handleClick(event))

    // add a directional light to the scene
    const directionalLight = new THREE.DirectionalLight(0xff_ff_ff, 0.8)
    directionalLight.position.set(0, 10, 0)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 100
    scene.add(directionalLight)

    // add ambient light to the scene
    const ambientLight = new THREE.AmbientLight(0xff_ff_ff, 0.6)
    scene.add(ambientLight)

    // PBR materials need an environment to be lit properly
    let environment: THREE.WebGLRenderTarget | null = null
    if (useNativeMaterials) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04)
      scene.environment = environment.texture
      pmremGenerator.dispose()
    }

    // create an outline effect instance
    const outline = new OutlineEffect(renderer, {
      defaultThickness: 0.003,
      defaultColor: new THREE.Color('black').toArray(),
    })

    // render the scene
    let animationFrame = 0
    const animate = (): void => {
      animationFrame = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      if (viewHelper.animating) viewHelper.update(delta)

      if (useNativeMaterials) {
        renderer.render(scene, camera)
      } else {
        // use the outline effect to render the scene
        outline.render(scene, camera)
      }

      // save the current autoClear value
      const wasAutoClear = renderer.autoClear

      // disable autoClear
      renderer.autoClear = false

      // render view helper
      viewHelper.render(renderer)

      // restore the previous autoClear value
      renderer.autoClear = wasAutoClear

      controls.update()
    }
    animate()

    // camera pose the view is reset to; glTF models replace it with a pose that frames the model
    const initialPosition = camera.position.clone()
    const initialTarget = controls.target.clone()

    return {
      scene,
      // Frame an object of arbitrary scale and position
      fit (object) {
        const box = new THREE.Box3().setFromObject(object)
        if (box.isEmpty()) return

        const sphere = box.getBoundingSphere(new THREE.Sphere())
        const verticalFov = THREE.MathUtils.degToRad(camera.fov)
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * (camera.aspect || 1))
        const distance = (sphere.radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2)) * 1.1

        initialTarget.copy(sphere.center)
        initialPosition.copy(sphere.center).addScaledVector(new THREE.Vector3(1, 0.7, 1).normalize(), distance)

        camera.near = distance / 100
        camera.far = distance * 100
        camera.updateProjectionMatrix()

        controls.minDistance = sphere.radius * 0.1
        controls.maxDistance = distance * 10
        directionalLight.position.copy(sphere.center).add(new THREE.Vector3(0, distance, 0))
        directionalLight.shadow.camera.far = distance * 4

        camera.position.copy(initialPosition)
        controls.target.copy(initialTarget)
        controls.update()
      },
      resetView () {
        camera.position.copy(initialPosition)
        controls.target.copy(initialTarget)
        controls.update()
      },
      dispose () {
        cancelAnimationFrame(animationFrame)
        resizeObserver.disconnect()
        viewHelperElement.remove()
        controls.dispose()
        viewHelper.dispose()
        disposeObject(scene)
        environment?.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      },
    }
  }

  async function loadModel (current: ViewerSession, format: CadFormat): Promise<void> {
    try {
      const file = await fetchCADFile()
      if (!file) {
        emit('error')
        return
      }

      const object = await parseModel(format, file)

      // The viewer was disposed or re-initialized while the file was loading
      if (session !== current) {
        disposeObject(object)
        return
      }

      current.scene.add(object)
      if (format == 'gltf') current.fit(object)
      emit('loaded')
    } catch (error) {
      console.error(`Error loading ${format.toUpperCase()}:`, error)
      if (session === current) {
        showViewer.value = false
        emit('error')
      }
    }
  }

  async function fetchCADFile (): Promise<Blob | null> {
    const response = await getRequest(localPathValue.value, 'loading CAD file', false, new Headers(), {}, 'blob')
    if (!response.success) {
      showViewer.value = false
      return null
    }
    return response.data
  }

  async function parseModel (format: CadFormat, file: Blob): Promise<THREE.Object3D> {
    switch (format) {
      case 'stl': {
        const geometry = new STLLoader().parse(await file.arrayBuffer())
        const mesh = new THREE.Mesh(geometry, createStandardMaterial())
        mesh.scale.multiplyScalar(0.03)
        return mesh
      }
      case 'obj': {
        const object = new OBJLoader().parse(await file.text())
        object.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.material = createStandardMaterial()
            mesh.scale.multiplyScalar(0.03)
          }
        })
        return object
      }
      case 'gltf': {
        // GLTFLoader reads both .gltf (JSON) and .glb (binary); the glTF keeps its own materials and scale
        const buffer = await file.arrayBuffer()
        return new Promise<THREE.Object3D>((resolve, reject) => {
          new GLTFLoader().parse(buffer, '', gltf => resolve(gltf.scene), reject)
        })
      }
    }
  }

  defineExpose({ resetView })
</script>
