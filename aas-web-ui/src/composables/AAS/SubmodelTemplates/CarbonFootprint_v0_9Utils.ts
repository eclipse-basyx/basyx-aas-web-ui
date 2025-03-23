export function useCarbonFootprint_v0_9Utils() {
    const semanticId = 'https://admin-shell.io/idta/CarbonFootprint/CarbonFootprint/0/9';

    const semanticIdSMCProductCarbonFootprint =
        'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9';

    const semanticIdSMCTransportCarbonFootprint =
        'https://admin-shell.io/idta/CarbonFootprint/TransportCarbonFootprint/0/9';

    const pcfLifeCyclePhases = [
        {
            valueId: '0173-1#07-ABU208#001',
            value: 'A1 - raw material supply (and upstream production)',
            identifier: 'A1',
            icon: 'mdi-raw',
        },
        {
            valueId: '0173-1#07-ABU209#001',
            value: 'A2 - cradle-to-gate transport to factory',
            identifier: 'A2',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU210#001',
            value: 'A3 - production',
            identifier: 'A3',
            icon: 'mdi-robot-industrial',
        },
        {
            valueId: '0173-1#07-ABU211#001',
            value: 'A4 - transport to final destination',
            identifier: 'A4',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU212#001',
            value: 'B1 - usage phase',
            identifier: 'B1',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABV498#001',
            value: 'B2 - maintenance',
            identifier: 'B2',
            icon: 'mdi-wrench-clock',
        },
        {
            valueId: '0173-1#07-ABV497#001',
            value: 'B3 - repair',
            identifier: 'B3',
            icon: 'mdi-wrench',
        },
        {
            valueId: '0173-1#07-ABV499#001',
            value: 'B5 - update/upgrade, refurbishing',
            identifier: 'B5',
            icon: 'mdi-update',
        },
        {
            valueId: '0173-1#07-ABV500#001',
            value: 'B6 - usage energy consumption',
            identifier: 'B6',
            icon: 'mdi-flash-outline',
        },
        {
            valueId: '0173-1#07-ABV501#001',
            value: 'B7 - usage water consumption',
            identifier: 'B7',
            icon: 'mdi-water-outline',
        },
        {
            valueId: '0173-1#07-ABV502#001',
            value: 'C1 - reassembly',
            identifier: 'C1',
            icon: 'mdi-robot-industrial',
        },
        {
            valueId: '0173-1#07-ABU213#001',
            value: 'C2 - transport to recycler',
            identifier: 'C2',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABV503#001',
            value: 'C3 - recycling, waste treatment',
            identifier: 'C3',
            icon: 'mdi-recycle',
        },
        {
            valueId: '0173-1#07-ABV504#001',
            value: 'C4 - landfill',
            identifier: 'C4',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABU214#001',
            value: 'D - reuse',
            identifier: 'D',
            icon: '',
        },
        {
            valueId: '0173-1#07-ABZ789#001',
            value: 'A1 - raw material supply (and upstream production), A2 - cradle-to-gate transport to factory, A3 - production',
            identifier: 'A1-A3',
            icon: '',
        },
    ];

    const tcfProcessesForGreenhouseGasEmissionInATransportServices = [
        {
            valueId: '0173-1#07-ABU216#001',
            value: 'Well-to-Tank',
            identifier: 'WTT',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU215#001',
            value: 'Tank-to-Wheel',
            identifier: 'TTW',
            icon: 'mdi-truck-outline',
        },
        {
            valueId: '0173-1#07-ABU217#001',
            value: 'Well-to-Wheel',
            identifier: 'WTW',
            icon: 'mdi-truck-outline',
        },
    ];

    function getPcfLifeCyclePhaseFromId(pcfLifeCyclePhaseId: string): any {
        const failResponse = {};

        if (!pcfLifeCyclePhaseId || pcfLifeCyclePhaseId.trim() === '') return failResponse;

        const pcfLifeCyclePhase = pcfLifeCyclePhases.find(
            (pcfLifeCyclePhase: any) =>
                pcfLifeCyclePhase.identifier === pcfLifeCyclePhaseId ||
                pcfLifeCyclePhase.valueId === pcfLifeCyclePhaseId
        );

        if (pcfLifeCyclePhase && Object.keys(pcfLifeCyclePhase).length > 0) return pcfLifeCyclePhase;

        return failResponse;
    }

    function getTcfProcessesForGreenhouseGasEmissionInATransportServiceFromId(
        tcfProcessesForGreenhouseGasEmissionInATransportServiceId: string
    ): any {
        const failResponse = {};

        if (
            !tcfProcessesForGreenhouseGasEmissionInATransportServiceId ||
            tcfProcessesForGreenhouseGasEmissionInATransportServiceId.trim() === ''
        )
            return failResponse;

        const tcfProcessesForGreenhouseGasEmissionInATransportService =
            tcfProcessesForGreenhouseGasEmissionInATransportServices.find(
                (tcfProcessesForGreenhouseGasEmissionInATransportService: any) =>
                    tcfProcessesForGreenhouseGasEmissionInATransportService.identifier ===
                        tcfProcessesForGreenhouseGasEmissionInATransportServiceId ||
                    tcfProcessesForGreenhouseGasEmissionInATransportService.valueId ===
                        tcfProcessesForGreenhouseGasEmissionInATransportServiceId
            );

        if (
            tcfProcessesForGreenhouseGasEmissionInATransportService &&
            Object.keys(tcfProcessesForGreenhouseGasEmissionInATransportService).length > 0
        )
            return tcfProcessesForGreenhouseGasEmissionInATransportService;

        return failResponse;
    }

    return {
        semanticId,
        semanticIdSMCProductCarbonFootprint,
        semanticIdSMCTransportCarbonFootprint,
        pcfLifeCyclePhases,
        tcfProcessesForGreenhouseGasEmissionInATransportServices,
        getPcfLifeCyclePhaseFromId,
        getTcfProcessesForGreenhouseGasEmissionInATransportServiceFromId,
    };
}
