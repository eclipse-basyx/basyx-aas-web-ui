module.exports = class DataExtractor {

    langPreferences = ["de", "en"]

    constructor(nameplate) {
        this.nameplate = nameplate;
    }

    extractAllDataV1(baseUrl, nameplate = this.nameplate, path = "",currentCollection=null) {
        let returnObject = {}
        //console.log("loading data for submodelElementCollection")
        //console.log(nameplate)
        for (const nameplateElement of nameplate) {
            switch (nameplateElement.modelType.name) {
                case "MultiLanguageProperty":
                    returnObject[nameplateElement.idShort] = this.getLangStringValue(nameplateElement.value)
                    break;
                case "SubmodelElementCollection":
                    if (nameplateElement.idShort.match(/(?!Markings)[Mm]arking[\-\w]*/ug)) {
                        let markings
                        if(currentCollection==="Markings"){
                            markings = returnObject;
                        }else if(!returnObject.Markings){
                            markings = returnObject["Markings"] = {};
                        }else{
                            markings = returnObject.Markings
                        }
                        markings[nameplateElement.idShort] = this.extractAllDataV1(baseUrl, nameplateElement.value, path + (path.length > 0 ? "." : "") + nameplateElement.idShort, nameplateElement.idShort)
                        if (!("MarkingName" in markings[nameplateElement.idShort])) markings[nameplateElement.idShort]["MarkingName"] = nameplateElement.idShort
                    } else {
                        returnObject[nameplateElement.idShort] = this.extractAllDataV1(baseUrl, nameplateElement.value, path + (path.length > 0 ? "." : "") + nameplateElement.idShort, nameplateElement.idShort)
                    }
                    break;
                case "Property":
                    returnObject[nameplateElement.idShort] = nameplateElement.value
                    break;
                case "File":
                    //returnObject["FilePath"] = baseUrl + "/" + path + "." + nameplateElement.idShort + "/attachment"
                    returnObject[nameplateElement.idShort] = nameplateElement.value
                    break;
            }
        }
        //console.log("-----")
        return returnObject
    }

    extractAllDataV3(baseUrl, nameplate = this.nameplate, path = "",currentCollection=null) {
        let returnObject = {}
        //console.log("loading data for submodelElementCollection")
        //console.log(nameplate)
        for (const nameplateElement of nameplate) {
            switch (nameplateElement.modelType) {
                case "MultiLanguageProperty":
                    returnObject[nameplateElement.idShort] = this.getLangStringValue(nameplateElement.value)
                    break;
                case "SubmodelElementCollection":
                    if (nameplateElement.idShort.match(/(?!Markings)[Mm]arking[\-\w]*/ug)) {
                        let markings
                        if(currentCollection==="Markings"){
                            markings = returnObject;
                        }else if(!returnObject.Markings){
                            markings = returnObject["Markings"] = {};
                        }else{
                            markings = returnObject.Markings
                        }
                        markings[nameplateElement.idShort] = this.extractAllDataV3(baseUrl, nameplateElement.value, path + (path.length > 0 ? "." : "") + nameplateElement.idShort, nameplateElement.idShort)
                        if (!("MarkingName" in markings[nameplateElement.idShort])) markings[nameplateElement.idShort]["MarkingName"] = nameplateElement.idShort
                    } else {
                        returnObject[nameplateElement.idShort] = this.extractAllDataV3(baseUrl, nameplateElement.value, path + (path.length > 0 ? "." : "") + nameplateElement.idShort, nameplateElement.idShort)
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
        //console.log("-----")
        return returnObject
    }

    getLangStringValue(json) {
        let langStrings
        if ("langStrings" in json) {
            langStrings = json.langStrings
        } else if ("langString" in json) { //Not to spec but seen in some assets
            langStrings = json.langString
        } else {
            langStrings = json
        }
        for (let langPref of this.langPreferences) {
            for (let langString of langStrings) {
                if (langString.language === langPref) {
                    return langString.text
                }
            }
        }
        if(langStrings.length>0){
            return langStrings[0].text
        }
    }
}