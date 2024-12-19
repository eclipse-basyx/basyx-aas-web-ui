<template>
    <v-list-item>
        <v-list-item>
            <v-list-item-title class="text-subtitle-2"> Theme </v-list-item-title>
        </v-list-item>
        <!-- Button toggle to switch theme -->
        <v-btn-toggle v-model="themeOption" color="primary" style="margin-top: -10px" variant="outlined" divided>
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
            theme.global.name.value = 'dark';
        } else if (themeOption.value === 'system') {
            // sets the Theme according to the Users preferred Theme
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                theme.global.name.value = 'dark';
            } else {
                theme.global.name.value = 'light';
            }
        } else {
            theme.global.name.value = 'light';
        }
        // save theme preference in local storage
        localStorage.setItem('theme', themeOption.value);
    }
</script>
