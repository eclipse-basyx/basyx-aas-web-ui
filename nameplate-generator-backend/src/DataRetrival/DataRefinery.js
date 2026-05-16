const DataExtractor = require("./DataExtractor")
const Api = require("./API")

module.exports = class DataRefinery {

    requestCount = {}

    constructor(serverAddress) {
        if (serverAddress.endsWith("/")) {
            this.serverAddress = serverAddress;
        } else {
            this.serverAddress = serverAddress + "/";
        }
        this.apiVersion = 3;
    }

    // function returns asset data as json
    async getData(aasid) {
        // get asset overview data from server
        let response = await this.#getDataFromServer(this.serverAddress + aasid)

        if (!response || (Object.hasOwn(response, 'success/') && !response.success)) {
            throw new Error(this.serverAddress + aasid)
        }
        let assetId = response["identification"] ? response["identification"]["id"] : response["id"]
        let submodels = {}
        // when submodels in response:
        if (response["submodels"]) {

            for (let submodelReference in response["submodels"]) {
                submodelReference = response["submodels"][submodelReference]


                if (submodelReference["keys"].length === 0) {
                    return reject("No Reference");
                }
                let submodelReferenceId = submodelReference["keys"][0]["value"]

                // get api version
                let apiVersion = this.analyzeApiVersion(submodelReference)

                let submodelPaths
                if (apiVersion === 3) {
                    submodelPaths = Api.submodelPathsV3(assetId, submodelReferenceId)
                } else {
                    submodelPaths = submodelPathsV1(assetId, submodelReferenceId)
                }

                let submodelData = {}
                let tryCount = 1
                for (const submodelPath of submodelPaths) {
                    // for each submodel path get new aas data for the submodel
                    submodelData = await this.#getDataFromServer(this.serverAddress + submodelPath.submodel, true).then((result) => {

                        let submodelDataArray
                        if (!result) return undefined
                        if (Array.isArray(result)) {
                            submodelDataArray = result
                        } else {
                            submodelDataArray = [result]
                        }
                        let returnData = {}
                        for (const submodelDataElement of submodelDataArray) {
                            let submodelName = submodelDataElement.idShort
                            let submodelID = apiVersion === 3 ? submodelReferenceId : submodelDataElement.identification.id
                            let extractedSubmodelData
                            let de = new DataExtractor(submodelDataElement["submodelElements"])
                            if (apiVersion === 3) {
                                extractedSubmodelData = de.extractAllDataV3(this.serverAddress + submodelPath.submodelElements)
                            } else {
                                extractedSubmodelData = de.extractAllDataV1(this.serverAddress + submodelPath.submodelElements)
                            }

                            returnData = {
                                ...returnData,
                                [submodelName]: {
                                    idShort: submodelName,
                                    id: submodelID,
                                    semanticId: this.loadSemanticID(submodelDataElement),
                                    ...extractedSubmodelData
                                }
                            }
                        }

                        return returnData
                    })

                    if (submodelData) {
                        break;
                    }
                    console.warn("Using fallback for asset ", assetId, "in try", tryCount)
                    tryCount++
                }

                // add the return jsons from submodels
                submodels = Object.assign(submodels, submodelData)


            }
        }
        let assetObject = {
            "idShort": response["idShort"],
            "id": assetId,
            "num": 0,
            "productImages": []
        }
        let assetRef = this.loadAssetRef(response)
        if (assetRef) {
            assetObject.AssetRef = assetRef
        }
        // add submodels to return json
        assetObject = Object.assign(assetObject, submodels)

        return assetObject
    }

    /**
     * Check which API-Version was likely used for this submodel
     * May break with future API updates
     * @param submodel The submodel
     * @returns {1|3} The version of the API likely used for this submodel
     */
    analyzeApiVersion(submodel) {
        let apiVersion
        if (submodel["type"]) {
            apiVersion = 3
        } else {
            apiVersion = 1
        }
        this.apiVersion = apiVersion

        return apiVersion
    }

    /**
     * Get the assetRef parameter if it exists
     * @param asset The Asset
     * @returns {undefined|string} The value of the assetRef or undefined if not found
     */
    loadAssetRef(asset) {
        if (asset && asset["assetRef"] && asset["assetRef"]["keys"] && asset["assetRef"]["keys"][0]) {
            return asset["assetRef"]["keys"][0]["value"]
        }
        // Get A rev for V3 Servers (Not really AssetRef)
        /*else if(asset&&asset["assetInformation"]&&asset["assetInformation"]["globalAssetId"]&&asset["assetInformation"]["globalAssetId"]["keys"]&&asset["assetInformation"]["globalAssetId"]["keys"][0]){
            return asset["assetInformation"]["globalAssetId"]["keys"][0]["value"]
        }*/
        return undefined
    }

    loadSemanticID(submodel) {
        return submodel && submodel.semanticId && submodel.semanticId.keys && submodel.semanticId.keys[0] && submodel.semanticId.keys[0].value
    }

    /**
     * Perform a GET request to a server try to convert the result to JSON and handle errors
     * @param address Address of the server
     * @param silent Failing is expected, do not throw errors
     * @returns {Promise<object>|undefined} The response as JSON-Object
     */
    async #getDataFromServer(address, silent = false) {
        // console.log("Making request to " + address);
        this.requestCount[address] ? this.requestCount[address]++ : this.requestCount[address] = 1
        return fetch(address)
            .then(response => {
                if (!response.ok) {
                    if (!silent) {
                        console.error("Fetch not successful")
                    }
                    return undefined
                }

                return response.json().then(jsonResponse => {
                    return jsonResponse;
                }).catch(err => {
                    console.warn(response, err)
                })
            })
            .catch(err => {
                if (!silent) {
                    console.log({ success: false, text: err })
                    this.apiVersion = -1
                    window.dispatchEvent(new CustomEvent("apiVersionSet", { detail: { apiVersion: this.apiVersion } }))
                }
                return undefined
            });
    }
}
