import type { Ref } from 'vue'
import { computed } from 'vue'
import { type ContractRequest, type DatasetRequest, type TransferRequest, useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'

export interface DataTransferCallbacks {
  /** Called to update the displayed status message. */
  setStatus: (msg: string) => void
  /** Called to set or clear the "transfer in progress" flag. */
  setInProgress: (value: boolean) => void
  /** Reactive ref whose value becomes `true` when the caller requests a cancel. */
  cancelled: Ref<boolean>
}

export interface DataTransferEndpoint {
  endpoint: string
  headers: Headers
}

/**
 * Shared EDC contract-negotiation + transfer flow.
 * Resolves the EDR endpoint that can be used to either fetch (GET) or push (POST) data.
 *
 * Returns `{ endpoint: '', headers: new Headers() }` on any error or cancellation,
 * in which case `callbacks.setInProgress(false)` has already been called.
 */
export function useEdcDataTransfer () {
  const {
    getCatalogDataset,
    initiateContractNegotiation,
    getContractNegotiation,
    getContractNegotiationState,
    initiateTransferProcess,
    getTransferProcessState,
    getEdrDataAddress,
  } = useEdcClient()

  // Stores
  const edcStore = useEdcStore()

  // Computed
  const isEdcV0_12_1 = computed(() => edcStore.getEdcType === 'Tractus-X EDC v0.12.1')

  const CANCELLED: DataTransferEndpoint = { endpoint: '', headers: new Headers() }

  function abort (callbacks: DataTransferCallbacks, msg: string): DataTransferEndpoint {
    callbacks.setInProgress(false)
    callbacks.setStatus(msg)
    return CANCELLED
  }

  /**
   * Validates that the given Business Partner has a DSP endpoint and a BPN set.
   * @returns An error message if validation fails, or `null` if the Business Partner is valid.
   */
  function validateBusinessPartner (businessPartner: any): string | null {
    if (!Object.hasOwn(businessPartner, 'dsp') || businessPartner.dsp.trim() == '') {
      return 'Error: DSP of Business Partner not found'
    }

    if (!Object.hasOwn(businessPartner, 'bpn') || businessPartner.bpn.trim() == '') {
      return 'Error: BPN of Business Partner not found'
    }

    return null
  }

  /**
   * Resolves the (first) ODRL policy from a Catalog Dataset.
   * Accepts either the `odrl:hasPolicy` or the plain `hasPolicy` key.
   */
  function resolvePolicy (catalogDataset: any): any {
    const hasPolicy = catalogDataset['odrl:hasPolicy'] ?? catalogDataset.hasPolicy
    return Array.isArray(hasPolicy) ? hasPolicy[0] : hasPolicy
  }

  /**
   * Initiates the contract negotiation, polls until it is FINALIZED and resolves the
   * resulting contract agreement ID.
   * @returns The contract agreement ID, or `null` if cancelled/failed (already aborted).
   */
  async function initiateAndPollNegotiation (
    contractRequest: any,
    callbacks: DataTransferCallbacks,
  ): Promise<string | null> {
    callbacks.setStatus('Initiating Contract Negotiation...')
    if (callbacks.cancelled.value) {
      abort(callbacks, 'Data transfer cancelled')
      return null
    }

    const negotiationResponse = await initiateContractNegotiation(contractRequest)
    if (!negotiationResponse) {
      abort(callbacks, 'Error: Failed to initiate negotiation')
      return null
    }
    const negotiationId = negotiationResponse['@id']

    let negotiationState = ''
    callbacks.setStatus('Waiting for Negotiation to be finalized...')
    while (negotiationState !== 'FINALIZED' && negotiationState !== 'TERMINATED') {
      if (callbacks.cancelled.value) {
        abort(callbacks, 'Data transfer cancelled')
        return null
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      const stateResponse = await getContractNegotiationState(negotiationId)
      negotiationState = stateResponse?.state || ''
      if (negotiationState) {
        callbacks.setStatus(`Negotiation state: ${negotiationState}`)
      }
    }

    if (negotiationState !== 'FINALIZED') {
      console.error('Negotiation failed or was terminated')
      abort(callbacks, 'Error: Negotiation failed')
      return null
    }

    if (callbacks.cancelled.value) {
      abort(callbacks, 'Data transfer cancelled')
      return null
    }
    const negotiation = await getContractNegotiation(negotiationId)
    const contractAgreementId = negotiation?.contractAgreementId
    if (!contractAgreementId) {
      abort(callbacks, 'Error: No agreement ID found')
      return null
    }

    return contractAgreementId
  }

  /**
   * Initiates the transfer process and polls until it is STARTED/COMPLETED.
   * @returns The transfer process ID, or `null` if cancelled/failed (already aborted).
   */
  async function initiateAndPollTransfer (
    transferRequest: any,
    callbacks: DataTransferCallbacks,
  ): Promise<string | null> {
    if (callbacks.cancelled.value) {
      abort(callbacks, 'Data transfer cancelled')
      return null
    }
    callbacks.setStatus('Initiating Transfer Process...')

    const transferResponse = await initiateTransferProcess(transferRequest)
    if (!transferResponse) {
      abort(callbacks, 'Error: Failed to initiate transfer')
      return null
    }
    const transferProcessId = transferResponse['@id']

    let transferState = ''
    callbacks.setStatus('Waiting for Transfer to start...')
    while (
      transferState !== 'STARTED'
      && transferState !== 'TERMINATED'
      && transferState !== 'COMPLETED'
    ) {
      if (callbacks.cancelled.value) {
        abort(callbacks, 'Data transfer cancelled')
        return null
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      const stateResponse = await getTransferProcessState(transferProcessId)
      transferState = stateResponse?.state || ''
      if (transferState) {
        callbacks.setStatus(`Transfer state: ${transferState}`)
      }
    }

    if (transferState !== 'STARTED' && transferState !== 'COMPLETED') {
      console.error('Transfer failed or was terminated')
      abort(callbacks, 'Error: Transfer failed')
      return null
    }

    return transferProcessId
  }

  /**
   * Retrieves the EDR data address for a transfer process and builds the resulting
   * endpoint + auth headers.
   * @returns The resolved endpoint, or `null` if cancelled/failed (already aborted).
   */
  async function retrieveEdrEndpoint (
    transferProcessId: string,
    callbacks: DataTransferCallbacks,
  ): Promise<DataTransferEndpoint | null> {
    if (callbacks.cancelled.value) {
      abort(callbacks, 'Data transfer cancelled')
      return null
    }
    callbacks.setStatus('Retrieving EDR Data Address...')
    const edr = await getEdrDataAddress(transferProcessId)
    if (!edr) {
      abort(callbacks, 'Error: Failed to retrieve EDR')
      return null
    }

    if (callbacks.cancelled.value) {
      abort(callbacks, 'Data transfer cancelled')
      return null
    }
    callbacks.setStatus('Fetching Asset Data...')
    const endpoint = (edr as any).endpoint
    const token = (edr as any).authorization

    const headers = new Headers()
    if (token) {
      headers.append('Authorization', token)
    }

    return { endpoint, headers }
  }

  async function resolveEdcEndpointByAssetId (
    assetId: string, businessPartner: any,
    callbacks: DataTransferCallbacks,
  ): Promise<DataTransferEndpoint> {
    callbacks.cancelled.value = false
    callbacks.setInProgress(true)

    if (!assetId || assetId.trim() == '') {
      return abort(callbacks, 'Error: @id of Catalog Dataset not found')
    }

    const businessPartnerError = validateBusinessPartner(businessPartner)
    if (businessPartnerError) {
      return abort(callbacks, businessPartnerError)
    }

    const providerDspEndpoint = businessPartner.dsp
    const providerBpn = businessPartner.bpn

    // console.log('1. Get Catalog Dataset')
    callbacks.setStatus('Get EDC Asset...')
    if (callbacks.cancelled.value) {
      return abort(callbacks, 'Data transfer cancelled')
    }
    const datasetRequest: DatasetRequest = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'DatasetRequest',
      '@id': assetId,
      'counterPartyAddress': providerDspEndpoint + (isEdcV0_12_1.value && !providerDspEndpoint.endsWith('/2025-1') ? '/2025-1' : ''),
      'counterPartyId': (isEdcV0_12_1.value ? 'did:web:' + edcStore.getDataspaceSsiHost + ':' : '') + providerBpn,
      'protocol': isEdcV0_12_1.value ? 'dataspace-protocol-http:2025-1' : 'dataspace-protocol-http',
    }

    const catalogDataset = await getCatalogDataset(datasetRequest)
    if (!catalogDataset) {
      return abort(callbacks, 'Error: Failed to getch EDC asset')
    }

    // console.log('2. Resolve EDC Endpoint with Catalog Dataset')
    return await resolveEdcEndpointByCatalogDataset(catalogDataset, businessPartner, callbacks)
  }

  async function resolveEdcEndpointByCatalogDataset (
    catalogDataset: any,
    businessPartner: any,
    callbacks: DataTransferCallbacks,
    usePermission?: any,
  ): Promise<DataTransferEndpoint> {
    callbacks.cancelled.value = false
    callbacks.setInProgress(true)

    if (!Object.hasOwn(catalogDataset, '@id') || catalogDataset['@id'].trim() == '') {
      return abort(callbacks, 'Error: @id of Catalog Dataset not found')
    }

    const businessPartnerError = validateBusinessPartner(businessPartner)
    if (businessPartnerError) {
      return abort(callbacks, businessPartnerError)
    }

    const providerAssetId = catalogDataset['@id']
    const providerDspEndpoint = businessPartner.dsp
    const providerBpn = businessPartner.bpn

    // console.log('1. Initiate Contract Negotiation')
    callbacks.setStatus('Initiating Contract Negotiation...')
    if (callbacks.cancelled.value) {
      return abort(callbacks, 'Data transfer cancelled')
    }

    const policy = resolvePolicy(catalogDataset)

    if (!policy) {
      console.error('No policy found in dataset')
      return abort(callbacks, 'Error: No policy found')
    }

    // console.log('2. Initiate Contract Negotiation and poll until FINALIZED')
    const defaultPermission = {
      action: 'use',
      constraint: [
        {
          and: [
            {
              leftOperand: 'FrameworkAgreement',
              operator: 'eq',
              rightOperand: 'DataExchangeGovernance:1.0',
            },
            {
              leftOperand: 'Membership',
              operator: 'eq',
              rightOperand: 'active',
            },
            {
              leftOperand: 'UsagePurpose',
              operator: 'isAnyOf',
              rightOperand: 'cx.core.industrycore:1',
            },
          ],
        },
      ],
    }

    const contractRequest: ContractRequest = {
      '@context': [
        ...(isEdcV0_12_1.value
          ? [
              'https://w3id.org/dspace/2025/1/odrl-profile.jsonld',
              'https://w3id.org/catenax/2025/9/policy/context.jsonld',
            ]
          : [
              // eslint-disable-next-line unicorn/prefer-https -- exact identifier, not fetch URL.
              'http://www.w3.org/ns/odrl.jsonld',
            ]),
        {
          '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
        },
      ],
      '@type': 'ContractRequest',
      'counterPartyAddress': providerDspEndpoint + (isEdcV0_12_1.value && !providerDspEndpoint.endsWith('/2025-1') ? '/2025-1' : ''),
      'protocol': isEdcV0_12_1.value ? 'dataspace-protocol-http:2025-1' : 'dataspace-protocol-http',
      'policy': {
        '@id': policy['@id'],
        '@type': 'Offer',
        'assigner': (isEdcV0_12_1.value ? 'did:web:' + edcStore.getDataspaceSsiHost + ':' : '') + providerBpn,
        'target': providerAssetId,
        'permission': isEdcV0_12_1.value ? usePermission || defaultPermission : [],
        'prohibition': [],
        'obligation': [],
      },
    }
    const contractAgreementId = await initiateAndPollNegotiation(contractRequest, callbacks)
    if (!contractAgreementId) {
      return callbacks.cancelled.value ? CANCELLED : abort(callbacks, 'Error: No agreement ID found')
    }

    // console.log('3. Initiate Transfer Process and poll until STARTED / COMPLETED')
    const transferRequest: TransferRequest = {
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
      },
      '@type': 'TransferRequest',
      'counterPartyAddress': providerDspEndpoint + (isEdcV0_12_1.value && !providerDspEndpoint.endsWith('/2025-1') ? '/2025-1' : ''),
      'counterPartyId': (isEdcV0_12_1.value ? 'did:web:' + edcStore.getDataspaceSsiHost + ':' : '') + providerBpn,
      'contractId': contractAgreementId,
      'protocol': isEdcV0_12_1.value ? 'dataspace-protocol-http:2025-1' : 'dataspace-protocol-http',
      'assetId': providerAssetId,
      'transferType': 'HttpData-PULL',
    }
    const transferProcessId = await initiateAndPollTransfer(transferRequest, callbacks)
    if (!transferProcessId) {
      return callbacks.cancelled.value ? CANCELLED : abort(callbacks, 'Error: No transfer process ID found')
    }

    // 4. Retrieve EDR Data Address and build endpoint + auth headers
    const result = await retrieveEdrEndpoint(transferProcessId, callbacks)
    return result ?? CANCELLED
  }

  return { resolveEdcEndpointByAssetId, resolveEdcEndpointByCatalogDataset }
}
