<template>
    <v-container class="pa-md-6" fluid>
        <v-card class="pa-4" border>
            <v-row>
                <v-col cols="12" md="3">
                    <v-card border class="pa-4" height="100%" rounded="lg" elevation="4" color="surface">
                        <v-sheet elevation="2" class="pa-4 mb-2" rounded="lg" border="thin primary">
                            <div class="text-h6 font-weight-medium d-flex justify-center align-center">
                                <v-icon class="mr-4">mdi-account-group</v-icon>Company Data Portal
                            </div>
                        </v-sheet>
                        <v-list
                            active-class="border-thin border-primary border-opacity-25"
                            bg-color="transparent"
                            class="pa-0 ga-2 d-flex flex-column"
                            color="primary"
                            density="comfortable"
                            slim>
                            <v-list-item
                                v-for="(item, i) in settings"
                                :key="i"
                                border="thin surface"
                                :prepend-icon="item.icon"
                                rounded="lg"
                                :subtitle="item.subtitle"
                                :title="item.title"
                                :value="i"
                                style="cursor: default; user-select: none"
                                :active="model === i" />
                        </v-list>
                    </v-card>
                </v-col>

                <v-col cols="12" md="9">
                    <v-card border class="pa-4" flat rounded="lg">
                        <v-sheet border rounded="lg" class="px-6 pt-4 pb-5 mx-4" elevation="4">
                            <v-row>
                                <v-col cols="4" class="d-flex align-center">
                                    <v-btn
                                        v-if="model > 0"
                                        class="text-buttonText"
                                        color="primary"
                                        icon="mdi-arrow-left"
                                        text
                                        @click="model--">
                                        <v-icon>mdi-arrow-left</v-icon>
                                    </v-btn>
                                </v-col>
                                <v-col cols="4" class="d-flex justify-center align-center">
                                    <div>
                                        <div class="text-h6 font-weight-bold">{{ settings[model].title }}</div>
                                        <div class="text-body-2 text-medium-emphasis">
                                            {{ settings[model].subtitle }}
                                        </div>
                                    </div>
                                </v-col>
                                <v-col cols="4" class="d-flex justify-end align-center">
                                    <v-btn
                                        v-if="settings[model].addBtn"
                                        class="text-buttonText"
                                        color="primary"
                                        prepend-icon="mdi-plus"
                                        text="Add New"
                                        @click="add" />
                                </v-col>
                            </v-row>
                        </v-sheet>
                        <!-- Content for {{ settings[model].title }} -->
                        <CompanyIdentification
                            v-show="model === 0"
                            :next="() => model++"
                            :prev="() => model--"
                            :is-active-component="model === 0" />
                        <BankAccounts
                            v-show="model === 1"
                            ref="bankAccountsRef"
                            :next="() => model++"
                            :prev="() => model--"
                            :is-active-component="model === 1" />
                        <DigitalInterfaces
                            v-show="model === 2"
                            :next="() => model++"
                            :prev="() => model--"
                            :is-active-component="model === 2" />
                        <BusinessReportFigures
                            v-show="model === 3"
                            ref="businessReportFiguresRef"
                            :next="() => model++"
                            :prev="() => model--"
                            :is-active-component="model === 3" />
                        <CompanyGovernance
                            v-show="model === 4"
                            :prev="() => model--"
                            :is-active-component="model === 4" />
                    </v-card>
                </v-col>
            </v-row>
        </v-card>
    </v-container>
    <v-btn
        style="position: fixed; bottom: 64px; right: 16px; z-index: 999999999"
        icon="mdi-arrow-up"
        @click="scrollToTop"></v-btn>
</template>

<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import BankAccounts from './CompanyDataPortal/BankAccounts.vue';
    import BusinessReportFigures from './CompanyDataPortal/BusinessReportFigures.vue';
    import CompanyGovernance from './CompanyDataPortal/CompanyGovernance.vue';
    import CompanyIdentification from './CompanyDataPortal/CompanyIdentification.vue';
    import DigitalInterfaces from './CompanyDataPortal/DigitalInterfaces.vue';
    defineOptions({
        inheritAttrs: false,
        isDesktopModule: true,
        isMobileModule: false,
    });

    const model = ref(0);
    const bankAccountsRef = ref();
    const businessReportFiguresRef = ref();

    watch(model, () => {
        scrollToTop();
    });

    const settings = [
        {
            title: 'Company Identification',
            subtitle: 'Basic information about the company',
            icon: 'mdi-account-outline',
            addBtn: false,
        },
        {
            title: 'Bank Accounts',
            subtitle: 'Manage company bank accounts',
            icon: 'mdi-cog-outline',
            addBtn: true,
        },
        {
            title: 'Digital Interfaces',
            subtitle: 'Manage the companies digital interfaces',
            icon: 'mdi-shield-outline',
            addBtn: false,
        },
        {
            title: 'Business Report Figures',
            subtitle: 'Add the companies business report figures',
            icon: 'mdi-bell-outline',
            addBtn: true,
        },
        {
            title: 'Company Governance',
            subtitle: 'Information about the company governance',
            icon: 'mdi-lock-outline',
            addBtn: false,
        },
    ];

    function scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function add(): void {
        if (model.value === 1) {
            bankAccountsRef.value.addMore();
        } else if (model.value === 3) {
            businessReportFiguresRef.value.addMore();
        }
    }
</script>
