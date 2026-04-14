const http = require("http")
const fs = require("fs/promises")
const NameplateGenerator = require("../NameplateGeneration/NameplateGenerator")
const DataRefinery = require("../DataRetrival/DataRefinery")
const port = 8080

const server = http.createServer(async (req, res) => {
    // CORS Header für Browser-Zugriff
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    const route = req.url.replace(/^\/|\/$/g, '')
    const split_route = route.split("?")
    
    console.log("\n--- Request erhalten: " + split_route[0] + " ---");

    switch (split_route[0]) {
        case 'testNameplate':
            try {
                const data = await fs.readFile(__dirname + "/test.json");
                const nameplate = NameplateGenerator.nameplateBootstrap(JSON.parse(data), "test-static")
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(nameplate.outerHTML);
            } catch (err) {
                res.statusCode = 500;
                res.end("Fehler beim Test-Rendering.");
            }
            break;

        case "NameplateGenerateByReference":
            if (req.method === "GET") {
                try {
                    const targetServer = split_route[1];
                    const targetId = split_route[2];
                    const fullPath = targetServer + "/" + targetId;

                    console.log("Abfrage an Docker:", fullPath);
                    const response = await fetch(fullPath);
                    if (!response.ok) throw new Error(`Docker-Fehler: ${response.status}`);

                    const rawData = await response.json();
                    let processedData;

                    // V3 Submodell-Konvertierung
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
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.end(nameplate.outerHTML);
                } catch (error) {
                    console.error("Fehler:", error.message);
                    res.statusCode = 500;
                    res.end("Generator-Fehler: " + error.message);
                }
            }
            break;

        default:
            res.statusCode = 404;
            res.end("Route nicht gefunden.");
    }
});

server.listen(port, () => console.log('Generator läuft auf Port ' + port));