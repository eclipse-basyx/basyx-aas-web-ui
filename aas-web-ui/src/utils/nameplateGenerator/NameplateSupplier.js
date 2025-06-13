export default class NameplateSupplier {
    static CURRENT_IDSHORT = 'Nameplate';

    /**
     * Creates and returns an SVG element.
     * @param xSize is the width of the SVG element.
     * @param ySize is the height of the SVG element.
     * @param border (optional) boolean, which determines if the SVG element has a border or not
     * @param id (optional) id of the SVG element
     * @returns {SVGSVGElement} SVG element of given specifications
     */
    static initSvg(xSize, ySize, border, id, isQR, dom) {
        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        if (isQR) {
            svg.setAttribute('width', xSize);
            svg.setAttribute('height', ySize);
        } else {
            svg.setAttribute('viewBox', `0 0 ${xSize} ${ySize}`);
        }

        if (id) {
            svg.id = id;
        }
        if (border) {
            svg.style.borderStyle = 'solid';
            svg.style.borderWidth = '1px';
        }
        return svg;
    }

    /**
     * Appends the 'element' as a child to the DOM element with the given 'id'.
     * @param parent DOM element in which the given 'element' will be injected into
     * @param element element ot be injected
     */
    static appendToDocument(parent, element) {
        parent.appendChild(element);
    }

    /**
     * Turns data and markings into one string from which the QR-Code will be generated
     * @param data data according to README.md specification
     * @param markings markings according to README.md specification
     * @returns {string}
     */
    static nameplateContentObjectToString(data, markings) {
        const markingNames = this.extractMarkingNames(markings);
        const dataAndMarkings = Object.assign(data, markingNames);
        const entries = Object.entries(dataAndMarkings);
        let result = "";
        const idEntry = entries.find(entry => entry[0] === 'id');
        result += idEntry[1] + '\n';
        entries.forEach((entry) => {
            if (entry[0] === 'id') {
                return;
            }
            let entryString = "";
            const lineSeparator = "\n";
            entryString = entry[0] + ': ' + entry[1] + lineSeparator;
            result += entryString;
        });
        return result;
    }

    /**
     * Extracts the names of each marking.
     * @param markings markings according to README.md specification
     * @returns {*}
     */
    static extractMarkingNames(markings) {
        let data = structuredClone(markings);
        const keys = data ? Object.keys(data) : [];
        keys.forEach((key) => {
            if (data[key]['MarkingName']) {
                data[key] = data[key]['MarkingName'];
            }
        });
        return data;
    }

    /**
     * Writes the heading of the nameplate with idShort and ManufacturerProductDesignation. It removes those two key-value pairs
     * from data in the process.
     * @param data data according to README.md specification
     * @param nameplateSvg
     */
    static writeHeadingToSvg(data, nameplateSvg, dom) {
        const idShort_xSpace = 20;
        const idShort_ySpace = 35;
        const idShort_fontSize = 30;
        // TODO: find best maxChars for idShort
        const idShort_maxChars = 52;
        const MPD_xSpace = 20;
        const MPD_ySpace = 65;
        const MPD_fontSize = 20;
        // TODO: find best maxChars for MPD
        const MPD_maxChars = 100;

        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")

        const header = {};
        if (data['OrderCode'] && data['OrderCode'].length < idShort_maxChars) {
            header['OrderCode'] = data['OrderCode'];
            // this variable is used to name the download file
            this.CURRENT_IDSHORT = data['OrderCode'];
            delete data['OrderCode'];

            let newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            newText.setAttributeNS(null, 'x', idShort_xSpace + 'px');
            newText.setAttributeNS(null, 'y', idShort_ySpace + 'px');
            newText.setAttributeNS(null, 'font-size', idShort_fontSize + 'px');
            newText.setAttributeNS(null, 'font-weight', 'bold');

            let textNode = document.createTextNode(`${header['OrderCode']}`);
            newText.appendChild(textNode);
            nameplateSvg.appendChild(newText);
        }
        if (data['ManufacturerProductDesignation'] && data['ManufacturerProductDesignation'].length < MPD_maxChars) {
            header['ManufacturerProductDesignation'] = data['ManufacturerProductDesignation'];
            delete data['ManufacturerProductDesignation'];

            let newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            newText.setAttributeNS(null, 'x', MPD_xSpace + 'px');
            newText.setAttributeNS(null, 'y', MPD_ySpace + 'px');
            newText.setAttributeNS(null, 'font-size', MPD_fontSize + 'px');
            newText.setAttributeNS(null, 'font-style', 'italic');

            let textNode = document.createTextNode(`${header['ManufacturerProductDesignation']}`);
            newText.appendChild(textNode);
            nameplateSvg.appendChild(newText);
        }
    }

    /**
     * Writes key-value pairs onto the nameplateSvg. Can be configured through constants in function.
     * @param input data according to README.md specification
     * @param nameplateSvg the nameplate svg element
     */
    static writeTextToSvg(input, nameplateSvg, dom) {
        const data = structuredClone(input);
        const maxDisplay = 16;
        // TODO: richtige maximale anzahl an chars per line finden für Darstellung
        const maxCharsPerLine = 60;
        // following values are in pixels
        const fontSize = 17;
        const lineHeight = 25;
        const xSpace = 20;
        const ySpace = 105;

        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")

        const priorityDisplay = ['TelephoneNumber', 'EmailAddress', 'AddressOfAdditionalLink', 'AssetRef'];
        const displayWithoutIdentifier = ['id'];

        const keys = Object.keys(data).filter((key) => {
            let displayText = `${key}: ${data[key]}`;
            return ((displayText.length < maxCharsPerLine && !key.includes('Marking') && !key.includes('idShort')) || key.includes('Address'));
        });
        let svgNS = 'http://www.w3.org/2000/svg';
        let preCount = 0;

        // display address on top
        if (keys.includes('Address')) {
            const parts = data['Address'].split('\n');
            preCount = parts.length;
            parts.forEach((part, i) => {
                let newText = document.createElementNS(svgNS, 'text');
                newText.setAttributeNS(null, 'x', xSpace + 'px');
                newText.setAttributeNS(null, 'y', ySpace + lineHeight * i + 'px');
                newText.setAttributeNS(null, 'font-size', fontSize + 'px');

                let textNode = document.createTextNode(`${part}`);
                newText.appendChild(textNode);
                nameplateSvg.appendChild(newText);
            });
            delete data['Address'];
        }

        // display priority display
        priorityDisplay.forEach(display => {
            if (!data[display]) {
                return;
            }
            let newText = document.createElementNS(svgNS, 'text');
            newText.setAttributeNS(null, 'x', xSpace + 'px');
            newText.setAttributeNS(null, 'y', ySpace + lineHeight * preCount + 'px');
            newText.setAttributeNS(null, 'font-size', fontSize + 'px');

            let textNode = document.createTextNode(`${data[display]}`);
            delete data[display];
            newText.appendChild(textNode);
            nameplateSvg.appendChild(newText);
            preCount++;
        })

        preCount++;

        // display everything else
        for (let i = 0; i < maxDisplay && preCount < maxDisplay; i++) {
            if (!Boolean(keys[i]) || !Boolean(data[keys[i]])) {
                continue;
            }
            let newText = document.createElementNS(svgNS, 'text');
            newText.setAttributeNS(null, 'x', xSpace + 'px');
            newText.setAttributeNS(null, 'y', ySpace + lineHeight * preCount + 'px');
            newText.setAttributeNS(null, 'font-size', fontSize + 'px');

            let textNode;

            if (displayWithoutIdentifier.includes(keys[i])) {
                textNode = document.createTextNode(`${data[keys[i]]}`);
            } else {
                textNode = document.createTextNode(`${keys[i]}: ${data[keys[i]]}`);
            }
            newText.appendChild(textNode);
            nameplateSvg.appendChild(newText);
            preCount++;
        }
    }

    /**
     * Extracts the FilePath out of the concrete marking model, if it exists. The image is stored at that
     * given path. If the marking does not have a 'FilePath' attribute, then no image is displayed for the
     * marking and no entry in the results array will be made. Only the name of the marking will be stored
     * either written on the nameplate or in the qr Code.
     * @param markings markings according to README.md specification
     * @returns {*[]}
     */
    static extractFilePathsFromMarkings(markings) {
        const result = [];
        if (!markings) {
            markings = {};
        }
        Object.keys(markings).forEach((key) => {
            if (markings[key]['FilePath']) {
                result.push(markings[key]['FilePath']);
            }
        });
        return result;
    }

    /**
     * Transforms an array of links referring to images into their corresponding dataUrls. This function returns a Promise
     * since loading images is asynchronous.
     * @param links Array of links to all the marking images that shall be displayed on the nameplate
     * @returns {Promise<string[]>} Promise resolving to array of dataUrls of images
     */
    static convertFilePathsToDataUrls(links, dom) {
        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")
        return new Promise((resolve, reject) => {
            const promises = links.map((link) => {
                return new Promise((resolve) => {
                    const img = document.createElement('img');
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                        resolve(canvas.toDataURL());
                    };
                    img.onerror = () => {
                        resolve(null); // Resolves with null instead of rejecting.
                    };
                    img.src = link;
                });
            });

            Promise.all(promises).then((dataURLs) => {
                // Filter out any null values (failed images).
                const filteredDataURLs = dataURLs.filter((dataURL) => dataURL !== null);
                resolve(filteredDataURLs);
            });
        });
    }

    /**
     * Interface for extracting all images from the markings
     * @param markings markings according to README.md specification
     * @returns {Promise<string[]>} Promise resolving to array of dataUrls of images
     */
    static extractAllImagesFromMarkings(markings, dom) {
        const filePaths = this.extractFilePathsFromMarkings(markings);
        return this.convertFilePathsToDataUrls(filePaths, dom);
    }

    /**
     * Displays the markings on the nameplate SVG.
     * @param markingImages extracted FilePath values according to function extractImagesFromMarkings()
     * @param nameplateSvg the nameplate svg - markings are displayed on here
     */
    static displayMarkingImages(markingImages, nameplateSvg, dom) {
        const maxDisplay = 7;
        // following values are in pixels
        const height = 100;
        const width = 100;
        const xSpace = 20;
        const ySpace = 485;
        const space = 20;

        // const dom = new jsdom.JSDOM("<!DOCTYPE html><p>Placeholder</p>")

        const limit = markingImages.length < maxDisplay ? markingImages.length : maxDisplay;

        for (let i = 0; i < limit; i++) {
            let svgImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            svgImg.setAttributeNS(null, 'height', height + 'px');
            svgImg.setAttributeNS(null, 'width', width + 'px');
            svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', markingImages[i]);
            svgImg.setAttributeNS(null, 'x', xSpace + (width + space) * i + 'px');
            svgImg.setAttributeNS(null, 'y', ySpace + 'px');
            svgImg.setAttributeNS(null, 'visibility', 'visible');
            nameplateSvg.appendChild(svgImg);
        }
    }

}