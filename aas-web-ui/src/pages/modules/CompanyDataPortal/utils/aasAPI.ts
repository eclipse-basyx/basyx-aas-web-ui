import * as aas from '@aas-core-works/aas-core3.0-typescript';
import { useFormStore } from '../stores/formData';
import { getSubmodel } from './mainSubmodel';

function base64UrlEncode(input: string): string {
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
        return Buffer.from(input, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    const utf8 = new TextEncoder().encode(input);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < utf8.length; i += chunk) {
        binary += String.fromCharCode(...utf8.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createAAS(
    baseUrl: string,
    aasId: string,
    aasDisplayName?: Array<{ language: string; text: string }>
) {
    const assetInfo = new aas.types.AssetInformation(aas.types.AssetKind.Instance, 'urn:example:assets:company:1234');
    const shell = new aas.types.AssetAdministrationShell(aasId, assetInfo);
    shell.idShort = 'CompanyDataAAS';

    if (aasDisplayName && Array.isArray(aasDisplayName) && aasDisplayName.length > 0) {
        shell.displayName = aasDisplayName.map(
            (dn) => new aas.types.LangStringNameType(dn.language ?? 'en', dn.text ?? 'Company Data AAS')
        );
    } else {
        shell.displayName = [new aas.types.LangStringNameType('en', 'Company Data AAS')];
    }

    const body = JSON.stringify(aas.jsonization.toJsonable(shell), null, 2);

    const res = await fetch(`${baseUrl.endsWith('/shells') ? baseUrl : `${baseUrl}/shells`}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });

    if (!res.ok && res.status !== 409) {
        throw new Error(`Failed to create AAS: ${res.status} ${res.statusText}`);
    }
    console.warn(res.status === 409 ? 'AAS already exists' : 'AAS created');
    return shell;
}
export async function upsertSubmodel(baseUrl: string, smIdPrefix: string) {
    const submodel = getSubmodel();
    const store = useFormStore();
    submodel.id = smIdPrefix + submodel.id; // allow custom prefix for submodel ID
    const bankAccounts = submodel.submodelElements?.find((el) => el.idShort === 'BankAccounts');
    if (bankAccounts && 'value' in bankAccounts && Array.isArray((bankAccounts as any).value)) {
        const mainAccount = (bankAccounts as any).value.find((el: { idShort: string }) => el.idShort === 'MainAccount');
        if (mainAccount && 'value' in mainAccount) {
            mainAccount.value = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
                new aas.types.Key(aas.types.KeyTypes.Submodel, submodel.id),
                new aas.types.Key(aas.types.KeyTypes.SubmodelElementCollection, 'BankAccounts'),
                new aas.types.Key(aas.types.KeyTypes.Property, store.getMainAccountIdShort),
            ]);
        }
    }
    const smBody = JSON.stringify(aas.jsonization.toJsonable(submodel), null, 2);

    let res = await fetch(`${baseUrl.endsWith('/shells') ? baseUrl.split('/shells')[0] : baseUrl}/submodels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: smBody,
    });

    if (res.ok) {
        console.warn('Submodel created');
        return submodel;
    }

    if (res.status === 409) {
        const submodelIdB64 = base64UrlEncode(submodel.id);
        res = await fetch(
            `${baseUrl.endsWith('/shells') ? baseUrl.split('/shells')[0] : baseUrl}/submodels/${submodelIdB64}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: smBody,
            }
        );

        if (!res.ok) {
            throw new Error(`Failed to update Submodel: ${res.status} ${res.statusText}`);
        }
        console.warn('Submodel updated');
        return submodel;
    }

    throw new Error(`Failed to create Submodel: ${res.status} ${res.statusText}`);
}

export async function linkSubmodelToAAS(baseUrl: string, aasId: string, submodel: aas.types.Submodel) {
    const ref = new aas.types.Reference(aas.types.ReferenceTypes.ModelReference, [
        new aas.types.Key(aas.types.KeyTypes.Submodel, submodel.id),
    ]);

    const body = JSON.stringify(aas.jsonization.toJsonable(ref), null, 2);

    const aasIdEncoded = base64UrlEncode(aasId);

    const res = await fetch(`${baseUrl}/shells/${aasIdEncoded}/submodel-refs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });

    if (!res.ok && res.status !== 409) {
        throw new Error(`Failed to link Submodel: ${res.status} ${res.statusText}`);
    }
    console.warn(res.status === 409 ? 'Link already exists' : 'Submodel linked to AAS');
}

const COMPANY_LOGO_PATH = 'CompanyIdentification.CompanyLogo';

export async function uploadCompanyLogo({
    baseUrl,
    submodelId,
    file,
    fileName,
}: {
    baseUrl: string;
    submodelId: string;
    file: File | Blob;
    fileName: string;
}) {
    const submodelIdB64 = base64UrlEncode(submodelId);
    const idShortPath = encodeURIComponent(COMPANY_LOGO_PATH);
    const url = `${baseUrl}/submodels/${submodelIdB64}/submodel-elements/${idShortPath}/attachment`;

    const form = new FormData();
    const name = fileName ?? (file as File).name ?? 'company-logo';
    form.append('file', file as any, (file as File).name ?? name);
    form.append('fileName', name);

    const res = await fetch(url, { method: 'PUT', body: form });
    if (!res.ok) {
        throw new Error(`Failed to upload company logo: ${res.status} ${await res.text()}`);
    }
    console.warn('Company logo uploaded');
}

const CONSOLIDATED_PATH = (reportIdShort: string) => `BusinessReportFigures.${reportIdShort}.ConsolidatedDataFile`;
export async function uploadConsolidatedDataFile({
    baseUrl,
    submodelId,
    reportIdShort,
    data,
    fileName,
}: {
    baseUrl: string;
    submodelId: string;
    reportIdShort: string;
    data: File | Blob;
    fileName?: string;
}) {
    const submodelIdB64 = base64UrlEncode(submodelId);
    const idShortPath = encodeURIComponent(CONSOLIDATED_PATH(reportIdShort));
    const url = `${baseUrl}/submodels/${submodelIdB64}/submodel-elements/${idShortPath}/attachment`;

    const form = new FormData();
    const name = fileName ?? (data as File).name ?? 'consolidated-data.pdf';
    form.append('file', data as any, (data as File).name ?? name);
    form.append('fileName', name);

    const res = await fetch(url, { method: 'PUT', body: form });
    if (!res.ok) throw new Error(`ConsolidatedDataFile upload failed: ${res.status} ${await res.text()}`);
}

export async function uploadConsolidatedDataFileByIndex({
    baseUrl,
    index,
    data,
    fileName,
}: {
    baseUrl: string;
    index: number; // comes from Vue's v-for index of the business report figure
    data: File | Blob;
    fileName?: string;
}) {
    // centralize submodelId and idShort construction here
    const submodelId = getSubmodel().id;
    const reportIdShort = `BusinessReportFigure__${String(index).padStart(2, '0')}__`;

    return uploadConsolidatedDataFile({
        baseUrl,
        submodelId,
        reportIdShort,
        data,
        fileName,
    });
}

export async function createAll(
    baseUrl: string,
    aasId: string,
    smIdPrefix: string,
    companyLogoFile?: File,
    aasDisplayName?: Array<{ language: string; text: string }>
) {
    const shell = await createAAS(baseUrl, aasId, aasDisplayName);
    const submodel = await upsertSubmodel(baseUrl, smIdPrefix);
    await linkSubmodelToAAS(baseUrl, shell.id, submodel);
    if (companyLogoFile) {
        await uploadCompanyLogo({
            baseUrl,
            submodelId: getSubmodel().id,
            file: companyLogoFile,
            fileName: 'company-logo',
        });
    }
}
