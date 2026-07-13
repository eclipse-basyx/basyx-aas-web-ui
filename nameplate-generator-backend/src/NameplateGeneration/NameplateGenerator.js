const DataTransformer = require("./DataTransformer")
const NameplateSupplier = require("./NameplateSupplier")
const jsdom = require("jsdom")
const QRCode = require('qrcode');

module.exports = class NameplateGenerator {
    static nameplateWidth = 920;
    static nameplateHeight = 600;

    static nameplateBootstrap(rawData, id) {
        let filteredData = {};
        for (const key in rawData) {
            if (typeof rawData[key] !== 'object' || key === 'Nameplate') {
                filteredData[key] = rawData[key];
            }
        }
        
        let data = {}, markings = {};
        try {
            const transformed = DataTransformer.transformDataToArray(filteredData);
            data = transformed.obj;
            markings = transformed.markings;
        } catch (e) {
            console.error("Transform Error:", e);
            data = filteredData;
        }

        return this.generateNameplate(data, markings, id);
    }

    static generateNameplate(data, markings, id) {
        const qrCodeSize = 400;
        const qrCodeOffsetX = 500;
        const qrCodeOffsetY = 85;

        const dom = new jsdom.JSDOM(`<!DOCTYPE html><div id="${id}"></div>`);
        const document = dom.window.document;

        // 1. Root SVG
        const nameplateSvg = NameplateSupplier.initSvg(this.nameplateWidth, this.nameplateHeight, true, 'nameplateSvg', false, dom);

        // 2. QR-Code Inhalt (ID statt Riesen-JSON)
        const qrContent = data.qrCodeValue || data.id || "AAS-ID";

        // 3. QR-Code Container SVG
        const qrContainer = NameplateSupplier.initSvg(qrCodeSize + 'px', qrCodeSize + 'px', false, 'qrCodeSvg', true, dom);
        qrContainer.setAttribute('x', qrCodeOffsetX + 'px');
        qrContainer.setAttribute('y', qrCodeOffsetY + 'px');

        // 4. Texte schreiben
        NameplateSupplier.writeHeadingToSvg(data, nameplateSvg, dom);
        NameplateSupplier.writeTextToSvg(data, nameplateSvg, dom);

        // 5. Bilder (Markings)
        NameplateSupplier.extractAllImagesFromMarkings(markings, dom).then((images) => {
            if (images && images.length > 0) {
                NameplateSupplier.displayMarkingImages(images, nameplateSvg, dom);
            }
        });

        // 6. Rahmen für QR-Code
        const border = this.createBorderForQRCode(dom);
        
        // Montage
        const rootDiv = document.getElementById(id);
        rootDiv.appendChild(nameplateSvg);
        nameplateSvg.appendChild(qrContainer);
        nameplateSvg.appendChild(border); // Hier war der Fehler - jetzt sicher!

        // QR-Code generieren
        const settings = { type: "svg", errorCorrectionLevel: 'M', margin: 4 };
        QRCode.toString(String(qrContent), settings, (err, svgString) => {
            if (!err) qrContainer.innerHTML = svgString;
        });

        return rootDiv;
    }

    static createBorderForQRCode(dom) {
        const svgns = "http://www.w3.org/2000/svg";
        const g = dom.window.document.createElementNS(svgns, "g");
        const rect = dom.window.document.createElementNS(svgns, "rect");
        rect.setAttribute("x", "500");
        rect.setAttribute("y", "85");
        rect.setAttribute("width", "400");
        rect.setAttribute("height", "400");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "6");
        rect.setAttribute("fill", "none");
        g.appendChild(rect);
        
        const text = dom.window.document.createElementNS(svgns, "text");
        text.textContent = 'IEC 63365';
        text.setAttribute('x', '650');
        text.setAttribute('y', '495');
        text.setAttribute('font-size', '16');
        g.appendChild(text);
        
        return g;
    }
}