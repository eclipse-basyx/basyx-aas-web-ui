<template>
    <v-container style="max-width: 800px">
        <h1>About</h1>

        <br /><br />

        <h2>Involved Organizations and Companies</h2>
        <v-sheet class="mt-5" theme="light" rounded>
            <v-row align="center" justify="center">
                <v-col cols="4" class="pa-6">
                    <v-img src="Basyx_Logo.svg">
                        <template #sources>
                            <source srcset="@/assets/BaSyx_Logo.svg" />
                        </template>
                    </v-img>
                </v-col>
                <v-col cols="4" class="pa-6">
                    <v-img src="HTW_Logo.png">
                        <template #sources>
                            <source srcset="@/assets/HTW_Logo.png" />
                        </template>
                    </v-img>
                </v-col>
                <v-col cols="4" class="pa-6">
                    <v-img src="IESE_Logo.svg">
                        <template #sources>
                            <source srcset="@/assets/IESE_Logo.svg" />
                        </template>
                    </v-img>
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
            <v-list-item>
                <template #prepend>
                    <v-avatar>
                        <v-img src="Zielstorff.jpg">
                            <template #sources>
                                <source srcset="@/assets/Contributors/Zielstorff.jpg" />
                            </template>
                        </v-img>
                    </v-avatar>
                </template>
                <v-list-item-title>Aaron Zielstorff</v-list-item-title>
                <v-list-item-subtitle
                    >Hochschule für Technik und Wirtschaft Berlin &mdash;
                    <a href="mailto:Aaron.Zielstorff@htw-berlin.de"
                        >Aaron.Zielstorff@htw-berlin.de</a
                    ></v-list-item-subtitle
                >
            </v-list-item>
            <v-divider inset></v-divider>
            <v-list-item>
                <template #prepend>
                    <v-avatar>
                        <v-img src="Schnicke.jpg">
                            <template #sources>
                                <source srcset="@/assets/Contributors/Schnicke.jpg" />
                            </template>
                        </v-img>
                    </v-avatar>
                </template>
                <v-list-item-title>Frank Schnicke</v-list-item-title>
                <v-list-item-subtitle
                    >Fraunhofer IESE &mdash;
                    <a href="mailto:Frank.Schnicke@iese.fraunhofer.de"
                        >Frank.Schnicke@iese.fraunhofer.de</a
                    ></v-list-item-subtitle
                >
            </v-list-item>
            <v-divider inset></v-divider>
            <v-list-item>
                <template #prepend>
                    <v-avatar>
                        <v-img src="Buettner.jpg">
                            <template #sources>
                                <source srcset="@/assets/Contributors/Buettner.jpg" />
                            </template>
                        </v-img>
                    </v-avatar>
                </template>
                <v-list-item-title>Fiona Helena Büttner</v-list-item-title>
                <v-list-item-subtitle
                    >Hochschule für Technik und Wirtschaft Berlin &mdash;
                    <a href="mailto:Fiona.Buettner@student.htw-berlin.de"
                        >Fiona.Buettner@student.htw-berlin.de</a
                    ></v-list-item-subtitle
                >
            </v-list-item>
            <v-divider inset></v-divider>
            <v-list-item>
                <template #prepend>
                    <v-avatar>
                        <v-img src="Fischer.jpg">
                            <template #sources>
                                <source srcset="@/assets/Contributors/Fischer.jpg" />
                            </template>
                        </v-img>
                    </v-avatar>
                </template>
                <v-list-item-title>Rene Pascal Fischer</v-list-item-title>
                <v-list-item-subtitle
                    >Fraunhofer IESE &mdash;
                    <a href="mailto:Rene-Pascal.Fischer@iese.fraunhofer.de"
                        >Rene-Pascal.Fischer@iese.fraunhofer.de</a
                    ></v-list-item-subtitle
                >
            </v-list-item>
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

    export default defineComponent({
        name: 'About',
    });
</script>
