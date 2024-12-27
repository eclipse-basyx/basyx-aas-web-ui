<template>
    <v-tooltip open-delay="600" location="end">
        <template #activator="{ props }">
            <v-list-item v-if="newAAS" slim v-bind="props" @click="editAASDialog = true">
                <template #prepend>
                    <v-icon size="small">mdi-plus</v-icon>
                </template>
                Create AAS
            </v-list-item>
            <v-list-item v-else @click="editAASDialog = true">
                <template #prepend>
                    <v-icon size="x-small">mdi-pencil</v-icon>
                </template>
                <v-list-item-subtitle>Edit AAS</v-list-item-subtitle>
            </v-list-item>
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
    import { types as aasTypes } from '@aas-core-works/aas-core3.0-typescript';
    import { onMounted, ref } from 'vue';

    const props = defineProps<{
        newAAS: boolean;
    }>();

    const editAASDialog = ref(false);
    const AASObject = ref<aasTypes.AssetAdministrationShell | undefined>(undefined);

    onMounted(() => {
        if (props.newAAS) {
            AASObject.value = new aasTypes.AssetAdministrationShell();
        }
    });
</script>
