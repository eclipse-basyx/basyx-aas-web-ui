const http = require("http");
const fs = require("fs/promises");
const NameplateGenerator = require("../NameplateGeneration/NameplateGenerator");
const DataRefinery = require("../DataRetrival/DataRefinery");
const port = 8080;

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    const route = req.url.replace(/^\/|\/$/g, '');
    const split_route = route.split("?");
    
    if (split_route[0] === "NameplateGenerateByReference") {
        try {
            const targetServer = split_route[1];
            const targetId = split_route[2];
            const fullPath = targetServer + "/" + targetId;

            const response = await fetch(fullPath);
            if (!response.ok) throw new Error(`Repository-Fehler: ${response.status}`);

            const rawData = await response.json();
            let processedData;

            if (rawData.submodelElements) {
                const elements = {};
                rawData.submodelElements.forEach(el => {
                    if (el.value !== undefined) {
                        elements[el.idShort] = Array.isArray(el.value) ? el.value[0].text : el.value;
                    }
                });

                processedData = {
                    "id": rawData.id || targetId,
                    "idShort": rawData.idShort,
                    "qrCodeValue": rawData.id || targetId, 
                    [rawData.idShort || "Nameplate"]: {
                        ...elements,
                        "idShort": rawData.idShort,
                        "Markings": rawData.submodelElements.find(e => e.idShort === "Markings") || {}
                    }
                };
            } else {
                const refinery = new DataRefinery(targetServer);
                processedData = await refinery.getData(targetId);
            }

            const nameplate = NameplateGenerator.nameplateBootstrap(processedData, "AAS-V3");

            const bridgeScript = `
            <script>
                window.addEventListener('message', function(event) {
                    if (event.data === 'trigger-svg-download') {
                        const svg = document.querySelector('svg');
                        if (!svg) return;
                        const serializer = new XMLSerializer();
                        let source = serializer.serializeToString(svg);
                        if(!source.match(/^<svg[^>]+xmlns="http\\:\\/\\/www\\.w3\\.org\\/2000\\/svg"/)){
                            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
                        }
                        source = '<?xml version="1.0" standalone="no"?>\\r\\n' + source;
                        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "Nameplate_Export.svg";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });
            </script>`;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(nameplate.outerHTML + bridgeScript);
        } catch (error) {
            res.statusCode = 500;
            res.end("Fehler: " + error.message);
        }
    }
});

server.listen(port, () => console.log('Backend auf Port ' + port));