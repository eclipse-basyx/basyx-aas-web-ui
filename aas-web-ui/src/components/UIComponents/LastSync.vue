<template>
    <v-container class="pa-0" fluid>
        <v-list class="py-0">
            <v-list-item>
                <v-list-item-subtitle>
                    <span class="text-caption">
                        <v-icon size="small" light>mdi-autorenew</v-icon>
                        {{ 'Last sync:' }}
                    </span>
                    <span
                        class="text-caption ml-2"
                        :class="timestamp === 'no sync' ? 'text-error' : 'text-subtitleText'"
                        >{{ timestamp }}</span
                    >
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>
    </v-container>
</template>

<script lang="ts" setup>
    defineProps({
        timestamp: {
            type: String,
            default: 'no sync',
        },
    });
</script>
