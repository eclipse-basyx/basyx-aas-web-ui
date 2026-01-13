<template>
    <v-container class="px-2 pt-2 pb-0">
        <v-list-subheader>Theme</v-list-subheader>
        <v-list-item class="px-0 py-0">
            <!-- Button toggle to switch theme -->
            <v-btn-toggle
                v-model="themeOption"
                color="primary"
                style="margin-top: -10px"
                variant="outlined"
                divided
                mandatory
                class="mt-2">
                <v-btn value="system" @click="toggleTheme">
                    <span>System</span>
                    <v-icon class="ml-2">mdi-desktop-tower-monitor</v-icon>
                </v-btn>
                <v-btn value="light" @click="toggleTheme">
                    <span>Light</span>
                    <v-icon class="ml-2">mdi-white-balance-sunny</v-icon>
                </v-btn>
                <v-btn value="dark" @click="toggleTheme">
                    <span>Dark</span>
                    <v-icon class="ml-2">mdi-weather-night</v-icon>
                </v-btn>
            </v-btn-toggle>
        </v-list-item>
    </v-container>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useTheme } from 'vuetify';

    const theme = useTheme();

    const themeOption = ref('system'); // Variable to store the current Theme option: 'system', 'light' or 'dark
    const dark = ref(false); // Variable reflecting the current Theme

    const isDark = computed(() => theme.global.current.value.dark);

    onMounted(() => {
        dark.value = isDark.value;
        // get the theme preference from local storage
        themeOption.value = localStorage.getItem('theme') || 'system';
    });

    function toggleTheme() {
        if (themeOption.value === 'dark') {
            theme.change('dark');
        } else if (themeOption.value === 'system') {
            // sets the Theme according to the Users preferred Theme
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                theme.change('dark');
            } else {
                theme.change('light');
            }
        } else {
            theme.change('light');
        }
        // save theme preference in local storage
        localStorage.setItem('theme', themeOption.value);
    }
</script>
