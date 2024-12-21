/**
 * plugins/webfontloader.ts
 *
 * webfontloader documentation: https://github.com/typekit/webfontloader
 */

export async function loadFonts() {
    const webFontLoader = await import(/* webpackChunkName: "webfontloader" */ 'webfontloader');

    webFontLoader.load({
        custom: {
            families: ['Roboto'], // Specify the font family name
            urls: ['/fonts/stylesheet.css'], // Path to the stylesheet (adjust as needed)
        },
    });
}
