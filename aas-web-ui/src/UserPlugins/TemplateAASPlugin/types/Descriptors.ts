import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';

export class AASDescriptor {
    // Required fields
    endpoints: Array<Endpoint>;
    id: string;
    // Optional fields
    administration?: AdministrativeInformation | null;
    assetKind?: string | null;
    assetType?: string | null;
    description?: aasTypes.LangStringTextType[] | null;
    displayName?: aasTypes.LangStringNameType[] | null;
    extensions?: Array<aasTypes.Extension> | null;
    globalAssetId?: string | null;
    idShort?: string | null;
    specificAssetId?: Array<aasTypes.SpecificAssetId> | null;
    submodelDescriptors?: Array<SubmodelDescriptor> | null;

    constructor(
        endpoints: Array<Endpoint>,
        id: string,
        administration?: aasTypes.AdministrativeInformation | null,
        assetKind?: string | null,
        assetType?: string | null,
        description?: aasTypes.LangStringTextType[] | null,
        displayName?: aasTypes.LangStringNameType[] | null,
        extensions?: Array<aasTypes.Extension> | null,
        globalAssetId?: string | null,
        idShort?: string | null,
        specificAssetId?: Array<aasTypes.SpecificAssetId> | null,
        submodelDescriptors?: Array<SubmodelDescriptor> | null
    ) {
        this.id = id;
        this.endpoints = endpoints;
        this.administration = administration;
        this.assetKind = assetKind;
        this.assetType = assetType;
        this.description = description;
        this.displayName = displayName;
        this.extensions = extensions;
        this.globalAssetId = globalAssetId;
        this.idShort = idShort;
        this.specificAssetId = specificAssetId;
        this.submodelDescriptors = submodelDescriptors;
    }
}

export class SubmodelDescriptor {
    // Required fields
    endpoints: Array<Endpoint>;
    id: string;
    // Optional fields
    administration?: aasTypes.AdministrativeInformation | null;
    description?: string | null;
    displayName?: string | null;
    extensions?: Array<aasTypes.Extension> | null;
    idShort?: string | null;
    semanticId?: aasTypes.Reference | null;
    supplementalSemanticIds?: Array<aasTypes.Reference> | null;

    constructor(
        endpoints: Array<Endpoint>,
        id: string,
        administration?: aasTypes.AdministrativeInformation | null,
        description?: string | null,
        displayName?: string | null,
        extensions?: Array<aasTypes.Extension> | null,
        idShort?: string | null,
        semanticId?: aasTypes.Reference | null,
        supplementalSemanticIds?: Array<aasTypes.Reference> | null
    ) {
        this.id = id;
        this.endpoints = endpoints;
        this.administration = administration;
        this.description = description;
        this.displayName = displayName;
        this.extensions = extensions;
        this.idShort = idShort;
        this.semanticId = semanticId;
        this.supplementalSemanticIds = supplementalSemanticIds;
    }
}

export class Endpoint {
    interface: string;
    protocolInformation: ProtocolInformation;

    constructor(interface_: string, protocolInformation: ProtocolInformation) {
        this.interface = interface_;
        this.protocolInformation = protocolInformation;
    }
}

export class ProtocolInformation {
    href: string;
    securityAttributes?: SecurityAttributes | null;
    endpointProtocol?: string | null;
    endpointProtocolVersion?: Array<string> | null;
    subProtocol?: string | null;
    subprotocolBody?: string | null;
    subprotocolBodyEncoding?: string | null;

    constructor(
        href: string,
        securityAttributes: SecurityAttributes | null,
        endpointProtocol?: string | null,
        endpointProtocolVersion?: Array<string> | null,
        subProtocol?: string | null,
        subprotocolBody?: string | null,
        subprotocolBodyEncoding?: string | null
    ) {
        this.href = href;
        this.securityAttributes = securityAttributes;
        this.endpointProtocol = endpointProtocol;
        this.endpointProtocolVersion = endpointProtocolVersion;
        this.subProtocol = subProtocol;
        this.subprotocolBody = subprotocolBody;
        this.subprotocolBodyEncoding = subprotocolBodyEncoding;
    }
}

export class SecurityAttributes {
    type: string;
    key: string;
    value: string;

    constructor(type: string, key: string, value: string) {
        this.type = type;
        this.key = key;
        this.value = value;
    }
}

export class AdministrativeInformation {
    version?: string | null;
    revision?: string | null;
    creator?: aasTypes.Reference | null;
    templateId?: string | null;
}
