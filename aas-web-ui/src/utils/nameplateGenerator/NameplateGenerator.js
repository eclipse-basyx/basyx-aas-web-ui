import DataTransformer from './DataTransformer.js';
import NameplateSupplier from './NameplateSupplier.js';

import QRCode from 'qrcode';

export default class NameplateGenerator {
    static nameplateWidth = 920;
    static nameplateHeight = 600;

    static nameplateBootstrap(rawData, id, dom) {
        //console.log("RAWDATA: " + JSON.stringify(rawData))
        // raw data according to README.md specification
        // const rawData = getData(i);
        rawData = this.filterObject(rawData)
        //console.log("RAWDATA: " + JSON.stringify(rawData))
        // data and markings according to README.md specification
        // data is according to "Reduced Data"
        let data = {}, markings = {};
        ({ obj: data, markings } = DataTransformer.transformDataToArray(rawData));
        console.log("DATEN:" + JSON.stringify(data))
        // generates the nameplate and injects it into 'id'
        
        return this.generateNameplate(data, markings, id, dom).innerHTML;
    }

    /**
     * Generates the nameplate from the given data and markings and injects the resulting SVG into the DOM element with the
     * given ID.
     * @param data All the key-value pairs out of the asset WITHOUT the markings.
     * @param markings All Marking-Data as it is retrieved from the asset.
     * @param id ID of the DOM element into which the nameplate will be injected.
     */
    static generateNameplate(data, markings, id, dom) {
        // following values are in pixels
        console.log("DATA: " + data)
        const qrCodeSize = 400;
        const qrCodeOffsetX = 500;
        const qrCodeOffsetY = 85;
        console.log(dom)
        //const dom = dom.createElement('div')
        //dom.id = 'testNR1'; // Setze die ID des Elements
        //dom.innerHTML = 'Placeholder'; // Füge den Platzhaltertext hinzu

        // this is the root svg in which the nameplate is build
        // TODO: Disable border again
        const nameplateSvg = NameplateSupplier.initSvg(this.nameplateWidth, this.nameplateHeight, true, 'nameplateSvg', false, dom);

        // this transforms the data & markings into one single string with linebreaks ('\n')
        // this is the content of the qr-code
        const qrCodeString = NameplateSupplier.nameplateContentObjectToString(data, markings);

        // this svg warps around the qr-code svg
        // it is mainly used for styling and positioning
        // make sure, that this svg is square, otherwise positioning will be off!!!
        const qrCodeSvg = NameplateSupplier.initSvg(qrCodeSize + 'px', qrCodeSize + 'px', false, 'qrCodeSvg', true, dom);
        // these two attributes manage the offset inside the 'nameplateSvg' from the top-left corner
        qrCodeSvg.setAttribute('x', qrCodeOffsetX + 'px');
        qrCodeSvg.setAttribute('y', qrCodeOffsetY + 'px');

        // takes all key-value pairs from data and writes them into the given svg
        NameplateSupplier.writeHeadingToSvg(data, nameplateSvg, dom);
        NameplateSupplier.writeTextToSvg(data, nameplateSvg, dom);

        // extracts the FilePaths from the markings
        // this is where the images are stored
        // const markingImages = extractFilePathsFromMarkings(markings);
        NameplateSupplier.extractAllImagesFromMarkings(markings, dom).then((markingImages) => {
            // displays the markings on the nameplate (svg)
            NameplateSupplier.displayMarkingImages(markingImages, nameplateSvg, dom);
        });

        //creates the border around the qr-code
        const border = this.createBorderForQRCode(dom);

        // the svg's are appended to the DOM before the qr-code is created, because the 'makeQrCode()' function needs to find
        // the svg-elements by 'dom.getElementById()'
        let domElement = dom.getElementById(id);
        domElement.innerHTML = '';
        NameplateSupplier.appendToDocument(domElement, nameplateSvg);
        NameplateSupplier.appendToDocument(nameplateSvg, qrCodeSvg);
        NameplateSupplier.appendToDocument(nameplateSvg, border);

        // makes the qr-code svg and injects it into the 'qrCodeSvg' element
        // the qr-code svg will be wrapped by the 'qrCodeSvg', which is mainly used for styling

        this.makeQrCode(qrCodeString, qrCodeSvg);
        return domElement;
    }

    /**
     * Makes a QR-Code. The content of the QR-Code is specified in 'text'. The QR-Code SVG element is injected into the
     * element with the given 'id'. Make sure, that the element with the chosen ID is already in the DOM.
     * @param text Content of QR-Code
     * @param element Element in DOM, in which the QR-Code SVG will be injected.
     */
    static makeQrCode(text, element) {
        const settings = {
            type: "svg",
            errorCorrectionLevel: 'M',
            margin: 6
        }
        QRCode.toString(text, settings, (error, string) => {
            if (error) {
                throw error;
            }
            element.innerHTML = string;
        })
    }

    static returnQrCodeOnly(text) {
        let qrCode;
        const settings = {
            type: "svg",
            errorCorrectionLevel: 'M',
            margin: 6
        }
        QRCode.toString(text, settings, (error, string) => {
            if (error) {
                throw error;
            }
            qrCode = string;
        })
        return qrCode;
    }

