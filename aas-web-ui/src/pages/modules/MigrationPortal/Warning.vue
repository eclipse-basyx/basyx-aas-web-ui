<template>
    <v-dialog v-model="dialog" persistent max-width="800" style="font-family: 'Courier New', Courier, monospace">
        <v-card>
            <v-card-title><span class="text-primary">IMPORTANT:</span> READ BEFORE USE (scroll to bottom)</v-card-title>
            <v-divider />
            <v-card-text
                ref="scrollContainer"
                class="mx-4 mt-4"
                style="overflow-y: auto; max-height: 400px"
                :style="{
                    boxShadow:
                        [
                            showTopShadow ? 'inset 0 10px 10px -10px rgba(0, 0, 0, 0.5)' : '',
                            showBottomShadow ? 'inset 0 -10px 10px -10px rgba(0, 0, 0, 0.5)' : '',
                        ]
                            .filter((s) => s)
                            .join(', ') || 'none',
                }"
                @scroll="handleScroll">
                <p>
                    Welcome to the Eclipse BaSyx Migration Portal! This tool is designed to facilitate the migration of
                    Asset Administration Shells (AAS) and their associated Submodels from one AAS environment to
                    another. Please read the following important information before proceeding:
                </p>
                <br />
                <p>
                    <strong class="text-primary">Data Integrity:</strong> Ensure that you have backed up your data
                    before initiating the migration process. While the tool is designed to preserve data integrity,
                    unforeseen issues may arise.
                </p>
                <br />
                <p>
                    <strong class="text-primary">Compatibility:</strong> Verify that the source and destination AAS
                    environments are compatible with the migration tool. Incompatibilities may lead to data loss or
                    corruption.
                </p>
                <br />
                <p>
                    <strong class="text-primary">Network Stability:</strong> A stable network connection is crucial
                    during the migration process. Interruptions may result in incomplete migrations.
                </p>
                <br />
                <p>
                    <strong class="text-primary">Authentication:</strong> Ensure that you have the necessary credentials
                    to access both the source and destination AAS environments.
                </p>
                <br />
                <p>
                    <strong class="text-primary">Testing:</strong> It is recommended to perform a test migration with a
                    small dataset before executing a full-scale migration.
                </p>
                <br />
                <p>
                    By proceeding with the migration, you acknowledge that you have read and understood the above
                    information and accept any associated risks. The developers of this tool are not responsible for any
                    data loss or issues that may arise during the migration process.
                </p>
                <p>If you have any questions or need assistance, please contact our support team.</p>
                <v-divider class="mt-4" />
                <!-- i acknowledge checkbox-->
                <v-checkbox
                    v-model="acknowledged"
                    label="I have read and understood the above information."
                    class="ml-n3" />
            </v-card-text>
            <v-card-actions>
                <span v-show="!acknowledged" class="text-error mb-2 ml-2"
                    >You have to acknowledge the information before proceeding.</span
                >
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="tonal" :disabled="!acknowledged" @click="dialog = false"
                    >I Understand the risks and want to proceed</v-btn
                >
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';

    const acknowledged = ref<boolean>(false);
    const scrollContainer = ref<HTMLElement | null>(null);
    const showTopShadow = ref<boolean>(false);
    const showBottomShadow = ref<boolean>(true);
    const dialog = ref<boolean>(true);

    // Watch model value to set dialog
    const props = defineProps({
        modelValue: { type: Boolean, required: true },
    });

    watch(
        () => props.modelValue,
        (newVal) => {
            dialog.value = newVal;
        },
        { immediate: true }
    );

    function handleScroll(event: Event): void {
        const target = event.target as HTMLElement;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 1;
        const isAtTop = target.scrollTop <= 1;
        showTopShadow.value = !isAtTop;
        showBottomShadow.value = !isAtBottom;
    }
</script>
