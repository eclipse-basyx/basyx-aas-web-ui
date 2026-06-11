



const myRequest = new Request("https://v3.admin-shell-io.com/submodels/d3d3LmNvbXBhbnkuY29tL2lkcy9zbS80MzQzXzUwNzJfNzA5MV8zMjQy");

fetch(myRequest)
    .then((response) => {
        console.log("response.url =", response.url); // response.url = https://mdn.github.io/dom-examples/fetch/fetch-response/flowers.jpg
        console.log("hier")
        console.log(response.body)

    })

fetch("https://v3.admin-shell-io.com/submodels/d3d3LmNvbXBhbnkuY29tL2lkcy9zbS80MzQzXzUwNzJfNzA5MV8zMjQy")
    .then(response => {
        if (!response.ok) {
            if (!silent) {
                console.error("Fetch not successful")
            }
            return undefined
        }

        return response.json().then(jsonResponse => {
            console.log("json Response")
            console.log(jsonResponse)

            let ab = extractAllDataV3("https://v3.admin-shell-io.com/submodels/d3d3LmNvbXBhbnkuY29tL2lkcy9zbS80MzQzXzUwNzJfNzA5MV8zMjQy", jsonResponse["submodelElements"])
            console.log("result")
            console.log(ab)
            let returnData = {}
            console.log("test1")

            returnData = {
                ...returnData,
                [submodelName]: {
                    idShort: submodelName,
                    id: submodelID,
                    semanticId: this.loadSemanticID(submodelDataElement),
                    ...extractedSubmodelData
                }
            }
            console.log(returnData)
            console.log("True")
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





async function extractAllDataV3(baseUrl, nameplate = this.nameplate, path = "", currentCollection = null) {


    let returnObject = {}
    console.log("loading data for submodelElementCollection")
    //console.log(nameplate)
    for (const nameplateElement of nameplate) {
        console.log("1")
        switch (nameplateElement.modelType) {
            case "MultiLanguageProperty":
                returnObject[nameplateElement.idShort] = this.getLangStringValue(nameplateElement.value)
                break;
            case "SubmodelElementCollection":
                if (nameplateElement.idShort.match(/(?!Markings)[Mm]arking[\-\w]*/ug)) {
                    let markings
                    if (currentCollection === "Markings") {
                        markings = returnObject;
                    } else if (!returnObject.Markings) {
                        markings = returnObject["Markings"] = {};
                    } else {
                        markings = returnObject.Markings
                    }
                    markings[nameplateElement.idShort] = extractAllDataV3(baseUrl, nameplateElement.value, path + (path.length > 0 ? "." : "") + nameplateElement.idShort, nameplateElement.idShort)
                    if (!("MarkingName" in markings[nameplateElement.idShort])) markings[nameplateElement.idShort]["MarkingName"] = nameplateElement.idShort
                } else {
                    returnObject[nameplateElement.idShort] = extractAllDataV3(baseUrl, nameplateElement.value, path + (path.length > 0 ? "." : "") + nameplateElement.idShort, nameplateElement.idShort)
                }
                break;
            case "Property":
                returnObject[nameplateElement.idShort] = nameplateElement.value
                break;
            case "File":
                returnObject["FilePath"] = baseUrl + "/" + path + "." + nameplateElement.idShort + "/attachment"
                returnObject[nameplateElement.idShort] = nameplateElement.value
                break;
        }
    }
    console.log("-----")
    console.log(returnObject)
    return returnObject
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