    static createBorderForQRCode(dom) {
        const qrCodeSize = 400;
        const qrCodeOffsetX = 500;
        const qrCodeOffsetY = 85;
        const strokeWidth = 6;
        const svgns = "http://www.w3.org/2000/svg"; // SVG namespace
        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")
        const parent = dom.createElementNS(svgns, "svg");
        const rect = dom.createElementNS(svgns, "rect");
        rect.setAttribute("x", `${strokeWidth / 2}`);
        rect.setAttribute("y", `${strokeWidth / 2}`);
        rect.setAttribute("width", `${qrCodeSize - strokeWidth}`);
        rect.setAttribute("height", `${qrCodeSize - strokeWidth}`);
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", `${strokeWidth}`);
        rect.setAttribute("fill", "none");
        parent.appendChild(rect);
        parent.setAttribute("x", `${qrCodeOffsetX}`);
        parent.setAttribute("y", `${qrCodeOffsetY}`);
        const whiteWidth = 100;
        const whiteHeight = 20;
        const whiteBlock = dom.createElementNS(svgns, "rect");
        whiteBlock.setAttribute("width", `${whiteWidth}`);
        whiteBlock.setAttribute("height", `${whiteHeight}`);
        whiteBlock.setAttribute("x", `${qrCodeSize / 2 - whiteWidth / 2}`);
        whiteBlock.setAttribute("y", `${qrCodeSize - whiteHeight + 1}`);
        whiteBlock.setAttribute('fill', 'white');
        parent.appendChild(whiteBlock);
        const text = 'IEC 63365';
        const margin = 15;
        const iecText = dom.createElementNS(svgns, "text");
        iecText.textContent = text;
        iecText.setAttribute('x', `${qrCodeSize / 2 - whiteWidth / 2 + margin}`);
        iecText.setAttribute('y', `${qrCodeSize + 5}`);
        iecText.setAttribute('font-size', '16');
        parent.appendChild(iecText);
        return parent;
    }

    /**
     * Starts the download of the nameplate with svg file format
     */
    static downloadSvg(dom) {
        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")
        const nameplateSvg = dom.getElementById('nameplateSvg');
        const nameplateCopy = nameplateSvg.cloneNode(true);
        NameplateGenerator.prepareNameplateForDownload(nameplateCopy)
        NameplateGenerator.downloadPlate('svg', NameplateSupplier.CURRENT_IDSHORT, nameplateCopy, null, null, dom);
    }

    /**
     * Starts the download of the nameplate with png file format
     */
    static downloadPng(dom) {
        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")
        const nameplateSvg = dom.getElementById('nameplateSvg');
        const nameplateCopy = nameplateSvg.cloneNode(true);
        NameplateGenerator.prepareNameplateForDownload(nameplateCopy)
        const height = parseInt(nameplateCopy.getAttribute('height'));
        const width = parseInt(nameplateCopy.getAttribute('width'));
        NameplateGenerator.downloadPlate('png', NameplateSupplier.CURRENT_IDSHORT, nameplateCopy, width, height, dom);
    }

    /**
     * Prepares the given SVG for download; removes some attributes and styles which were used for display in the UI
     * @param svg svg to prepare
     */
    static prepareNameplateForDownload(svg) {
        svg.removeAttribute('viewBox');
        svg.setAttribute('width', this.nameplateWidth);
        svg.setAttribute('height', this.nameplateHeight);
        svg.style.borderStyle = 'none';
    }

    /**
     * Initializes download with 'a' tag
     * @param data DataURL to download
     * @param name Name of download file
     */
    static startDownload(data, name, dom) {
        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")
        const a = dom.createElement('a');
        a.href = data;
        a.download = name
        a.click();
    }

    /**
     * Download interface
     * @param type 'svg'|'png'
     * @param name Name of download file
     * @param nameplateSvg SVG element of nameplate which is downloaded
     * @param PNG_width Width of final PNG
     * @param PNG_height Height of final PNG
     */
    static downloadPlate(type, name, nameplateSvg, PNG_width, PNG_height, dom) {
        switch (type) {
            case 'svg':
                let svgDataUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(new XMLSerializer().serializeToString(nameplateSvg));
                NameplateGenerator.startDownload(svgDataUrl, name + '.svg', dom);
                break;
            case 'png':
                this.createPNG(PNG_width, PNG_height, nameplateSvg, name, NameplateGenerator.startDownload, dom);
                break;
            default:
                console.error(`Type ${type} not supported.`);
        }
    }

    /**
     * Converts SVG to PNG DataURL
     * @param width Width of final PNG
     * @param height Height of final PNG
     * @param contents SVG element to transform
     * @param name Name of download file
     * @param callback Reference to the actual downloading function startDownload()
     */
    static createPNG(width, height, contents, name, callback, dom) {
        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")
        const src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(new XMLSerializer().serializeToString(contents));

        const canvas = dom.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);

        context.fillStyle = 'rgb(255,255,255)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();

        img.onload = function () {
            context.drawImage(img, 0, 0);
            callback(canvas.toDataURL('image/png'), name + '.png', dom);
            canvas.remove();
        };
        img.setAttribute('src', src);
    }

    static filterObject(obj) {
        const filteredObj = {};
        for (const key in obj) {
            if (!obj.hasOwnProperty(key) || typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                if (key === 'Nameplate') {
                    filteredObj[key] = obj[key];
                }
                continue;
            }
            if (typeof obj[key] !== 'object') {
                filteredObj[key] = obj[key];
            }
        }
        return filteredObj;
    }

}