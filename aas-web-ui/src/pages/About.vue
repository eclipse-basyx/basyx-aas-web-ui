<template>
    <v-container style="max-width: 800px">
        <h1>About</h1>

        <br /><br />

        <h2>Involved Organizations and Companies</h2>
        <v-row align="center" justify="center" class="mt-5">
            <v-col v-for="(company, index) in companies" :key="index" cols="6" md="3" sm="4" xs="6" class="pa-6">
                <!-- Desktop Mode: With Hover Effects -->
                <template v-if="!isMobile">
                    <v-hover v-slot="{ props: hoverProps, isHovering }">
                        <a :href="company.href" target="_blank" rel="noopener noreferrer">
                            <v-img
                                :src="getImageSrc(company)"
                                v-bind="hoverProps"
                                :style="{ filter: isHovering ? 'grayscale(0%)' : 'grayscale(100%)' }"
                                contain
                                :alt="company.altText">
                                <template #placeholder>
                                    <v-row class="fill-height ma-0" align="center" justify="center">
                                        <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
                                    </v-row>
                                </template>
                            </v-img>
                        </a>
                    </v-hover>
                </template>

                <!-- Mobile Mode: Static Image Without Hover -->
                <template v-else>
                    <a :href="company.href" target="_blank" rel="noopener noreferrer">
                        <v-img :src="getImageSrc(company)" contain :alt="company.altText">
                            <template #placeholder>
                                <v-row class="fill-height ma-0" align="center" justify="center">
                                    <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
                                </v-row>
                            </template>
                        </v-img>
                    </a>
                </template>
            </v-col>
        </v-row>

        <br /><br />

        <h2>Important Links</h2>
        <br />
        <v-list class="bg-background">
            <v-list-item>
                <template #prepend>
                    <v-avatar>
                        <v-icon>mdi-web</v-icon>
                    </v-avatar>
                </template>
                <v-list-item-title>The BaSyx Developers - Website ↗</v-list-item-title>
                <v-list-item-subtitle>
                    <a href="https://www.eclipse.org/basyx/" target="_blank" rel="noopener noreferrer">
                        https://www.eclipse.org/basyx/
                    </a>
                </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
                <template #prepend>
                    <v-avatar>
                        <v-icon>mdi-mail</v-icon>
                    </v-avatar>
                </template>
                <v-list-item-title>Send email to The BaSyx Developers</v-list-item-title>
                <v-list-item-subtitle>
                    <a href="mailto:basyx-dev@eclipse.org">basyx-dev@eclipse.org</a>
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <br /><br />

        <h2>Contributors</h2>
        <v-list item-props lines="three" class="bg-background">
            <template v-for="(contributor, index) in contributors" :key="index">
                <v-list-item>
                    <template #prepend>
                        <v-avatar>
                            <v-img :src="contributor.image" :alt="contributor.name"></v-img>
                        </v-avatar>
                    </template>
                    <template #append>
                        <a
                            v-if="contributor.github_link"
                            :href="contributor.github_link"
                            target="_blank"
                            rel="noopener noreferrer">
                            <v-icon>mdi-github</v-icon>
                        </a>
                        <v-icon v-else>mdi-blank</v-icon>
                        &nbsp;
                        <a
                            v-if="contributor.linkedin_link"
                            :href="contributor.linkedin_link"
                            target="_blank"
                            rel="noopener noreferrer">
                            <v-icon>mdi-linkedin</v-icon>
                        </a>
                        <v-icon v-else>mdi-blank</v-icon>
                    </template>
                    <v-list-item-title>{{ contributor.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                        {{ contributor.company }} &mdash;
                        <a :href="'mailto:' + contributor.email">{{ contributor.email }}</a>
                    </v-list-item-subtitle>
                </v-list-item>
                <v-divider v-if="index < contributors.length - 1" inset></v-divider>
            </template>
        </v-list>

        <br /><br />

        <h2>License</h2>
        <br />
        <v-card variant="outlined">
            <v-card-text>
                <p>MIT License</p>
                <br />
                <p>Copyright (c) {{ new Date().getFullYear() }} Eclipse BaSyx™</p>
                <br />
                <p>
                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
                    associated documentation files (the "Software"), to deal in the Software without restriction,
                    including without limitation the rights to use, copy, modify, merge, publish, distribute,
                    sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
                    furnished to do so, subject to the following conditions:
                </p>
                <br />
                <p>
                    The above copyright notice and this permission notice shall be included in all copies or substantial
                    portions of the Software.
                </p>
                <br />
                <p>
                    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
                    NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
                    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
                    OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
                    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                </p>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, reactive } from 'vue';
    import { useTheme } from 'vuetify';
    // Import company logos
    import ARENA2036LogoDark from '@/assets/Companies/ARENA2036_Logo_dark.svg';
    import ARENA2036LogoLight from '@/assets/Companies/ARENA2036_Logo_light.svg';
    import BaSyxLogo from '@/assets/Companies/BaSyx_Logo.svg';
    import DFKILogoDark from '@/assets/Companies/DFKI_Logo_dark.png';
    import DFKILogoLight from '@/assets/Companies/DFKI_Logo_light.png';
    import HARTINGLogoDark from '@/assets/Companies/HARTING_Logo_dark.png';
    import HARTINGLogoLight from '@/assets/Companies/HARTING_Logo_light.png';
    import HTWLogoDark from '@/assets/Companies/HTW_Logo_dark.svg';
    import HTWLogoLight from '@/assets/Companies/HTW_Logo_light.svg';
    import IDTALogo from '@/assets/Companies/IDTA_Logo.png';
    import IESELogoDark from '@/assets/Companies/IESE_Logo_dark.svg';
    import IESELogoLight from '@/assets/Companies/IESE_Logo_light.svg';
    // Import contributor images
    import Buettner from '@/assets/Contributors/Buettner.jpg';
    import Eicke from '@/assets/Contributors/Eicke.jpg';
    import Fischer from '@/assets/Contributors/Fischer.jpg';
    import Fried from '@/assets/Contributors/Fried.jpg';
    import Schnicke from '@/assets/Contributors/Schnicke.jpg';
    import Zielstorff from '@/assets/Contributors/Zielstorff.jpg';
    import { useNavigationStore } from '@/store/NavigationStore';

    const navigationStore = useNavigationStore();
    const theme = useTheme();

    const isDark = computed(() => theme.global.current.value.dark);
    const isMobile = computed(() => navigationStore.getIsMobile);

    // Helper function to determine the correct image source based on theme
    function getImageSrc(company: any): string {
        if (company.isDynamic) {
            return isDark.value ? company.srcDark : company.srcLight;
        }
        return company.srcStatic;
    }

    // Array of company objects with imported images
    const companies = reactive([
        {
            href: 'https://basyx.org/',
            isDynamic: false,
            srcStatic: BaSyxLogo,
            altText: 'BaSyx Logo',
        },
        {
            href: 'https://www.htw-berlin.de/',
            isDynamic: true,
            srcDark: HTWLogoDark,
            srcLight: HTWLogoLight,
            altText: 'HTW Berlin Logo',
        },
        {
            href: 'https://www.iese.fraunhofer.de/',
            isDynamic: true,
            srcDark: IESELogoDark,
            srcLight: IESELogoLight,
            altText: 'Fraunhofer IESE Logo',
        },
        {
            href: 'https://industrialdigitaltwin.org/',
            isDynamic: false,
            srcStatic: IDTALogo,
            altText: 'IDTA Logo',
        },
        {
            href: 'https://www.harting.com/',
            isDynamic: true,
            srcDark: HARTINGLogoDark,
            srcLight: HARTINGLogoLight,
            altText: 'HARTING Technology Group Logo',
        },
        {
            href: 'https://www.dfki.de/',
            isDynamic: true,
            srcDark: DFKILogoDark,
            srcLight: DFKILogoLight,
            altText: 'DFKI Logo',
        },
        {
            href: 'https://arena2036.de/',
            isDynamic: true,
            srcDark: ARENA2036LogoDark,
            srcLight: ARENA2036LogoLight,
            altText: 'ARENA2036 Logo',
        },
    ]);

    // Array of contributor objects with imported images
    const contributors = reactive([
        {
            name: 'Aaron Zielstorff',
            company: 'Fraunhofer IESE',
            email: 'aaron.zielstorff@iese.fraunhofer.de',
            image: Zielstorff,
            github_link: 'https://github.com/aaronzi',
            linkedin_link: 'https://www.linkedin.com/in/aaron-zielstorff',
        },
        {
            name: 'Frank Schnicke',
            company: 'Fraunhofer IESE',
            email: 'Frank.Schnicke@iese.fraunhofer.de',
            image: Schnicke,
            github_link: 'https://github.com/FrankSchnicke',
            linkedin_link: 'https://www.linkedin.com/in/frank-schnicke',
        },
        {
            name: 'Fiona Helena Büttner',
            company: 'Hochschule für Technik und Wirtschaft Berlin',
            email: 'Fiona.Buettner@student.htw-berlin.de',
            image: Buettner,
            github_link: 'https://github.com/fyo21103',
            linkedin_link: 'https://www.linkedin.com/in/fiona-helena-buettner',
        },
        {
            name: 'Rene Pascal Fischer',
            company: 'Fraunhofer IESE',
            email: 'Rene-Pascal.Fischer@iese.fraunhofer.de',
            image: Fischer,
            github_link: 'https://github.com/FischerRene',
            linkedin_link: 'https://www.linkedin.com/in/fischer-rene',
        },
        {
            name: 'Sebastian Eicke',
            company: 'HARTING Technology Group',
            email: 'Sebastian.Eicke@HARTING.com',
            image: Eicke,
            github_link: 'https://github.com/seicke',
            linkedin_link: 'https://www.linkedin.com/in/seicke',
        },
        {
            name: 'Jannik Oliver Fried',
            company: 'Fraunhofer IESE',
            email: 'Jannik.Fried@iese.fraunhofer.de',
            image: Fried,
            github_link: 'https://github.com/FriedJannik',
            linkedin_link: 'https://www.linkedin.com/in/friedjannik/',
        },
    ]);
</script>
