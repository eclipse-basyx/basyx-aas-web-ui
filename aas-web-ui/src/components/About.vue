<template>
    <v-container style="max-width: 800px">
        <h1>About</h1>

        <br /><br />

        <h2>Involved Organizations and Companies</h2>
        <v-sheet class="mt-5 pa-5" theme="dark" rounded>
            <v-row align="center" justify="center">
                <v-col cols="3" class="pa-6">
                    <a href="https://basyx.org/" target="_blank">
                        <v-img src="Basyx_Logo.svg">
                            <template #sources>
                                <source srcset="@/assets/BaSyx_Logo.svg" />
                            </template>
                        </v-img>
                    </a>
                </v-col>
                <v-col cols="3" class="pa-6">
                    <a href="https://www.htw-berlin.de/" target="_blank">
                        <v-img src="HTW_Logo.png">
                            <template #sources>
                                <source srcset="@/assets/HTW_Logo.png" />
                            </template>
                        </v-img>
                    </a>
                </v-col>
                <v-col cols="3" class="pa-6">
                    <a href="https://www.iese.fraunhofer.de/" target="_blank">
                        <v-img src="IESE_Logo.svg">
                            <template #sources>
                                <source srcset="@/assets/IESE_Logo.svg" />
                            </template>
                        </v-img>
                    </a>
                </v-col>
                <v-col cols="3" class="pa-6">
                    <a href="https://industrialdigitaltwin.org/" target="_blank">
                        <v-img src="IDTA_Logo.png">
                            <template #sources>
                                <source srcset="@/assets/IDTA_Logo.png" />
                            </template>
                        </v-img>
                    </a>
                </v-col>
            </v-row>
            <v-row align="center" justify="center">
                <v-col cols="3" class="pa-6">
                    <a href="https://www.harting.com/" target="_blank">
                        <v-img src="HARTING_Logo.png">
                            <template #sources>
                                <source srcset="@/assets/HARTING_Logo.png" />
                            </template>
                        </v-img>
                    </a>
                </v-col>
                <v-col cols="3" class="pa-6">
                    <a href="https://www.dfki.de/" target="_blank">
                        <template v-if="isDark">
                            <v-img src="DFKI_Logo_dark.png">
                                <template #sources>
                                    <source srcset="@/assets/DFKI_Logo_dark.png" />
                                </template>
                            </v-img>
                        </template>
                        <template v-else>
                            <v-img src="DFKI_Logo_light.png">
                                <template #sources>
                                    <source srcset="@/assets/DFKI_Logo_light.png" />
                                </template>
                            </v-img>
                        </template>
                    </a>
                </v-col>
                <v-col cols="3" class="pa-6">
                    <a href="https://arena2036.de/" target="_blank">
                        <template v-if="isDark">
                            <v-img src="ARENA2036_Logo_dark.png">
                                <template #sources>
                                    <source srcset="@/assets/ARENA2036_Logo_dark.png" />
                                </template>
                            </v-img>
                        </template>
                        <template v-else>
                            <v-img src="ARENA2036_Logo_light.png">
                                <template #sources>
                                    <source srcset="@/assets/ARENA2036_Logo_light.png" />
                                </template>
                            </v-img>
                        </template>
                    </a>
                </v-col>
            </v-row>
        </v-sheet>

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
                <v-list-item-subtitle
                    ><a href="https://www.eclipse.org/basyx/" target="_blank"
                        >https://www.eclipse.org/basyx/</a
                    ></v-list-item-subtitle
                >
            </v-list-item>
            <v-list-item>
                <template #prepend>
                    <v-avatar>
                        <v-icon>mdi-mail</v-icon>
                    </v-avatar>
                </template>
                <v-list-item-title>Send email to The BaSyx Developers</v-list-item-title>
                <v-list-item-subtitle
                    ><a href="mailto:basyx-dev@eclipse.org">basyx-dev@eclipse.org</a></v-list-item-subtitle
                >
            </v-list-item>
        </v-list>

        <br /><br />

        <h2>Contributors</h2>
        <v-list item-props lines="three" class="bg-background">
            <template v-for="(contributor, index) in contributors" :key="index">
                <v-list-item>
                    <template #prepend>
                        <v-avatar>
                            <v-img :src="getImageUrl(contributor.image)"></v-img>
                        </v-avatar>
                    </template>
                    <template #append>
                        <a v-if="contributor?.github_link" :href="contributor.github_link" target="_blank">
                            <v-icon>mdi-github</v-icon>
                        </a>
                        <v-icon v-else>mdi-blank</v-icon>
                        &nbsp;
                        <a v-if="contributor?.linkedin_link" :href="contributor.linkedin_link" target="_blank">
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

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';

    export default defineComponent({
        name: 'About',

        setup() {
            const theme = useTheme();

            return {
                theme, // Theme Object
            };
        },

        data() {
            return {
                contributors: [
                    {
                        name: 'Aaron Zielstorff',
                        company: 'Fraunhofer IESE',
                        email: 'aaron.zielstorff@iese.fraunhofer.de',
                        image: 'Zielstorff.jpg',
                        github_link: 'https://github.com/aaronzi',
                        linkedin_link: 'https://www.linkedin.com/in/aaron-zielstorff',
                    },
                    {
                        name: 'Frank Schnicke',
                        company: 'Fraunhofer IESE',
                        email: 'Frank.Schnicke@iese.fraunhofer.de',
                        image: 'Schnicke.jpg',
                        github_link: 'https://github.com/FrankSchnicke',
                        linkedin_link: 'https://www.linkedin.com/in/frank-schnicke',
                    },
                    {
                        name: 'Fiona Helena Büttner',
                        company: 'Hochschule für Technik und Wirtschaft Berlin',
                        email: 'Fiona.Buettner@student.htw-berlin.de',
                        image: 'Buettner.jpg',
                        github_link: 'https://github.com/fyo21103',
                        linkedin_link: 'https://www.linkedin.com/in/fiona-helena-buettner',
                    },
                    {
                        name: 'Rene Pascal Fischer',
                        company: 'Fraunhofer IESE',
                        email: 'Rene-Pascal.Fischer@iese.fraunhofer.de',
                        image: 'Fischer.jpg',
                        github_link: 'https://github.com/FischerRene',
                        linkedin_link: 'https://www.linkedin.com/in/fischer-rene',
                    },
                    {
                        name: 'Sebastian Eicke',
                        company: 'HARTING Technology Group',
                        email: 'Sebastian.Eicke@HARTING.com',
                        image: 'Eicke.jpg',
                        github_link: 'https://github.com/seicke',
                        linkedin_link: 'https://www.linkedin.com/in/seicke',
                    },
                ] as Array<any>,
            };
        },

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
        },

        methods: {
            getImageUrl(imageName: string) {
                return new URL(`../assets/Contributors/${imageName}`, import.meta.url).href;
            },
        },
    });
</script>
