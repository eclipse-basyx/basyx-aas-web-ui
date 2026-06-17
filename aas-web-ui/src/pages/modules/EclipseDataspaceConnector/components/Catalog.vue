<template>
  <v-container class="pa-0 ma-0" fluid :style="{ height: fullHeight }">
    <v-layout :style="{ height: fullHeight }">
      <v-navigation-drawer class="leftMenu" color="appNavigation" :width="336">
        <v-card color="rgba(0,0,0,0)" elevation="0">
          <v-card-title class="py-3">
            <v-select
              v-model="selectedBusinessPartner"
              density="compact"
              hide-details
              item-title="name"
              :items="businessPartners"
              label="Select Business Partner"
              return-object
              variant="solo"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props" :subtitle="item.bpn" />
              </template>
            </v-select>
          </v-card-title>

          <v-divider />

          <v-card-text
            class="pt-0 pb-0 px-2"
            style="
              overflow-y: auto;
              height: calc(100svh - 64px - 48px - 40px - 64px - 3px);
            "
          >
            <div v-if="listLoading">
              <v-skeleton-loader type="list-item@6" />
            </div>

            <template v-else>
              <!-- Catalog -->
              <v-list
                v-if="catalogList.length > 0"
                class="pa-0"
                density="compact"
                nav
              >
                <v-virtual-scroll
                  ref="virtualScrollRef"
                  class="bg-card mb-2"
                  :item-height="56"
                  :items="catalogList"
                >
                  <template #default="{ item }">
                    <!-- Single Policy -->
                    <v-list-item
                      :key="item['@id']"
                      :active="isSelected(item)"
                      base-color="listItem"
                      :border="isSelected(item) ? 'primary' : 'listItem thin'"
                      class="mt-2 mx-0"
                      color="primarySurface"
                      style="
                        border-top: solid;
                        border-right: solid;
                        border-bottom: solid;
                        border-width: 1px;
                      "
                      :style="{
                        'border-color': isSelected(item)
                          ? primaryColor + ' !important'
                          : isDark
                            ? '#686868 !important'
                            : '#ABABAB !important',
                      }"
                      variant="tonal"
                      @click="selectCatalogDataset(item)"
                    >
                      <template #prepend>
                        <v-btn
                          class="ml-n1"
                          color="primary"
                          icon="mdi-code-json"
                          rel="noopener noreferrer"
                          size="x-small"
                          style="z-index: 9000"
                          target="_blank"
                          variant="plain"
                          @click.stop
                        />
                      </template>

                      <v-tooltip
                        activator="parent"
                        open-delay="600"
                        transition="slide-x-transition"
                      >
                        <!-- Catalog Dataset ID -->
                        <div v-if="item['@id']" class="text-body-small">
                          <span class="font-weight-bold">{{ "ID: " }}</span>
                          {{ item["@id"] }}
                        </div>

                        <!-- Created At -->
                        <div
                          v-if="item?.createdAt"
                          class="text-body-small mt-1"
                        >
                          <span class="font-weight-bold">{{
                            "Created: "
                          }}</span>
                          {{ new Date(item.createdAt).toISOString() }}
                        </div>

                        <!-- Name -->
                        <div v-if="item?.name" class="text-body-small mt-1">
                          <span class="font-weight-bold">{{ "Name: " }}</span>
                          {{ item?.name }}
                        </div>

                        <!-- Description -->
                        <div
                          v-if="item?.description"
                          class="text-body-small mt-1"
                        >
                          <span class="font-weight-bold">{{
                            "Description: "
                          }}</span>
                          {{ item?.description }}
                        </div>
                      </v-tooltip>

                      <v-list-item-title class="text-primary">
                        {{ item?.name || item?.description }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-listItemTex">
                        {{ item["@id"] }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-badge
                          color="error"
                          icon="mdi-network-strength-4-alert"
                          inline
                          :model-value="
                            item.status &&
                              item.status.trim() !== '' &&
                              item.status === 'offline'
                              ? true
                              : false
                          "
                          text-color="buttonText"
                        />

                        <v-menu>
                          <template #activator="{ props }">
                            <v-btn
                              color="listItemText"
                              icon
                              size="x-small"
                              variant="plain"
                              v-bind="props"
                              @click.prevent
                            >
                              <v-icon size="x-small">mdi-dots-vertical</v-icon>
                            </v-btn>
                          </template>

                          <v-sheet border>
                            <v-list class="py-0" dense density="compact" slim>
                              <v-divider />
                              <!-- Copy Catalog Dataset ID to clipboard -->
                              <v-list-item
                                @click.stop="
                                  copyToClipboard(
                                    item['@id'],
                                    'CatalogDatasetId',
                                    copyIconAsRef,
                                  )
                                "
                              >

                                <template #prepend>
                                  <v-icon size="x-small">{{ copyIcon }}</v-icon>
                                </template>

                                <v-list-item-subtitle>Copy Catalog Dataset ID</v-list-item-subtitle>

                              </v-list-item>

                            </v-list>

                          </v-sheet>
                        </v-menu>
                      </template>
                    </v-list-item>
                  </template>
                </v-virtual-scroll>
              </v-list>

              <v-empty-state
                v-else
                icon="mdi-gesture-tap"
                text="Please select a Business Partner to load its Catalog"
                title="Select Business Partner"
              >
                <template #media>
                  <v-icon size="64" />
                </template>
              </v-empty-state>
            </template>
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

      <v-main class="py-0">
        <v-container
          class="ma-0 pa-0"
          fluid
          style="overflow-y: auto"
          :style="{ height: fullHeightMain }"
        >
          <div
            v-if="
              !selectedBusinessPartner ||
                Object.keys(selectedBusinessPartner).length === 0 ||
                !selectedCatalogDataset ||
                Object.keys(selectedCatalogDataset).length === 0
            "
            class="mx-0 pa-0 d-flex align-center justify-center"
            :style="{ height: fullHeightMain }"
          >
            <v-empty-state
              v-if="
                !selectedBusinessPartner ||
                  Object.keys(selectedBusinessPartner).length === 0
              "
              icon="mdi-gesture-tap"
              style="padding-top: 45px"
              text="Please select a Business Partner to load its Catalog"
              title="Select Business Partner"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>

            <v-empty-state
              v-else-if="
                !selectedCatalogDataset ||
                  Object.keys(selectedCatalogDataset).length === 0
              "
              icon="mdi-gesture-tap"
              text="Please select a Catalog Dataset"
              title="Select Catalog Dataset"
            >
              <template #media>
                <v-icon size="64" />
              </template>
            </v-empty-state>
          </div>

          <template v-else>

            <div
              class="d-flex justify-space-between align-center mt-4 mx-4 mb-2"
            >
              <v-btn-toggle
                v-model="selectedView"
                density="compact"
                mandatory
                rounded="lg"
                variant="outlined"
              >
                <v-btn value="tree">
                  <v-icon start>mdi-file-tree-outline</v-icon>
                  Tree
                </v-btn>

                <v-btn value="json">
                  <v-icon start>mdi-code-json</v-icon>
                  JSON
                </v-btn>
              </v-btn-toggle>

              <v-list-item-title
                class="text-body-large pr-2 d-flex align-center"
              >
                <v-icon class="mr-1" color="primary" size="small">
                  mdi-database-search-outline
                </v-icon>

                Catalog Dataset

              </v-list-item-title>

            </div>

            <!-- JSON view -->
            <pre
              v-if="selectedView === 'json'"
              class="json-content mt-0 mx-4 mb-0 bg-surface rounded border"
              style="height: 275px; min-height: 63px"
            >
              <code class="mx-5" v-html="selectedCatalogDatasetJsonFormatted" />
            </pre>

            <!-- Tree view -->
            <div
              v-else
              class="rounded border overflow-y-auto mx-4 mb-0 pa-4"
              style="height: 275px; min-height: 63px; background-color: #f5f5f5"
            >
              <JsonTreeView :data="selectedCatalogDataset" />
            </div>

            <v-card-actions class="mt-0 mb-2 mx-4 pa-0">
              <v-chip
                v-if="edcStatus"
                class="mr-2"
                :color="
                  edcStatus.startsWith('Error')
                    ? 'error'
                    : edcStatus.includes('successfully')
                      ? 'success'
                      : 'primary'
                "
                density="compact"
                label
                variant="tonal"
              >
                <v-progress-circular
                  v-if="fetchingAsset"
                  class="mr-2"
                  indeterminate
                  size="16"
                  width="2"
                />
                {{ edcStatus }}
              </v-chip>

              <v-spacer />

              <!-- Push Data button (shown when asset ID contains 'push-asset') -->
              <template v-if="isPushAsset">
                <span class="text-body-2 text-medium-emphasis mr-2">Select AAS/SM data below to push</span>

                <v-btn
                  class="text-buttonText"
                  color="primary"
                  :disabled="
                    (!selectedAAS || Object.keys(selectedAAS).length === 0) &&
                      (!Array.isArray(selectedSmIds) ||
                        selectedSmIds.length === 0)
                  "
                  prepend-icon="mdi-upload"
                  rounded="lg"
                  text="Push selected Data"
                  variant="flat"
                  @click="pushData()"
                />
              </template>

              <!-- Fetch Asset button (default) -->
              <v-btn
                v-else
                class="text-buttonText"
                :color="fetchingAsset ? 'error' : 'primary'"
                :disabled="!fetchingAsset && !isHttpDataPull"
                :prepend-icon="fetchingAsset ? 'mdi-close' : 'mdi-download'"
                rounded="lg"
                :text="fetchingAsset ? 'Cancel Fetch' : 'Fetch Asset'"
                variant="flat"
                @click="
                  fetchingAsset ? (cancelFetchAsset = true) : fetchAsset()
                "
              />
            </v-card-actions>

            <v-divider />

            <template v-if="isPushAsset">

              <v-layout :style="{ height: fullHeightLists }">

                <v-navigation-drawer
                  class="leftMenu"
                  color="appNavigation"
                  width="336"
                >
                  <v-card color="rgba(0,0,0,0)" elevation="0">
                    <v-card-title class="px-2 d-flex align-center">
                      <v-tooltip location="bottom" open-delay="600">
                        <template #activator="{ props: activatorProps }">
                          <v-btn
                            class="ml-n3"
                            icon="mdi-reload"
                            :loading="aasListLoading"
                            variant="plain"
                            v-bind="activatorProps"
                            @click="initialize()"
                          />
                        </template>

                        <span>Reload AAS List</span>
                      </v-tooltip>

                      <v-text-field
                        clearable
                        density="compact"
                        hide-details
                        label="Search for AAS..."
                        :model-value="aasSearchValue"
                        persistent-placeholder
                        :placeholder="aasList.length.toString() + ' Shells'"
                        variant="outlined"
                        @update:model-value="debouncedFilterAasList"
                      />
                    </v-card-title>

                    <v-divider />

                    <v-card-text
                      class="pt-0 pb-0 px-2"
                      style="overflow-y: auto"
                      :style="{ height: fullHeightList }"
                    >
                      <div v-if="aasListLoading">
                        <v-skeleton-loader type="list-item@6" />
                      </div>

                      <template v-else>
                        <!-- AAS List -->
                        <v-list
                          v-if="aasList.length > 0"
                          class="pa-0"
                          density="compact"
                          nav
                        >
                          <v-virtual-scroll
                            ref="aasVirtualScrollRef"
                            class="bg-card mb-2"
                            :item-height="itemHeight"
                            :items="aasList"
                          >
                            <template #default="{ item }">
                              <!-- Single AAS -->
                              <v-list-item
                                v-if="item && Object.keys(item).length > 0"
                                :active="aasIsSelected(item)"
                                base-color="listItem"
                                :border="
                                  aasIsSelected(item)
                                    ? 'primary'
                                    : 'listItem thin'
                                "
                                class="mt-2 mx-0"
                                color="primarySurface"
                                style="
                                  border-top: solid;
                                  border-right: solid;
                                  border-bottom: solid;
                                  border-width: 1px;
                                "
                                :style="{
                                  'border-color': aasIsSelected(item)
                                    ? primaryColor + ' !important'
                                    : isDark
                                      ? '#686868 !important'
                                      : '#ABABAB !important',
                                }"
                                variant="tonal"
                                @click="selectAAS(item)"
                              >
                                <template #prepend>
                                  <v-btn
                                    class="ml-n1"
                                    color="primary"
                                    icon="custom:aasIcon"
                                    rel="noopener noreferrer"
                                    size="x-small"
                                    style="z-index: 9000"
                                    target="_blank"
                                    variant="plain"
                                    @click.stop
                                  />
                                </template>
                                <!-- Tooltip with idShort and id -->
                                <v-tooltip
                                  activator="parent"
                                  open-delay="600"
                                  transition="slide-x-transition"
                                >
                                  <!-- AAS ID -->
                                  <div v-if="item.id" class="text-body-small">
                                    <span class="font-weight-bold">{{
                                      "ID: "
                                    }}</span>
                                    {{ item.id }}
                                  </div>
                                  <!-- AAS idShort -->
                                  <div
                                    v-if="item.idShort"
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">
                                      {{ "idShort: " }}</span>
                                    {{ item.idShort }}
                                  </div>

                                  <v-divider
                                    v-if="item.administration?.version"
                                    class="my-1"
                                  />
                                  <!-- AAS administrative information -->
                                  <div
                                    v-if="item.administration?.version"
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">{{
                                      "Version: "
                                    }}</span>
                                    {{
                                      item.administration.version +
                                        (item.administration.revision
                                          ? "." + item.administration.revision
                                          : "")
                                    }}
                                  </div>
                                </v-tooltip>

                                <v-list-item-title
                                  class="text-primary"
                                  style="z-index: 9999"
                                >
                                  {{ nameToDisplay(item) }}
                                </v-list-item-title>

                                <v-list-item-subtitle class="text-listItemText">
                                  {{ item.id }}
                                </v-list-item-subtitle>
                              </v-list-item>
                            </template>
                          </v-virtual-scroll>

                          <v-list-item
                            v-if="isSearchLimited"
                            class="px-4 py-1"
                            density="compact"
                          >
                            <v-list-item-subtitle class="text-listItemText">
                              Searching loaded shells only. Scroll down to load
                              more.
                            </v-list-item-subtitle>
                          </v-list-item>

                          <v-list-item
                            v-if="pageLoading && !aasListLoading"
                            class="px-4 py-0"
                            density="compact"
                          >
                            <template #prepend>
                              <v-progress-circular
                                class="mr-2"
                                indeterminate
                                size="16"
                                width="2"
                              />
                            </template>

                            <v-list-item-subtitle class="text-listItemText ml-1">Loading more shells...</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </template>
                    </v-card-text>
                  </v-card>
                </v-navigation-drawer>

                <v-navigation-drawer
                  class="leftMenu"
                  color="appNavigation"
                  width="336"
                >
                  <v-card
                    class="d-flex flex-column"
                    color="rgba(0,0,0,0)"
                    elevation="0"
                    style="height: 100%"
                  >
                    <v-card-title class="px-2 d-flex align-center">
                      <v-text-field
                        clearable
                        density="compact"
                        hide-details
                        label="Search for Submodel..."
                        :model-value="aasSearchValue"
                        persistent-placeholder
                        :placeholder="smList.length.toString() + ' Submodels'"
                        variant="outlined"
                        @update:model-value="filterSubmodelList"
                      />

                      <v-tooltip location="bottom" open-delay="600">
                        <template #activator="{ props: activatorProps }">
                          <v-btn
                            class="mx-0"
                            icon="mdi-checkbox-multiple-outline"
                            variant="plain"
                            v-bind="activatorProps"
                            @click="selectAllSMs()"
                          />
                        </template>

                        <span>Select all Submodels</span>
                      </v-tooltip>

                      <v-tooltip location="bottom" open-delay="600">
                        <template #activator="{ props: activatorProps }">
                          <v-btn
                            class="ml-n3 mr-n2"
                            icon="mdi-checkbox-multiple-blank-outline"
                            variant="plain"
                            v-bind="activatorProps"
                            @click="deselectAllSMs()"
                          />
                        </template>

                        <span>Deselect all Submodels</span>
                      </v-tooltip>
                    </v-card-title>

                    <v-divider />

                    <v-card-text
                      class="pt-0 pb-0 px-2 flex-grow-1"
                      style="overflow-y: auto"
                    >
                      <div v-if="smListLoading">
                        <v-skeleton-loader type="list-item@6" />
                      </div>

                      <template v-else>
                        <div
                          v-if="
                            !selectedAAS ||
                              Object.keys(selectedAAS).length === 0
                          "
                          class="d-flex align-center justify-center"
                          style="height: 100%; min-height: 200px"
                        >
                          <v-empty-state
                            icon="mdi-gesture-tap"
                            text="Please select an AAS to load its Submodels"
                            title="Select AAS"
                          >
                            <template #media>
                              <v-icon size="64" />
                            </template>
                          </v-empty-state>
                        </div>

                        <!-- SM List -->
                        <v-list
                          v-else-if="smList.length > 0"
                          v-model:selected="selectedSmIds"
                          class="pa-0"
                          density="compact"
                          nav
                          select-strategy="leaf"
                        >
                          <v-virtual-scroll
                            ref="smVirtualScrollRef"
                            class="bg-card mb-2"
                            :item-height="itemHeight"
                            :items="smList"
                          >
                            <template #default="{ item }">
                              <!-- Single SM -->
                              <v-list-item
                                v-if="item && Object.keys(item).length > 0"
                                :key="item.id"
                                :active="smIsSelected(item)"
                                base-color="listItem"
                                :border="
                                  smIsSelected(item)
                                    ? 'primary'
                                    : 'listItem thin'
                                "
                                class="mt-2 mx-0"
                                color="primarySurface"
                                style="
                                  border-top: solid;
                                  border-right: solid;
                                  border-bottom: solid;
                                  border-width: 1px;
                                "
                                :style="{
                                  'border-color': smIsSelected(item)
                                    ? primaryColor + ' !important'
                                    : isDark
                                      ? '#686868 !important'
                                      : '#ABABAB !important',
                                }"
                                :value="item.id"
                                variant="tonal"
                              >
                                <template
                                  #prepend="{
                                    isSelected: smIsChecked,
                                    select: smSelect,
                                  }"
                                >
                                  <v-checkbox-btn
                                    class="ml-n1 mr-1"
                                    :model-value="smIsChecked"
                                    @update:model-value="smSelect"
                                  />
                                </template>

                                <!-- Tooltip with idShort and id -->
                                <v-tooltip
                                  activator="parent"
                                  open-delay="600"
                                  transition="slide-x-transition"
                                >
                                  <!-- Submodel ID -->
                                  <div v-if="item.id" class="text-body-small">
                                    <span class="font-weight-bold">{{
                                      "ID: "
                                    }}</span>
                                    {{ item.id }}
                                  </div>
                                  <!-- Submodel idShort -->
                                  <div
                                    v-if="item.idShort"
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">
                                      {{ "idShort: " }}</span>
                                    {{ item.idShort }}
                                  </div>
                                  <!-- Submodel semanticId -->
                                  <div
                                    v-if="item?.semanticId?.keys[0]?.value"
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">
                                      {{ "semanticId: " }}</span>
                                    {{ item.semanticId.keys[0].value }}
                                  </div>

                                  <v-divider
                                    v-if="item.administration?.version"
                                    class="my-1"
                                  />
                                  <!-- Submodel administrative information -->
                                  <div
                                    v-if="item.administration?.version"
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">{{
                                      "Version: "
                                    }}</span>
                                    {{
                                      item.administration.version +
                                        (item.administration.revision
                                          ? "." + item.administration.revision
                                          : "")
                                    }}
                                  </div>

                                  <v-divider
                                    v-if="
                                      item?.semanticId?.keys[0]?.value &&
                                        (smts.some(
                                          (smt: any) =>
                                            item.semanticId.keys[0].value ===
                                            smt.semanticId,
                                        ) ||
                                          extractVersionRevision(
                                            item.semanticId.keys[0].value,
                                          ).version)
                                    "
                                    class="my-1"
                                  />
                                  <!-- Submodel Template name -->
                                  <div
                                    v-if="
                                      smts.some(
                                        (smt: any) =>
                                          item?.semanticId?.keys[0]?.value ===
                                          smt.semanticId,
                                      )
                                    "
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">{{
                                      "SMT: "
                                    }}</span>
                                    {{
                                      smts.find(
                                        (smt: any) =>
                                          item?.semanticId?.keys[0]?.value ===
                                          smt.semanticId,
                                      )?.name
                                    }}
                                  </div>
                                  <!-- Submodel Template version -->
                                  <div
                                    v-if="
                                      smts.some(
                                        (smt: any) =>
                                          item?.semanticId?.keys[0]?.value ===
                                          smt.semanticId,
                                      )
                                    "
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">{{
                                      "SMT Version: "
                                    }}</span>
                                    {{
                                      smts.find(
                                        (smt: any) =>
                                          item?.semanticId?.keys[0]?.value ===
                                          smt.semanticId,
                                      )?.version
                                    }}
                                  </div>
                                  <!-- Submodel Template version extracted from semanticId -->
                                  <div
                                    v-else-if="
                                      item?.semanticId?.keys[0]?.value &&
                                        extractVersionRevision(
                                          item?.semanticId?.keys[0]?.value,
                                        ).version
                                    "
                                    class="text-body-small"
                                  >
                                    <span class="font-weight-bold">{{
                                      "SMT Version: "
                                    }}</span>
                                    {{
                                      extractVersionRevision(
                                        item?.semanticId?.keys[0]?.value,
                                      ).version +
                                        (extractVersionRevision(
                                          item?.semanticId?.keys[0]?.value,
                                        ).revision
                                          ? "." +
                                            extractVersionRevision(
                                              item?.semanticId?.keys[0]?.value,
                                            ).revision
                                          : "")
                                    }}
                                  </div>
                                </v-tooltip>

                                <v-list-item-title
                                  class="text-primary"
                                  style="z-index: 9999"
                                >
                                  {{ nameToDisplay(item) }}
                                </v-list-item-title>

                                <v-list-item-subtitle class="text-listItemText">
                                  {{ item.id }}
                                </v-list-item-subtitle>

                                <template
                                  v-if="smVersionToDisplay(item)"
                                  #append
                                >
                                  <v-chip size="x-small">
                                    v{{ smVersionToDisplay(item) }}
                                  </v-chip>
                                </template>
                              </v-list-item>
                            </template>
                          </v-virtual-scroll>

                          <v-list-item
                            v-if="isSearchLimited"
                            class="px-4 py-1"
                            density="compact"
                          >
                            <v-list-item-subtitle class="text-listItemText">
                              Searching loaded shells only. Scroll down to load
                              more.
                            </v-list-item-subtitle>
                          </v-list-item>

                          <v-list-item
                            v-if="pageLoading && !aasListLoading"
                            class="px-4 py-0"
                            density="compact"
                          >
                            <template #prepend>
                              <v-progress-circular
                                class="mr-2"
                                indeterminate
                                size="16"
                                width="2"
                              />
                            </template>

                            <v-list-item-subtitle class="text-listItemText ml-1">Loading more shells...</v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </template>
                    </v-card-text>
                  </v-card>
                </v-navigation-drawer>

                <v-main class="py-0">

                  <v-container
                    class="ma-0 pa-0"
                    fluid
                    style="height: 100%; overflow-y: auto"
                  >
                    <div
                      v-if="
                        !selectedAAS || Object.keys(selectedAAS).length === 0
                      "
                      class="d-flex align-center justify-center"
                      style="height: 100%"
                    >
                      <v-empty-state
                        icon="mdi-gesture-tap"
                        style="padding-top: 86px"
                        text="Please select an AAS and/or SM(s) to push."
                        title="Select AAS"
                      >
                        <template #media>
                          <v-icon size="64" />
                        </template>
                      </v-empty-state>
                    </div>

                    <template v-else>

                      <div
                        class="d-flex justify-space-between align-center mt-4 mx-4 mb-2"
                      >

                        <v-btn-toggle
                          v-model="selectedAasSmDataToPushView"
                          density="compact"
                          mandatory
                          rounded="lg"
                          variant="outlined"
                        >
                          <v-btn value="tree">
                            <v-icon start>mdi-file-tree-outline</v-icon>
                            Tree
                          </v-btn>

                          <v-btn value="json">
                            <v-icon start>mdi-code-json</v-icon>
                            JSON
                          </v-btn>
                        </v-btn-toggle>

                        <v-checkbox
                          v-if="selectedSms.length === 1"
                          v-model="justPushSmData"
                          class="m-0"
                          density="compact"
                          hide-details
                          label="Just push Submodel data"
                        />

                        <v-list-item-title
                          class="text-body-large pr-2 d-flex align-center"
                        >

                          <v-icon
                            class="mr-1"
                            color="primary"
                            icon="custom:aasIcon"
                            size="small"
                          />

                          <span class="text-body-2 mx-1">/</span>

                          <v-icon class="mr-1" color="primary" size="small">
                            mdi-folder
                          </v-icon>

                          data to push

                        </v-list-item-title>

                      </div>

                      <!-- JSON view -->
                      <pre
                        v-if="selectedAasSmDataToPushView === 'json'"
                        class="json-content mt-0 mx-4 mb-4 bg-surface rounded border"
                        :style="{ height: fullHeightAasSmsDataToPushJson }"
                      >
                        <!-- <code class="mx-5" v-html="aasSmDataToPushJsonFormatted" /> -->
                      </pre>

                      <!-- Tree view -->
                      <div
                        v-else
                        class="rounded border overflow-y-auto mx-4 mb-4 pa-4"
                        :style="{'height': fullHeightAasSmsDataToPushJson, 'background-color': '#f5f5f5'}"
                      >
                        <JsonTreeView :data="aasSmDataToPush" />
                      </div>

                    </template>

                  </v-container>

                </v-main>

              </v-layout>

            </template>

            <template v-else>
              <div
                class="d-flex justify-space-between align-center mt-4 mx-4 mb-2"
              >
                <v-btn-toggle
                  v-model="selectedAssetView"
                  density="compact"
                  mandatory
                  rounded="lg"
                  variant="outlined"
                >
                  <v-btn value="tree">
                    <v-icon start>mdi-file-tree-outline</v-icon>
                    Tree
                  </v-btn>

                  <v-btn value="json">
                    <v-icon start>mdi-code-json</v-icon>
                    JSON
                  </v-btn>
                </v-btn-toggle>

                <v-list-item-title
                  class="text-body-large pr-2 d-flex align-center"
                >
                  <template v-if="isValidAAS">
                    <v-icon
                      class="mr-1"
                      color="primary"
                      icon="custom:aasIcon"
                      size="small"
                    />
                    Asset Administration Shell
                  </template>

                  <template v-else-if="isValidSubmodel">
                    <v-icon class="mr-1" color="primary" size="small">
                      mdi-folder
                    </v-icon>
                    Submodel
                  </template>

                  <template v-else>
                    <v-icon class="mr-1" color="primary" size="small">
                      mdi-cube
                    </v-icon>
                    Asset
                  </template>
                </v-list-item-title>
              </div>

              <!-- Asset JSON view -->
              <pre
                v-if="selectedAssetView === 'json'"
                class="json-content mt-0 mx-4 mb-5 bg-surface rounded border"
                style="min-height: 63px"
                :style="{ 'max-height': heightAssetJson }"
              >
                <code class="mx-5" v-html="assetJsonFormatted" />
              </pre>

              <!-- Asset Tree view -->
              <div
                v-else
                class="rounded border overflow-y-auto mx-4 mb-5 pa-4"
                style="min-height: 63px; background-color: #f5f5f5"
                :style="{ 'max-height': heightAssetJson }"
              >
                <JsonTreeView :data="assetJsonParsed" />
              </div>

            </template>

          </template>

        </v-container>

      </v-main>

    </v-layout>

  </v-container>

