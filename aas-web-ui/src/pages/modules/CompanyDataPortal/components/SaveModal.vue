<template>
    <v-dialog v-model="dialog" max-width="500px" persistent>
        <v-card>
            <v-card-title>Save AAS</v-card-title>
            <v-card-text>
                <v-combobox
                    v-model="serverUrl"
                    :items="serverOptions"
                    label="AAS Environment URL"
                    required
                    density="compact"
                    variant="outlined"
                    :rules="[(v) => !!v || 'Server URL is required']"></v-combobox>
                <v-text-field
                    v-model="aasId"
                    label="AAS ID"
                    required
                    density="compact"
                    variant="outlined"
                    :rules="[(v) => !!v || 'AAS ID is required']"></v-text-field>
                <v-text-field
                    v-model="smId"
                    label="Submodel ID Prefix"
                    required
                    density="compact"
                    variant="outlined"
                    :rules="[(v) => !!v || 'Submodel ID Prefix is required']"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-btn color="error" variant="tonal" @click="close">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="tonal" @click="execSave">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { useNavigationStore } from '@/store/NavigationStore';

    const dialog = ref(false);
    const aasId = ref('');
    const smId = ref('');
    const serverUrl = ref('');
    const serverOptions = ref<string[]>([]);

    const navStore = useNavigationStore();

    const aasRepoURL = computed(() => navStore.getAASRepoURL);

    watch(
        aasRepoURL,
        (newVal) => {
            serverOptions.value.push(newVal);
        },
        { immediate: true }
    );

    const props = defineProps<{
        save: (aasId: string, smId: string, serverUrl: string) => void;
        closeDialog: () => void;
        showDialog: boolean;
    }>();

    watch(
        () => props.showDialog,
        (newVal) => {
            dialog.value = newVal;
        }
    );

    function open(): void {
        dialog.value = true;
    }

    function close(): void {
        dialog.value = false;
        aasId.value = '';
        serverUrl.value = '';
        serverOptions.value = [];
        props.closeDialog();
    }

    function execSave(): void {
        if (aasId.value && serverUrl.value) {
            props.save(aasId.value, smId.value, serverUrl.value);
            close();
        } else {
            alert('Please fill in all required fields.');
        }
    }

    defineExpose({
        open,
    });
</script>
