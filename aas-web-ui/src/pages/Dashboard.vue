<template>
    <v-container style="max-width: 1500px">
        <v-card>
            <v-card-title>Available Dashboards</v-card-title>
            <v-divider></v-divider>
            <v-card-text v-if="groups.length > 0">
                <v-list>
                    <v-list-item
                        v-for="group in groups"
                        :key="group.groupId"
                        rounded
                        class="mb-1"
                        variant="tonal"
                        @click="openDashboard(group)">
                        <v-list-item-title>{{ group.groupName }}</v-list-item-title>
                        <v-list-item-subtitle>Number of widgets: {{ group.elementCount }}</v-list-item-subtitle>
                        <template #append>
                            <v-btn
                                icon="mdi-delete"
                                density="compact"
                                variant="plain"
                                @click.stop="openDeleteDialog(group)"></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-text v-else class="text-subtitleText text-center">No elements available</v-card-text>
        </v-card>
        <!-- Dialog for deleting a group -->
        <v-dialog v-model="deleteDialog" width="550px">
            <v-card>
                <v-form v-model="form" @submit.prevent>
                    <v-card-title>{{ 'Are you sure?' }}</v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <div class="text-subtitleText">
                            Careful! You are about to delete the whole
                            <strong class="text-normalText"> {{ selectedGroup.groupName }} '</strong> Dashboard.
                        </div>
                        <div class="mt-3 mb-2">Type the Dashboard Name to proceed.</div>
                        <v-text-field
                            v-model="selectedGroupInput"
                            label="Dashboard Name"
                            variant="outlined"
                            density="compact"
                            hide-details
                            :rules="deleteRules"></v-text-field>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn @click="deleteDialog = false">{{ 'cancel' }}</v-btn>
                        <v-btn
                            variant="flat"
                            class="text-buttonText"
                            color="error"
                            type="submit"
                            :disabled="!form"
                            @click="deleteGroupFromDashboard(groups, selectedGroup.groupId)"
                            >{{ 'delete' }}</v-btn
                        >
                    </v-card-actions>
                </v-form>
            </v-card>
        </v-dialog>
    </v-container>
</template>

// TODO Transfer to composition API
<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRouter } from 'vue-router';
    import DashboardHandling from '@/mixins/DashboardHandling';
    import { useEnvStore } from '@/store/EnvironmentStore';
    import { useNavigationStore } from '@/store/NavigationStore';

    export default defineComponent({
        name: 'DashboardGroups',
        mixins: [DashboardHandling],

        setup() {
            const router = useRouter();
            const envStore = useEnvStore();
            const navigationStore = useNavigationStore();

            return {
                navigationStore, // NavigationStore Object
                envStore, // EnvironmentStore Object
                router, // Router Object
            };
        },

        data() {
            return {
                groups: [] as Array<any>,
                groupElements: [] as Array<any>,
                deleteDialog: false,
                selectedGroup: {} as any,
                selectedGroupInput: '',
                form: false,
            };
        },

        computed: {
            deleteRules() {
                return [
                    (v: any) => !!v || 'Name is required',
                    (v: any) => v === this.selectedGroup.groupName || 'Name does not match',
                ];
            },
        },

        async mounted() {
            this.groups = await this.getGroups();
        },

        methods: {
            openDashboard(group: any) {
                // console.log('Group: ', group);
                this.router.push({ name: 'DashboardGroup', query: { group: group.groupId } });
            },

            openDeleteDialog(group: any) {
                this.selectedGroup = group;
                this.deleteDialog = true;
            },

            async deleteGroupFromDashboard(groups: any, groupId: any) {
                this.groups = await this.deleteGroup(groups, groupId);
                this.deleteDialog = false;
                this.selectedGroupInput = '';
            },
        },
    });
</script>