</template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import * as Prism from 'prismjs'
  import {
    type ComponentPublicInstance,
    computed,
    onActivated,
    onMounted,
    ref,
    type Ref,
    watch,
  } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import JsonTreeView from '@/components/UIComponents/JsonTreeView.vue'
  import { useAASHandling } from '@/composables/AAS/AASHandling'
  import {
    appendOrMergeSortedAasById,
    compareAasById,
  } from '@/composables/AAS/AASListAccumulation'
  import { useAASListPagination } from '@/composables/AAS/AASListPagination'
  import { useReferableUtils } from '@/composables/AAS/ReferableUtils'
  import { useSMHandling } from '@/composables/AAS/SMHandling'
  import { useClipboardUtil } from '@/composables/ClipboardUtil'
  import {
    type CatalogRequest,
    useEdcClient,
  } from '@/pages/modules/EclipseDataspaceConnector/composables/Client/EdcClient'
  import { useEdcStore } from '@/pages/modules/EclipseDataspaceConnector/store/EdcStore'
  import { useAASStore } from '@/store/AASDataStore'
  import { useNavigationStore } from '@/store/NavigationStore'
  import { extractVersionRevision } from '@/utils/AAS/SemanticIdUtils'
  import { smts } from '@/utils/AAS/SubmodelTemplateUtils'
  import { debounce } from '@/utils/generalUtils'
  import { formatJSON } from '@/utils/JsonUtils'
  import { getPrismJsonLanguage } from '@/utils/prismJsonLanguage'
  import 'prismjs/themes/prism.css'

  // Extend the ComponentPublicInstance type to include scrollToIndex
  interface VirtualScrollInstance extends ComponentPublicInstance {
    scrollToIndex: (index: number) => void
  }

  // Vue Router
  const route = useRoute()
  const router = useRouter()

  // Stores
  const edcStore = useEdcStore()
  const navigationStore = useNavigationStore()
  const aasStore = useAASStore()

  // Composables
  const {
    queryCatalog,
    initiateContractNegotiation,
    getContractNegotiation,
    getContractNegotiationState,
    initiateTransferProcess,
    getTransferProcessState,
    getEdrDataAddress,
  } = useEdcClient()
  const { copyToClipboard } = useClipboardUtil()
  const { fetchAasShellListPage, fetchAasById, fetchAasSmListById }
    = useAASHandling()
  const { fetchSmById } = useSMHandling()
  const { nameToDisplay, descriptionToDisplay } = useReferableUtils()

  // Vuetify
  const theme = useTheme()

  // Data
  const fullHeight = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - border
  const fullHeightMain = ref('calc(100vh - 64px - 48px - 40px - 2px)') // Full height - header - tabs - footer - padding - border

  const heightAssetJson = ref('calc(100vh - 64px - 48px - 40px - 2px - 275px)') // Full height - header - tabs - footer - padding - border - dataset

  const fullHeightLists = ref(
    'calc(100vh - 64px - 48px - 40px - 2px - 275px - 60px - 60px - 1px)',
  ) // Full height - header - tabs - footer - padding - border - dataset - v-list-item - action bar - divider

  const fullHeightList = ref(
    'calc(100vh - 64px - 48px - 40px - 2px - 275px - 60px - 60px - 64 px)',
  ) // Full height - header - tabs - footer - padding - border - dataset - v-list-item - action bar - list search

  const fullHeightAasSmsDataToPushJson = ref(
    'calc(100vh - 64px - 48px - 40px - 2px - 275px - 60px - 60px - 1px - 64px - 16px)',
  ) // Full height - header - tabs - footer - padding - border - dataset - v-list-item - action bar - divider - v-list-item-title - padding

  const selectedBusinessPartner = ref<any>(null)

  const catalogList = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Catalog Dataset data
  const catalogListUnfiltered = ref([] as Array<any>) as Ref<Array<any>> // Variable to store the Catalog Dataset data before filtering
  const listLoading = ref(false) // Variable to store if the AAS List is loading
  const virtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null) // Reference to the Virtual Scroll Component
  const selectedView = ref<'json' | 'tree'>('tree')
  const selectedAssetView = ref<'json' | 'tree'>('tree')
  const selectedAasSmDataToPushView = ref<'json' | 'tree'>('tree')
  const selectedCatalogDataset = ref({} as any)
  const selectedCatalogDatasetJson = ref<string>('')
  const selectedCatalogDatasetJsonFormatted = ref<string>('')
  const assetJson = ref<string>('')
  const assetJsonFormatted = ref<string>('')
  const assetJsonParsed = ref<unknown>({})
  const copyIcon = ref<string>('mdi-clipboard-file-outline')

  const fetchingAsset = ref(false)
  const edcStatus = ref('')
  const cancelFetchAsset = ref(false)

  // const jsonLanguage = getPrismJsonLanguage()
  const aasSmDataToPush = ref({} as any)
  // const aasSmDataToPushJson = ref<string>('')
  // const aasSmDataToPushJsonFormatted = ref<string>('')

  // Push-asset data (AAS/SM lists)
  const itemHeight = 56
  const minPageLimit = 100
  const maxPageLimit = 300
  const prefetchThresholdInRows = 8
  const pageSizeMultiplier = 3
  const scrollLoadDebounceMs = 200
  const minPageLoadIntervalMs = 350

  const aasList = ref([] as Array<any>) as Ref<Array<any>>
  const smList = ref([] as Array<any>) as Ref<Array<any>>
  const smListUnfiltered = ref([] as Array<any>) as Ref<Array<any>>
  const allLoadedAas = ref([] as Array<any>) as Ref<Array<any>>
  const aasSearchValue = ref('')
  const aasLoadedIds = ref(new Set<string>())
  const smListLoading = ref(false)
  const aasVirtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null)
  const smVirtualScrollRef: Ref<VirtualScrollInstance | null> = ref(null)
  const selectedSmIds = ref<string[]>([])
  const selectedSms = ref<any[]>([])
  const justPushSmData = ref(false)

  const debouncedFilterAasList = debounce(filterAasList, 300)

  const {
    hasMorePages,
    isLoadingInitialPage,
    pageLoading,
    resetPaginationState: resetPaginationStateInternal,
    initialize: initializeAasPagination,
  } = useAASListPagination({
    virtualScrollRef: aasVirtualScrollRef,
    itemHeight,
    minPageLimit,
    maxPageLimit,
    pageSizeMultiplier,
    prefetchThresholdInRows,
    scrollLoadDebounceMs,
    minPageLoadIntervalMs,
    fetchPage: params => fetchAasShellListPage(params),
    onPageItems: items => {
      const incomingItems = items
        .toSorted(compareAasById)
        .filter(item => {
          if (!item?.id || aasLoadedIds.value.has(item.id)) return false
          aasLoadedIds.value.add(item.id)
          return true
        })
        .map(item => preprocessListItem(item))

      if (incomingItems.length > 0) {
        allLoadedAas.value = appendOrMergeSortedAasById(
          allLoadedAas.value,
          incomingItems,
        )
        applyCurrentFilter()
      }
    },
  })

  // Computed properties
  const businessPartners = computed(
    () => edcStore.getEdcConfig?.businessPartners ?? [],
  )
  const primaryColor = computed(() => theme.current.value.colors.primary)
  const isDark = computed(() => theme.current.value.dark)
  const copyIconAsRef = computed(() => copyIcon)
  const selectedAAS = computed(() => aasStore.getSelectedAAS)
  const aasListLoading = computed(() => isLoadingInitialPage.value)
  const isSearchLimited = computed(
    () => aasSearchValue.value.trim() !== '' && hasMorePages.value,
  )

  const isValidAAS = computed(() => {
    const parsed = assetJsonParsed.value
    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0)
      return false
    const result = jsonization.assetAdministrationShellFromJsonable(
      parsed as jsonization.JsonValue,
    )
    return result.error === null
  })

  const isValidSubmodel = computed(() => {
    const parsed = assetJsonParsed.value
    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0)
      return false
    const result = jsonization.submodelFromJsonable(
      parsed as jsonization.JsonValue,
    )
    return result.error === null
  })

  const isPushAsset = computed(() => {
    const id: string = selectedCatalogDataset.value?.['@id'] ?? ''
    return id.includes('push-asset')
  })

  const isHttpDataPull = computed(() => {
    const distributions = selectedCatalogDataset.value?.['dcat:distribution']
    if (!distributions) return false

    const distArray = Array.isArray(distributions)
      ? distributions
      : [distributions]

    return distArray.some(
      (dist: any) =>
        dist['@type'] === 'dcat:Distribution'
        && dist['dct:format']?.['@id'] === 'HttpData-PULL',
    )
  })

  // Watchers
  watch(
    () => edcStore.getEdcConfig,
    () => {
      initialize()
    },
  )

  watch(
    () => selectedBusinessPartner.value,
    () => {
      initialize()
    },
  )

  watch(
    () => selectedAAS.value,
    async () => {
      applyCurrentFilter()
      scrollToSelectedAAS()

      prepareAasData()
    },
    { deep: true },
  )

  watch(
    () => selectedSmIds.value,
    async () => {
      selectedSms.value = []
      for (const smId of selectedSmIds.value) {
        const sm = await fetchSmById(smId)
        selectedSms.value = [...selectedSms.value, sm]
      }
      prepareAasSmDataToPushJson()
    },
  )

  watch(
    () => justPushSmData.value,
    () => {
      prepareAasSmDataToPushJson()
    },
  )

  watch(
    () => isPushAsset.value,
    value => {
      if (value) initializeAasLists()
    },
  )

  watch(
    () => selectedCatalogDataset.value,
    () => {
      try {
        selectedCatalogDatasetJson.value = JSON.stringify(
          selectedCatalogDataset.value,
        )
        const formatted = formatJSON(selectedCatalogDatasetJson.value)

        // Apply syntax highlighting using Prism
        if (Prism && Prism.highlight) {
          selectedCatalogDatasetJsonFormatted.value = Prism.highlight(
            formatted,
            getPrismJsonLanguage(),
            'json',
          )
        } else {
          selectedCatalogDatasetJsonFormatted.value = formatted
          console.warn('Prism highlighting not available')
        }

        assetJson.value = ''
        assetJsonFormatted.value = ''
        assetJsonParsed.value = {}

        edcStatus.value = ''
      } catch (error_) {
        console.error('Error highlighting JSON:', error_)
        selectedCatalogDatasetJsonFormatted.value
          = selectedCatalogDatasetJson.value || ''
      }
    },
    { deep: true },
  )

  // watch(
  //   () => aasSmDataToPushJson.value,
  //   () => {
  //     try {
  //       const formatted = formatJSON(aasSmDataToPushJson.value)

  //       // Apply syntax highlighting using Prism
  //       if (Prism && Prism.highlight) {
  //         aasSmDataToPushJsonFormatted.value = Prism.highlight(
  //           formatted,
  //           jsonLanguage,
  //           'json',
  //         )
  //       } else {
  //         aasSmDataToPushJsonFormatted.value = formatted
  //         console.warn('Prism highlighting not available')
  //       }
  //     } catch (error_) {
  //       console.error('Error highlighting JSON:', error_)
  //       aasSmDataToPushJsonFormatted.value = aasSmDataToPushJson.value || ''
  //     }
  //   },
  //   { deep: true },
  // )

  onMounted(() => {
    initialize()
  })

  onActivated(() => {
    scrollToSelectedCatalogDataset()
  })

  async function initialize (): Promise<void> {
    listLoading.value = true

    selectedCatalogDataset.value = {}
    selectedCatalogDatasetJson.value = ''
    selectedCatalogDatasetJsonFormatted.value = ''

    assetJson.value = ''
    assetJsonFormatted.value = ''

    edcStatus.value = ''

    if (selectedBusinessPartner.value && selectedBusinessPartner.value.dsp) {
      const catalogRequest: CatalogRequest = {
        counterPartyId: selectedBusinessPartner.value.bpn,
        counterPartyAddress: selectedBusinessPartner.value.dsp,
        protocol: 'dataspace-protocol-http',
      }
      const catalog = await queryCatalog(catalogRequest)

      if (catalog && catalog['dcat:dataset']) {
        const datasets = Array.isArray(catalog['dcat:dataset'])
          ? catalog['dcat:dataset']
          : [catalog['dcat:dataset']]

        const datasetsSorted = datasets.toSorted(
          (datasetA: any, datasetB: any) => {
            return (datasetA['@id'] || '') > (datasetB['@id'] || '') ? 1 : -1
          },
        )

        catalogList.value = [...datasetsSorted]
        catalogListUnfiltered.value = [...datasetsSorted]
      } else {
        catalogList.value = []
        catalogListUnfiltered.value = []
      }

      scrollToSelectedCatalogDataset()
    }

    listLoading.value = false
  }

  function selectCatalogDataset (policy: any): void {
    if (isSelected(policy)) {
      selectedCatalogDataset.value = {}
    } else {
      selectedCatalogDataset.value = policy

      if (
        !selectedCatalogDataset.value
        || Object.keys(selectedCatalogDataset.value).length === 0
      ) {
        scrollToSelectedCatalogDataset()
      }
    }
  }

  function isSelected (policy: any): boolean {
    if (
      !selectedCatalogDataset.value
      || Object.keys(selectedCatalogDataset.value).length === 0
      || !selectedCatalogDataset.value['@id']
      || !policy
      || Object.keys(policy).length === 0
      || !policy['@id']
    ) {
      return false
    }
    return selectedCatalogDataset.value['@id'] === policy['@id']
  }

  function scrollToSelectedCatalogDataset (): void {
    // Find the index of the selected item
    const index = catalogList.value.findIndex((sm: any) => isSelected(sm))

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          virtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector(
            '.v-virtual-scroll__container',
          ).children.length > 0
        ) {
          // Access the scrollable container
          virtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

  function preprocessListItem (item: any): any {
    return {
      ...item,
      idLower: item?.id?.toLowerCase() || '',
      idShortLower: item?.idShort?.toLowerCase() || '',
      nameLower: nameToDisplay(item).toLowerCase(),
      descLower: descriptionToDisplay(item).toLowerCase(),
    }
  }

  function applyCurrentFilter (): void {
    const trimmedSearch = aasSearchValue.value.trim().toLowerCase()
    const filteredItems
      = trimmedSearch === ''
        ? allLoadedAas.value
        : allLoadedAas.value.filter(
          aasOrAasDescriptor =>
            aasOrAasDescriptor.idLower.includes(trimmedSearch)
            || aasOrAasDescriptor.idShortLower.includes(trimmedSearch)
            || aasOrAasDescriptor.nameLower.includes(trimmedSearch)
            || aasOrAasDescriptor.descLower.includes(trimmedSearch),
        )

    const pinnedSelectedItem = createPinnedSelectedItem()
    if (pinnedSelectedItem) {
      aasList.value = [
        pinnedSelectedItem,
        ...filteredItems.filter(item => item?.id !== pinnedSelectedItem.id),
      ]
      return
    }
    aasList.value = filteredItems
  }

  function createPinnedSelectedItem (): any | undefined {
    if (
      !selectedAAS.value
      || Object.keys(selectedAAS.value).length === 0
      || !selectedAAS.value.id
    ) {
      return undefined
    }

    const selectedId = selectedAAS.value.id
    const selectedLoadedItem = allLoadedAas.value.find(
      item => item?.id === selectedId,
    )
    if (selectedLoadedItem) {
      return selectedLoadedItem
    }

    const aasPathFromQuery
      = typeof route.query.aas === 'string' ? route.query.aas : ''
    const selectedPath = selectedAAS.value.path || aasPathFromQuery
    return preprocessListItem({
      ...selectedAAS.value,
      path: selectedPath,
    })
  }

  function resetAASListState (enablePagination = true): void {
    aasList.value = []
    allLoadedAas.value = []
    aasLoadedIds.value.clear()
    resetPaginationStateInternal(enablePagination)
    aasSearchValue.value = ''
  }

  async function initializeAasLists (): Promise<void> {
    resetAASListState(true)
    await initializeAasPagination(scrollToSelectedAAS)
    await prepareAasData()
  }

  async function prepareAasData () {
    if (selectedAAS.value && Object.keys(selectedAAS.value).length > 0) {
      const aas = await fetchAasById(selectedAAS.value.id)

      fetchAasSmListById(aas.id).then((submodels: Array<any>) => {
        const submodelsSorted = submodels.toSorted((smA: any, smB: any) => {
          // Sort SMs with respect to displayed title and version
          return smTitleToDisplay(smA) + '|' + smVersionToDisplay(smA)
            > smTitleToDisplay(smB) + '|' + smVersionToDisplay(smB)
            ? 1
            : -1
        })

        smList.value = [...submodelsSorted]

        prepareAasSmDataToPushJson()
      })
    } else {
      smList.value = []
    }
    selectedSmIds.value = []
  }

  function filterAasList (value: string | null): void {
    aasSearchValue.value = value?.trim() ?? ''
    applyCurrentFilter()
    scrollToSelectedAAS()
  }

  function filterSubmodelList (value: string): void {
    if (!value || value.trim() === '') {
      smList.value = smListUnfiltered.value
    } else {
      // Filter list of SMs (cf. AASList.vue)
      const smListFiltered = smListUnfiltered.value.filter(
        (sm: any) =>
          sm.id.toLowerCase().includes(value.toLowerCase())
          || sm.idShort.toLowerCase().includes(value.toLowerCase())
          || nameToDisplay(sm).toLowerCase().includes(value.toLowerCase())
          || descriptionToDisplay(sm).toLowerCase().includes(value.toLowerCase()),
      )
      smList.value = smListFiltered
    }
    scrollToSelectedSubmodel()
  }

  function selectAAS (aas: any): void {
    if (aasListLoading.value) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 4000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Please wait for the current Request to finish.',
      })
      return
    }

    if (aasIsSelected(aas)) {
      // Deselect AAS: remove aas and path url query parameter
      const query = structuredClone(route.query)
      if (Object.hasOwn(query, 'aas')) delete query.aas
      if (Object.hasOwn(query, 'path')) delete query.path

      router.push({ query: query })
    } else {
      const query = structuredClone(route.query)
      query.aas = aas.path
      if (Object.hasOwn(query, 'path')) delete query.path

      router.push({ query: query })
    }
  }

  function selectAllSMs (): void {
    selectedSmIds.value = []
    for (const sm of smList.value) {
      selectedSmIds.value = [...selectedSmIds.value, sm.id]
    }
  }

  function deselectAllSMs (): void {
    selectedSmIds.value = []
  }

  function aasIsSelected (aasOrAasDescriptor: any): boolean {
    if (
      !selectedAAS.value
      || Object.keys(selectedAAS.value).length === 0
      || !selectedAAS.value.id
      || !aasOrAasDescriptor
      || Object.keys(aasOrAasDescriptor).length === 0
      || !aasOrAasDescriptor.id
    ) {
      return false
    }
    return selectedAAS.value.id === aasOrAasDescriptor.id
  }

  function smIsSelected (smOrSmDescriptor: any): boolean {
    if (
      !smOrSmDescriptor
      || Object.keys(smOrSmDescriptor).length === 0
      || !smOrSmDescriptor.id
    ) {
      return false
    }
    return selectedSmIds.value.includes(smOrSmDescriptor.id)
  }

  // Function to scroll to the selected AAS
  function scrollToSelectedAAS (): void {
    // Find the index of the selected item
    const index = aasList.value.findIndex((aasOrAasDescriptor: any) =>
      aasIsSelected(aasOrAasDescriptor),
    )

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          virtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector(
            '.v-virtual-scroll__container',
          ).children.length > 0
        ) {
          // Access the scrollable container
          virtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

  function scrollToSelectedSubmodel (): void {
    // Find the index of the selected item
    const index = smList.value.findIndex((sm: any) => smIsSelected(sm))

    if (index !== -1) {
      const intervalId = setInterval(() => {
        if (
          smVirtualScrollRef.value
          && virtualScrollRef.value?.$el.querySelector(
            '.v-virtual-scroll__container',
          ).children.length > 0
        ) {
          // Access the scrollable container
          smVirtualScrollRef.value.scrollToIndex(index)
          clearInterval(intervalId)
        }
      }, 50)
    }
  }

  function smTitleToDisplay (sm: any): string {
    // If there is a specified displayName, use it
    if (
      sm?.displayName
      && Array.isArray(sm?.displayName)
      && sm?.displayName.length > 0
    )
      return nameToDisplay(sm)

    // Use name of SMT specification
    const smt = smts.find(
      (smt: any) => sm?.semanticId?.keys[0]?.value === smt.semanticId,
    )
    if (smt) return smt.name

    return nameToDisplay(sm)
  }

  function smVersionToDisplay (sm: any): string {
    // If there are administrative information use it
    if (sm.administration?.version)
      return (
        sm.administration.version
        + (sm.administration.revision ? '.' + sm.administration.revision : '')
      )

    // Use version of SMT specification
    if (sm?.semanticId?.keys[0]?.value) {
      const smt = smts.find(
        (smt: any) => sm.semanticId.keys[0].value === smt.semanticId,
      )
      if (smt) return smt.version
    }

    // Use version of from semanticId
    if (sm?.semanticId?.keys[0]?.value) {
      const semanticId = sm.semanticId.keys[0].value

      if (semanticId.startsWith('http') && extractVersionRevision(semanticId)) {
        return (
          extractVersionRevision(semanticId).version
          + (extractVersionRevision(semanticId).revision
            ? '.' + extractVersionRevision(semanticId).revision
            : '')
        )
      }
    }

    return ''
  }

  async function pushData (): Promise<void> {
    if (!selectedBusinessPartner.value || !selectedCatalogDataset.value) return

    const { endpoint, headers } = await fetchAssetEndpoint()

    try {
      headers.append('Content-Type', 'application/json')

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(aasSmDataToPush.value),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      edcStatus.value = 'Data pushed successfully'
    } catch (error) {
      console.error('Error pushing data:', error)
      edcStatus.value = `Error: Failed to push data - ${error instanceof Error ? error.message : 'Unknown error'}`
    } finally {
      fetchingAsset.value = false
    }
  }

  async function fetchAsset (): Promise<void> {
    if (!selectedBusinessPartner.value || !selectedCatalogDataset.value) return

    const { endpoint, headers } = await fetchAssetEndpoint()

    try {
      const response = await fetch(endpoint, { headers })
      const data = await response.json()
      assetJson.value = JSON.stringify(data)
      assetJsonParsed.value = data

      // 7. Format and highlight assetJson
      const formatted = formatJSON(assetJson.value)
      assetJsonFormatted.value
        = Prism && Prism.highlight
          ? Prism.highlight(formatted, getPrismJsonLanguage(), 'json')
          : formatted
      edcStatus.value = 'Asset fetched successfully'
    } catch (error) {
      console.error('Error fetching asset data:', error)
      edcStatus.value = 'Error: Failed to fetch data'
    } finally {
      fetchingAsset.value = false
    }
  }

  async function fetchAssetEndpoint (): Promise<{ endpoint: string, headers: Headers }> {
    fetchingAsset.value = true
    edcStatus.value = 'Initiating Contract Negotiation...'
    cancelFetchAsset.value = false

    const providerAssetId = selectedCatalogDataset.value['@id']
    const providerDspEndpoint = selectedBusinessPartner.value.dsp
    const providerBpn = selectedBusinessPartner.value.bpn

    // 1. Find offer
    const policy = Array.isArray(selectedCatalogDataset.value['odrl:hasPolicy'])
      ? selectedCatalogDataset.value['odrl:hasPolicy'][0]
      : selectedCatalogDataset.value['odrl:hasPolicy']

    if (!policy) {
      console.error('No policy found in dataset')
      edcStatus.value = 'Error: No policy found'
      fetchingAsset.value = false
      return { endpoint: '', headers: new Headers() }
    }

    const contractRequest: any = {
      counterPartyAddress: providerDspEndpoint,
      protocol: 'dataspace-protocol-http',
      policy: {
        '@id': policy['@id'],
        '@type': 'Offer',
        'assigner': providerBpn,
        'target': providerAssetId,
        'permission': [
          {
            action: 'use',
          },
        ],
        'prohibition': [],
        'obligation': [],
      },
    }

    // 1. Initiate Contract Negotiation
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      edcStatus.value = 'Fetch cancelled'
      return { endpoint: '', headers: new Headers() }
    }
    const negotiationResponse
      = await initiateContractNegotiation(contractRequest)
    if (!negotiationResponse) {
      edcStatus.value = 'Error: Failed to initiate negotiation'
      fetchingAsset.value = false
      return { endpoint: '', headers: new Headers() }
    }
    const negotiationId = negotiationResponse['@id']

    // 2. Polling Negotiation State until finalized
    let negotiationState = ''
    edcStatus.value = 'Waiting for Negotiation to be finalized...'
    while (negotiationState !== 'FINALIZED') {
      if (cancelFetchAsset.value) {
        fetchingAsset.value = false
        edcStatus.value = 'Fetch cancelled'
        return { endpoint: '', headers: new Headers() }
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      const stateResponse = await getContractNegotiationState(negotiationId)
      negotiationState = stateResponse?.state || ''
      if (negotiationState)
        edcStatus.value = `Negotiation state: ${negotiationState}`
    }

    if (negotiationState !== 'FINALIZED') {
      console.error('Negotiation failed or was terminated')
      edcStatus.value = 'Error: Negotiation failed'
      fetchingAsset.value = false
      return { endpoint: '', headers: new Headers() }
    }

    // Get the agreement ID from the negotiation
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      edcStatus.value = 'Fetch cancelled'
      return { endpoint: '', headers: new Headers() }
    }
    const negotiation = await getContractNegotiation(negotiationId)
    const contractAgreementId = negotiation?.contractAgreementId
    if (!contractAgreementId) {
      edcStatus.value = 'Error: No agreement ID found'
      fetchingAsset.value = false
      return { endpoint: '', headers: new Headers() }
    }

    // 3. Initiate Transfer Process
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      edcStatus.value = 'Fetch cancelled'
      return { endpoint: '', headers: new Headers() }
    }
    edcStatus.value = 'Initiating Transfer Process...'
    const transferRequest: any = {
      counterPartyAddress: providerDspEndpoint,
      counterPartyId: providerBpn,
      contractId: contractAgreementId,
      protocol: 'dataspace-protocol-http',
      assetId: providerAssetId,
      transferType: 'HttpData-PULL',
    }

    const transferResponse = await initiateTransferProcess(transferRequest)
    if (!transferResponse) {
      edcStatus.value = 'Error: Failed to initiate transfer'
      fetchingAsset.value = false
      return { endpoint: '', headers: new Headers() }
    }
    const transferProcessId = transferResponse['@id']

    // 4. Polling Transfer Process State until STARTED
    let transferState = ''
    edcStatus.value = 'Waiting for Transfer to start...'
    while (
      transferState !== 'STARTED'
      && transferState !== 'TERMINATED'
      && transferState !== 'COMPLETED'
    ) {
      if (cancelFetchAsset.value) {
        fetchingAsset.value = false
        edcStatus.value = 'Fetch cancelled'
        return { endpoint: '', headers: new Headers() }
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      const stateResponse = await getTransferProcessState(transferProcessId)
      transferState = stateResponse?.state || ''
      if (transferState) edcStatus.value = `Transfer state: ${transferState}`
    }

    if (transferState !== 'STARTED' && transferState !== 'COMPLETED') {
      console.error('Transfer failed or was terminated')
      edcStatus.value = 'Error: Transfer failed'
      fetchingAsset.value = false
      return { endpoint: '', headers: new Headers() }
    }

    // 5. Get EDR Data Address
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      edcStatus.value = 'Fetch cancelled'
      return { endpoint: '', headers: new Headers() }
    }
    edcStatus.value = 'Retrieving EDR Data Address...'
    const edr = await getEdrDataAddress(transferProcessId)
    if (!edr) {
      edcStatus.value = 'Error: Failed to retrieve EDR'
      fetchingAsset.value = false
      return { endpoint: '', headers: new Headers() }
    }

    // 6. Fetch Asset Data using endpoint and authorization
    if (cancelFetchAsset.value) {
      fetchingAsset.value = false
      edcStatus.value = 'Fetch cancelled'
      return { endpoint: '', headers: new Headers() }
    }
    edcStatus.value = 'Fetching Asset Data...'
    const endpoint = (edr as any).endpoint
    const token = (edr as any).authorization

    const headers = new Headers()
    if (token) {
      headers.append('Authorization', token)
    }

    return { endpoint, headers }
  }

  function prepareAasSmDataToPushJson () {
    if (justPushSmData.value) {
      aasSmDataToPush.value = selectedSms.value[0]
    } else {
      const environment = {
        assetAdministrationShells: [selectedAAS.value],
        submodels: selectedSms.value,
        conceptDescriptions: [],
      }
      aasSmDataToPush.value = environment
    }

    // aasSmDataToPushJson.value = JSON.stringify(aasSmDataToPush, null, 2)
  }
</script>

<style scoped>
:deep(.token) {
  line-height: 21px;
}

:deep(code) {
  line-height: 21px;
}

.json-content {
  word-wrap: normal;
  font-size: 14px;
  line-height: 21px;
  flex-grow: 0;
  overflow: auto;
  background-color: #f5f5f5;
}

.json-content code {
  display: block;
}

:deep(.token.punctuation) {
  color: #999;
}

:deep(.token.property) {
  color: #905;
}

:deep(.token.string) {
  color: #690;
}

:deep(.token.number) {
  color: #07a;
}

:deep(.token.boolean) {
  color: #07a;
}

:deep(.token.null) {
  color: #999;
}
</style>
