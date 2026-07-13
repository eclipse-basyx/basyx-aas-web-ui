module.exports = class api {

    static submodelPathsV1(aasIdentifier, submodelIdentifier) {
        return [
            {
                submodel: `shells/${base64UrlEncode(aasIdentifier)}/aas/submodels/${base64UrlEncode(submodelIdentifier)}/submodel`,
                submodelElements: `shells/${base64UrlEncode(aasIdentifier)}/aas/submodels/${base64UrlEncode(submodelIdentifier)}/submodel/submodel-elements`
            },
            {
                submodel: `submodels/${base64UrlEncode(submodelIdentifier)}`,
                submodelElements: `submodels/${base64UrlEncode(submodelIdentifier)}/submodel/submodel-elements`
            },
            {
                submodel: `shells/${encodeURIComponent(aasIdentifier)}/aas/submodels`,
                submodelElements: `shells/${encodeURIComponent(aasIdentifier)}/aas/submodels`
            }
        ]
    }
    static submodelPathsV3(aasIdentifier, submodelIdentifier) {
        return [
            {
                submodel: `shells/${this.base64UrlEncode(aasIdentifier)}/submodels/${this.base64UrlEncode(submodelIdentifier)}/submodel`,
                submodelElements: `shells/${this.base64UrlEncode(aasIdentifier)}/submodels/${this.base64UrlEncode(submodelIdentifier)}/submodel/submodelelements`
            },
            {
                submodel: `submodels/${this.base64UrlEncode(submodelIdentifier)}`,
                submodelElements: `submodels/${this.base64UrlEncode(submodelIdentifier)}/submodelelements`
            }
        ]
    }

    static base64UrlEncode(str) {
        // Encode the string to Base64
        let base64 = Buffer.from(str).toString('base64');

        // Replace characters incompatible with URL encoding
        base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

        return base64;
    }

}