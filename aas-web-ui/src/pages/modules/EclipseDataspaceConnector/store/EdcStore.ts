import type { EdcConfig, YamlEdcConfig } from '@/pages/modules/EclipseDataspaceConnector/types/Edc'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useEdcYamlParser } from '@/pages/modules/EclipseDataspaceConnector/composables/useEdcYamlParser'

export const useEdcStore = defineStore('edcStore', () => {
  const config = ref<EdcConfig | null>(null)
  const { parseYamlConfig } = useEdcYamlParser()

  // Getters
  const getEdcConfig = computed(() => config.value)
  const getEdcType = computed(() => config.value?.type || '')
  const getControlplaneEndpoint = computed(() => config.value?.controlplane.endpoint || '')
  const getControlplaneMgmtEndpoint = computed(() => config.value?.controlplane.managementEndpoint || '')
  const getControlplaneDspEndpoint = computed(() => config.value?.controlplane.dspEndpoint || '')
  const getControlplaneApiAuthKey = computed(() => config.value?.security.config?.key || '')
  const getControlplaneTokenServerEndpoint = computed(() => config.value?.security.config?.url || '')
  const getControlplaneTokenClientId = computed(() => config.value?.security.config?.clientId || '')
  const getControlplaneTokenClientSecret = computed(() => config.value?.security.config?.clientSecret || '')
  const getControlplaneAuthHeader = computed(async () => {
    if (getControlplaneApiAuthKey.value && getControlplaneApiAuthKey.value.trim() !== '') {
      // Controlplane X-Api-Key
      return ['X-Api-Key', getControlplaneApiAuthKey.value]
    } else if (getControlplaneTokenServerEndpoint.value && getControlplaneTokenServerEndpoint.value.trim() !== ''
      && getControlplaneTokenClientId.value && getControlplaneTokenClientId.value.trim() !== ''
      && getControlplaneTokenClientSecret.value && getControlplaneTokenClientSecret.value.trim() !== '') {
      // Fetch Controlplane access token from token server
      const authString = `${getControlplaneTokenClientId.value}:${getControlplaneTokenClientSecret.value}`
      const encoded = Buffer.from(authString).toString('base64')

      const response = await fetch(getControlplaneTokenServerEndpoint.value, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${encoded}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      })

      const data = await response.json()
      return ['Authorization', data.access_token]
    }

    return ['', '']
  })

  // Actions
  function saveConfig (yamlConfig: YamlEdcConfig): void {
    config.value = parseYamlConfig(yamlConfig)
  }

  function clearConfig (): void {
    config.value = null
  }

  function setEdcType (type: string): void {
    if (config.value) {
      config.value.type = type as any
    }
  }

  function setControlplaneEndpoint (endpoint: string): void {
    if (config.value) {
      config.value.controlplane.endpoint = endpoint
    }
  }

  function setControlplaneMgmtEndpoint (url: string): void {
    if (config.value) {
      config.value.controlplane.managementEndpoint = url
    }
  }

  function setControlplaneDspEndpoint (url: string): void {
    if (config.value) {
      config.value.controlplane.dspEndpoint = url
    }
  }

  function setControlplaneKey (key: string): void {
    if (config.value) {
      if (!config.value.security.config) {
        config.value.security.config = {}
      }
      config.value.security.config.key = key
    }
  }

  function setSecurityConfigUrl (url: string): void {
    if (config.value) {
      if (!config.value.security.config) {
        config.value.security.config = {}
      }
      config.value.security.config.url = url
    }
  }

  function setSecurityConfigClientId (clientId: string): void {
    if (config.value) {
      if (!config.value.security.config) {
        config.value.security.config = {}
      }
      config.value.security.config.clientId = clientId
    }
  }

  function setSecurityConfigClientSecret (clientSecret: string): void {
    if (config.value) {
      if (!config.value.security.config) {
        config.value.security.config = {}
      }
      config.value.security.config.clientSecret = clientSecret
    }
  }

  return {
    // Getters
    getEdcConfig,
    getEdcType,
    getControlplaneEndpoint,
    getControlplaneMgmtEndpoint,
    getControlplaneDspEndpoint,
    getControlplaneApiAuthKey,
    getControlplaneTokenServerEndpoint,
    getControlplaneTokenClientId,
    getControlplaneTokenClientSecret,
    getControlplaneAuthHeader,
    // Actions
    saveConfig,
    clearConfig,
    setEdcType,
    setControlplaneEndpoint,
    setControlplaneMgmtEndpoint,
    setControlplaneDspEndpoint,
    setControlplaneKey,
    setSecurityConfigUrl,
    setSecurityConfigClientId,
    setSecurityConfigClientSecret,
  }
})
