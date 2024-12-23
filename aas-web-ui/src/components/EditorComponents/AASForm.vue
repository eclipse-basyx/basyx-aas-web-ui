<template>
    <v-tooltip open-delay="600" location="end">
        <template #activator="{ props }">
            <v-list-item v-if="newAAS" slim v-bind="props" @click="editAASDialog = true">
                <template #prepend>
                    <v-icon size="small">mdi-plus</v-icon>
                </template>
                Create AAS
            </v-list-item>
            <v-btn v-else icon="mdi-pencil" variant="plain" v-bind="props" @click="editAASDialog = true"></v-btn>
        </template>
        <span>Creat a new AAS</span>
    </v-tooltip>
    <v-dialog v-model="editAASDialog" width="600">
        <v-card>
            <v-card-title>
                <span class="text-subtile-1">{{ newAAS ? 'Create a new AAS' : 'Edit AAS' }}</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text></v-card-text>
            <v-divider></v-divider>
            <v-card-actions></v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';

    const editAASDialog = ref(false);
    const newAAS = ref(true);
</script>
