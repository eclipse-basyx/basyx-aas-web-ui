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
import { mdi } from 'vuetify/iconsets/mdi';
import { VFileUpload } from 'vuetify/labs/VFileUpload';
import { customIcons } from '@/assets/Icons/customIcons';
import { adjustColorBrightness } from '@/utils/ThemeUtils';

export function initializeVuetify(primaryLightColor: string, primaryDarkColor: string) {
    // Default colors if not provided
    primaryLightColor = primaryLightColor || '#0cb2f0';
    primaryDarkColor = primaryDarkColor || '#F69222';

    // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
    const vuetify = createVuetify({
        components: {
            VFileUpload,
        },
        icons: {
            defaultSet: 'mdi',
            sets: {
                mdi,
                custom: customIcons,
            },
        },
        theme: {
            themes: {
                light: {
                    dark: false,
                    colors: {
                        primary: primaryLightColor,
                        primarySurface: adjustColorBrightness(primaryLightColor, 0.5),
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
                        listItem: '#ABABAB',
                        hover: '#242424',
                        buttonText: '#FFFFFF',
                        divider: '#E0E0E0',
                        listItemText: '#000000',
                        subtitleText: '#626262',
                        normalText: '#000000',
                        lamp: '#7A7A7A',
                        tableHeader: '#EBEBEB',
                        tableOdd: '#F5F5F5',
                        tableEven: '#FAFAFA',
                        invertedButton: '#121212',
                        lightButton: '#5E5E5E',
                        icon: '#7A7A7A',
                        titleText: '#212121',
                    },
                },
                dark: {
                    dark: true,
                    colors: {
                        primary: primaryDarkColor,
                        primarySurface: adjustColorBrightness(primaryDarkColor, -0.5),
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
                        listItem: '#727272',
                        hover: '#E2E2E2',
                        buttonText: '#272727',
                        divider: '#2F2F2F',
                        listItemText: '#FFFFFF',
                        subtitleText: '#A5A5A5',
                        normalText: '#FFFFFF',
                        lamp: '#959595',
                        tableHeader: '#313131',
                        tableOdd: '#272727',
                        tableEven: '#212121',
                        invertedButton: '#F0F0F0',
                        lightButton: '#AFAFAF',
                        icon: '#BDBDBD',
                        titleText: '#FFFFFF',
                    },
                },
            },
        },
    });
    return vuetify;
}
