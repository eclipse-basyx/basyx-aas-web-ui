/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Composables
import { createVuetify } from 'vuetify';

export function initializeVuetify(primaryColor: string) {
    // check if primary color is set
    if (!primaryColor) {
        primaryColor = '#0cb2f0';
    }

    // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
    const vuetify = createVuetify({
        theme: {
            themes: {
                light: {
                    dark: false,
                    colors: {
                        primary: primaryColor,
                        background: '#FFFFFF',
                        appBar: '#F5F5F5',
                        navigationMenu: '#FFFFFF',
                        navigationMenuSecondary: '#FAFAFA',
                        appNavigation: '#FFFFFF',
                        card: '#FFFFFF',
                        cardDialog: '#F0F0F0',
                        cardHeader: '#FFFFFF',
                        elevatedCard: '#F1F1F1',
                        detailsCard: '#FBFBFB',
                        detailsHeader: '#F5F5F5',
                        listItem: '#F5F5F5',
                        hover: '#242424',
                        buttonText: '#FFFFFF',
                        divider: '#E0E0E0',
                        subtitleText: '#626262',
                        normalText: '#000000',
                        lamp: '#7A7A7A',
                        tableOdd: '#F5F5F5',
                        tableEven: '#FAFAFA',
                        invertedButton: '#121212',
                        lightButton: '#5E5E5E',
                    },
                },
                dark: {
                    dark: true,
                    colors: {
                        primary: primaryColor,
                        background: '#121212',
                        appBar: '#1E1E1E',
                        navigationMenu: '#1E1E1E',
                        navigationMenuSecondary: '#121212',
                        appNavigation: '#121212',
                        card: '#121212',
                        cardDialog: '#202020',
                        cardHeader: '#282828',
                        elevatedCard: '#343434',
                        detailsCard: '#181818',
                        detailsHeader: '#151515',
                        listItem: '#1E1E1E',
                        hover: '#E2E2E2',
                        buttonText: '#272727',
                        divider: '#2F2F2F',
                        subtitleText: '#A5A5A5',
                        normalText: '#FFFFFF',
                        lamp: '#959595',
                        tableOdd: '#272727',
                        tableEven: '#212121',
                        invertedButton: '#F0F0F0',
                        lightButton: '#AFAFAF',
                    },
                },
            },
        },
    });
    return vuetify;
}
