<template>
    <v-snackbar v-model="snackbar.status" :color="snackbar.color" :timeout="snackbar.timeout" location="top">
        <v-card v-if="snackbar.status === true && snackbar.baseError">
            <v-card-title class="text-subtitle-2">{{ snackbar.baseError }}</v-card-title>
            <v-divider></v-divider>
            <v-card-text style="max-height: 200px; overflow-y: auto; max-width: 590px">
                <pre class="text-subtitleText text-caption">{{ snackbar.extendedError }}</pre>
            </v-card-text>
        </v-card>
        <span v-else class="text-buttonText">{{ snackbar.text }}</span>
        <template #actions>
            <v-btn
                v-if="snackbar.actionText && snackbar.actionCallback"
                variant="outlined"
                color="card"
                size="small"
                class="mr-2"
                @click="handleAction">
                {{ snackbar.actionText }}
            </v-btn>
            <v-btn :color="snackbar.btnColor" variant="plain" @click="closeSnackbar()">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </template>
    </v-snackbar>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    const navStore = useNavigationStore();

    const snackbar = computed(() => navStore.getSnackbar);

    function closeSnackbar(): void {
        navStore.dispatchSnackbar({
            status: false,
        });
    }

    async function handleAction(): Promise<void> {
        if (snackbar.value.actionCallback) {
            await snackbar.value.actionCallback();
        }
    }
</script>
