const DataExtractor = require("./DataExtractor")
const { addressShellList, submodelPathsV1, submodelPathsV3 } = require("./API")


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

    async getAPIVersion() {
        return new Promise((resolve) => {
            if (this.apiVersion) resolve(this.apiVersion)
            window.addEventListener("apiVersionSet", function mylistener(event) {
                window.removeEventListener("apiVerionSet", mylistener)
                resolve(event.detail.apiVersion)
            })
        })
    }

    async test() {
        console.log("2")
    }


    async getData(aasid) {
        console.log("6")

        return this.#getDataFromServer(this.serverAddress + aasid)
            .then(response => {
                if (!response || (Object.hasOwn(response, 'success/') && !response.success)) {
                    throw new Error(this.serverAddress + aasid)
                }
                console.log("5")
                return response.map((obj, index) => {
                    let assetId = obj["identification"] ? obj["identification"]["id"] : obj["id"]
                    let submodels = []
                    if (obj["submodels"]) {
                        submodels = obj["submodels"].map((submodelReference) => {
                            return new Promise(async (resolve, reject) => {
                                if (submodelReference["keys"].length === 0) {
                                    return reject("No Reference");
                                }
                                let submodelReferenceId = submodelReference["keys"][0]["value"]

                                let apiVersion = this.analyzeApiVersion(submodelReference)

                                let submodelPaths
                                if (apiVersion === 3) {
                                    submodelPaths = submodelPathsV3(assetId, submodelReferenceId)
                                } else {
                                    submodelPaths = submodelPathsV1(assetId, submodelReferenceId)
                                }
                                let submodelData = {}
                                let tryCount = 1
                                for (const submodelPath of submodelPaths) {
                                    submodelData = await this.#getDataFromServer(this.serverAddress + submodelPath.submodel, true)
                                        .then((result) => {
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
                                resolve(submodelData)
                            })
                        })
                    }
                    let assetObject = {
                        "idShort": obj["idShort"],
                        "id": assetId,
                        "num": index,
                        "productImages": []
                    }
                    let assetRef = this.loadAssetRef(obj)
                    if (assetRef) {
                        assetObject.AssetRef = assetRef
                    }


                    submodels.map((submodel) => {
                        if (!submodel) return
                        submodel.then((res) => Object.keys(res).map((key) => {
                            if (!(key in assetObject)) assetObject[key] = res[key]
                            if (key === "TechnicalData") assetObject["productImages"] = this.searchForKey(res[key], /[pP]roductImage\d*/)
                            window.dispatchEvent(new Event("forceUpdate"))
                        })).catch(() => {

                        })
                    });

                    return assetObject
                })
            })
    }

    async getFullAASList() {
        return this.#getDataFromServer(this.serverAddress + addressShellList())
            .then(response => {
                if (!response || (Object.hasOwn(response, 'success/') && !response.success)) {
                    throw new Error(this.serverAddress + addressShellList())
                }
                return response.map((obj, index) => {
                    let assetId = obj["identification"] ? obj["identification"]["id"] : obj["id"]
                    let submodels = []
                    if (obj["submodels"]) {
                        submodels = obj["submodels"].map((submodelReference) => {
                            return new Promise(async (resolve, reject) => {
                                if (submodelReference["keys"].length === 0) {
                                    return reject("No Reference");
                                }
                                let submodelReferenceId = submodelReference["keys"][0]["value"]

                                let apiVersion = this.analyzeApiVersion(submodelReference)

                                let submodelPaths
                                if (apiVersion === 3) {
                                    submodelPaths = submodelPathsV3(assetId, submodelReferenceId)
                                } else {
                                    submodelPaths = submodelPathsV1(assetId, submodelReferenceId)
                                }
                                let submodelData = {}
                                let tryCount = 1
                                for (const submodelPath of submodelPaths) {
                                    submodelData = await this.#getDataFromServer(this.serverAddress + submodelPath.submodel, true)
                                        .then((result) => {
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
                                resolve(submodelData)
                            })
                        })
                    }
                    let assetObject = {
                        "idShort": obj["idShort"],
                        "id": assetId,
                        "num": index,
                        "productImages": []
                    }
                    let assetRef = this.loadAssetRef(obj)
                    if (assetRef) {
                        assetObject.AssetRef = assetRef
                    }


                    submodels.map((submodel) => {
                        if (!submodel) return
                        submodel.then((res) => Object.keys(res).map((key) => {
                            if (!(key in assetObject)) assetObject[key] = res[key]
                            if (key === "TechnicalData") assetObject["productImages"] = this.searchForKey(res[key], /[pP]roductImage\d*/)
                            window.dispatchEvent(new Event("forceUpdate"))
                        })).catch(() => {

                        })
                    });

                    return assetObject
                })
            })
    }

    /**
     * Recursively searches the json for any keys that match the regex and gets all files in that location
     * @param json Object that shall be searched
     * @param regex Regex to search for keys
     * @returns {*[]} Array of all the file paths
     */
    searchForKey(json, regex) {
        let returnList = []
        if (typeof json === "object") {
            for (let key in json) {
                if (regex.test(key) && json["FilePath"]) {
                    returnList.push(json["FilePath"]);
                }
                returnList = returnList.concat(this.searchForKey(json[key], regex));
            }
        }
        return returnList;
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
        window.dispatchEvent(new CustomEvent("apiVersionSet", { detail: { apiVersion: this.apiVersion } }))
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
