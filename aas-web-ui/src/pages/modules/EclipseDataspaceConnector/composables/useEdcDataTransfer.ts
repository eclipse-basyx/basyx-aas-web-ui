import type { Ref } from 'vue'
import { useEdcClient } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'

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
    initiateContractNegotiation,
    getContractNegotiation,
    getContractNegotiationState,
    initiateTransferProcess,
    getTransferProcessState,
    getEdrDataAddress,
  } = useEdcClient()

  const CANCELLED: DataTransferEndpoint = { endpoint: '', headers: new Headers() }

  function abort (callbacks: DataTransferCallbacks, msg: string): DataTransferEndpoint {
    callbacks.setInProgress(false)
    callbacks.setStatus(msg)
    return CANCELLED
  }

  async function resolveEdcEndpoint (
    selectedBusinessPartner: any,
    selectedCatalogDataset: any,
    callbacks: DataTransferCallbacks,
  ): Promise<DataTransferEndpoint> {
    callbacks.cancelled.value = false
    callbacks.setInProgress(true)
    callbacks.setStatus('Initiating Contract Negotiation...')

    const providerAssetId = selectedCatalogDataset['@id']
    const providerDspEndpoint = selectedBusinessPartner.dsp
    const providerBpn = selectedBusinessPartner.bpn

    const policy = Array.isArray(selectedCatalogDataset['odrl:hasPolicy'])
      ? selectedCatalogDataset['odrl:hasPolicy'][0]
      : selectedCatalogDataset['odrl:hasPolicy']

    if (!policy) {
      console.error('No policy found in dataset')
      return abort(callbacks, 'Error: No policy found')
    }

    const contractRequest: any = {
      counterPartyAddress: providerDspEndpoint,
      protocol: 'dataspace-protocol-http',
      policy: {
        '@id': policy['@id'],
        '@type': 'Offer',
        'assigner': providerBpn,
        'target': providerAssetId,
        'permission': [{ action: 'use' }],
        'prohibition': [],
        'obligation': [],
      },
    }

    // 1. Initiate Contract Negotiation
    if (callbacks.cancelled.value) {
      return abort(callbacks, 'Data transfer cancelled')
    }
    const negotiationResponse = await initiateContractNegotiation(contractRequest)
    if (!negotiationResponse) {
      return abort(callbacks, 'Error: Failed to initiate negotiation')
    }
    const negotiationId = negotiationResponse['@id']

    // 2. Poll Negotiation State until FINALIZED
    let negotiationState = ''
    callbacks.setStatus('Waiting for Negotiation to be finalized...')
    while (negotiationState !== 'FINALIZED') {
      if (callbacks.cancelled.value) {
        return abort(callbacks, 'Data transfer cancelled')
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
      return abort(callbacks, 'Error: Negotiation failed')
    }

    // 3. Get agreement ID
    if (callbacks.cancelled.value) {
      return abort(callbacks, 'Data transfer cancelled')
    }
    const negotiation = await getContractNegotiation(negotiationId)
    const contractAgreementId = negotiation?.contractAgreementId
    if (!contractAgreementId) {
      return abort(callbacks, 'Error: No agreement ID found')
    }

    // 4. Initiate Transfer Process
    if (callbacks.cancelled.value) {
      return abort(callbacks, 'Data transfer cancelled')
    }
    callbacks.setStatus('Initiating Transfer Process...')
    const transferRequest: any = {
      counterPartyAddress: providerDspEndpoint,
      counterPartyId: providerBpn,
      contractId: contractAgreementId,
      protocol: 'dataspace-protocol-http',
      assetId: providerAssetId,
      transferType: 'HttpData-PULL',
    }

    const transferResponse = await initiateTransferProcess(transferRequest)
    if (!transferResponse) {
      return abort(callbacks, 'Error: Failed to initiate transfer')
    }
    const transferProcessId = transferResponse['@id']

    // 5. Poll Transfer Process State until STARTED / COMPLETED
    let transferState = ''
    callbacks.setStatus('Waiting for Transfer to start...')
    while (
      transferState !== 'STARTED'
      && transferState !== 'TERMINATED'
      && transferState !== 'COMPLETED'
    ) {
      if (callbacks.cancelled.value) {
        return abort(callbacks, 'Data transfer cancelled')
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
      return abort(callbacks, 'Error: Transfer failed')
    }

    // 6. Get EDR Data Address
    if (callbacks.cancelled.value) {
      return abort(callbacks, 'Data transfer cancelled')
    }
    callbacks.setStatus('Retrieving EDR Data Address...')
    const edr = await getEdrDataAddress(transferProcessId)
    if (!edr) {
      return abort(callbacks, 'Error: Failed to retrieve EDR')
    }

    // 7. Build endpoint + auth headers
    if (callbacks.cancelled.value) {
      return abort(callbacks, 'Data transfer cancelled')
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

  return { resolveEdcEndpoint }
}
