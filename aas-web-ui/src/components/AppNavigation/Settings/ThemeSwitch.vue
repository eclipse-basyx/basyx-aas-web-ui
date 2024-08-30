<template>
    <v-list-item>
        <v-list-item>
            <v-list-item-title class="text-subtitle-2"> Theme </v-list-item-title>
        </v-list-item>
        <!-- Button toggle to switch theme -->
        <v-btn-toggle v-model="themeOption" color="primary" style="margin-top: -10px" variant="outlined" divided>
            <v-btn @click="toggleTheme" value="system">
                <span>System</span>
                <v-icon class="ml-2">mdi-desktop-tower-monitor</v-icon>
            </v-btn>
            <v-btn @click="toggleTheme" value="light">
                <span>Light</span>
                <v-icon class="ml-2">mdi-white-balance-sunny</v-icon>
            </v-btn>
            <v-btn @click="toggleTheme" value="dark">
                <span>Dark</span>
                <v-icon class="ml-2">mdi-weather-night</v-icon>
            </v-btn>
        </v-btn-toggle>
    </v-list-item>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useTheme } from 'vuetify';

    export default defineComponent({
        name: 'ThemeSwitch',

        setup() {
            const theme = useTheme();

            return {
                theme, // Theme Object
            };
        },

        data() {
            return {
                themeOption: 'system', // Variable to store the current Theme option: 'system', 'light' or 'dark
                dark: false, // Variable reflecting the current Theme
            };
        },

        mounted() {
            this.dark = this.isDark;
            // get the theme preference from local storage
            this.themeOption = localStorage.getItem('theme') || 'system';
        },

        computed: {
            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },
        },

        methods: {
            // Function to toggle between dark and light Theme
            toggleTheme() {
                if (this.themeOption == 'dark') {
                    this.theme.global.name.value = 'dark';
                } else if (this.themeOption == 'system') {
                    // sets the Theme according to the Users preferred Theme
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        this.theme.global.name.value = 'dark';
                    } else {
                        this.theme.global.name.value = 'light';
                    }
                } else {
                    this.theme.global.name.value = 'light';
                }
                // save theme preference in local storage
                localStorage.setItem('theme', this.themeOption);
            },
        },
    });
</script>
