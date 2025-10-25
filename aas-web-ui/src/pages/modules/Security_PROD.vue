<!--
 * Security_PROD.vue - Production Version for BaSyx Security Plugin
 *
 * This Vue component provides a user interface for managing security rules
 * within the BaSyx Security Plugin. It includes features for viewing, creating,
 * editing, and deleting security rules, as well as filtering and searching
 * through existing rules. The component also integrates with external
 * documentation and authentication services.
 *
 * Features:
 * - **Header Section**:
 *   - Displays a consistent header with a title, subtitle, and warning message.
 *   - Provides links to external documentation and the authentication service admin interface.
 *
 * - **Rules Management**:
 *   - Displays a list of defined security rules in a table format.
 *   - Allows users to filter rules by search query, target type, and action.
 *   - Includes buttons for creating new rules and managing existing ones (edit/delete).
 *   - Provides tooltips for additional information on table headers and rule details.
 *
 * - **Dialogs**:
 *   - **Edit Rule Dialog**:
 *     - Allows users to modify an existing rule's role, actions, target type, and target IDs.
 *     - Includes validation for required fields.
 *   - **New Rule Dialog**:
 *     - Enables users to create a new security rule with auto-generated Rule ID Short.
 *     - Includes validation for required fields.
 *   - **Delete Confirmation Dialog**:
 *     - Confirms the deletion of a selected rule with a warning that the action is irreversible.
 *     - Displays rule details for verification.
 *
 * - **Error Handling**:
 *   - Displays error messages when rules fail to load or API calls fail.
 *   - Provides troubleshooting tips for common issues (e.g., incorrect URLs, missing permissions).
 *
 * - **API Call Logs**:
 *   - Logs API calls made by the component, including timestamps, actions, endpoints, payloads, and statuses.
 *   - Displays logs in reverse chronological order with success/error indicators.
 *
 * - **Styling and Layout**:
 *   - Utilizes Vuetify components for a responsive and visually consistent design.
 *   - Includes compact and dense layouts for better usability.
 *
 * Data:
 * - `searchQuery`: String for filtering rules by search query.
 * - `filterTargetType`: Selected target type for filtering rules.
 * - `filterAction`: Selected action for filtering rules.
 * - `isLoading`: Boolean indicating whether data is being loaded.
 * - `error`: Error message for failed rule loading.
 * - `securityRules`: Array of all security rules.
 * - `filteredRules`: Array of rules matching the current filters.
 * - `editRuleDialog`: Boolean for toggling the edit rule dialog.
 * - `newRuleDialog`: Boolean for toggling the new rule dialog.
 * - `deleteConfirmDialog`: Boolean for toggling the delete confirmation dialog.
 * - `editRuleData`: Object containing data for the rule being edited.
 * - `newRuleData`: Object containing data for the new rule being created.
 * - `ruleToDelete`: Object representing the rule selected for deletion.
 * - `dialogError`: Error message for dialog-specific errors.
 * - `apiLogs`: Array of API call logs.
 *
 * Methods:
 * - `fetchSecurityRules`: Fetches all security rules from the server and updates the local state.
 * - `openNewRuleDialog`: Opens the dialog for creating a new rule.
 * - `openEditRuleDialog(rule)`: Opens the dialog for editing a specific rule.
 * - `openDeleteConfirmDialog(rule)`: Opens the confirmation dialog for deleting a specific rule.
 * - `resetFilters`: Resets all filters to their default values.
 * - `updateSecurityRule`: Updates an existing security rule.
 * - `createNewSecurityRule`: Creates a new security rule.
 * - `cancelEditRule`: Cancels the edit rule operation and closes the dialog.
 * - `cancelNewRule`: Cancels the new rule creation and closes the dialog.
 * - `cancelDeleteRule`: Cancels the delete operation and closes the dialog.
 * - `confirmDeleteRule`: Confirms and deletes the selected rule.
 * - `getElementValue(elements, key)`: Retrieves the value of a specific key from an array of elements.
 * - `getElementValues(elements, key)`: Retrieves all values of a specific key from an array of elements.
 * - `findElement(elements, key)`: Finds an element in an array by its key.
 * - `loadRuleDetails(index)`: Loads the details of a specific rule for editing.
 * - `createNewRule`: Internal function that handles the creation of a new rule.
 * - `resetNewRuleForm`: Resets the form data for creating a new rule.
 * - `saveRuleDetails(index, isActive)`: Saves changes to an existing rule.
 * - `deleteRule(index, isActive)`: Internal function that handles the deletion of a rule.
 * - `roleNameExists(name, excludeIndex)`: Checks if a rule with the given name already exists.
 *
 * Dependencies:
 * - Vuetify components (e.g., `v-container`, `v-card`, `v-dialog`, `v-btn`, `v-table`, `v-alert`, etc.)
 * - Custom components (`UI-Header`, `API-Log`)
 *
 * Notes:
 * - The component assumes the existence of a Security Submodel and a properly configured Submodel Repository URL.
 * - Hardcoded links (e.g., authentication service admin interface) should be updated for production environments.
 *
 * Security Notes:
 * - **Production Environment**:
 *   - This is the production version of the security management interface
 *   - All API endpoints must be properly secured with HTTPS
 *   - Authentication service (Keycloak) must be properly configured and secured
 *   - Regular security audits and penetration testing required
 *
 * - **Authentication & Authorization**:
 *   - Strict role-based access control (RBAC) implementation required
 *   - All API calls must include valid authentication tokens
 *   - Session management with secure token handling
 *   - Implement rate limiting and request throttling
 *   - Regular review of user permissions and roles
 *
 * - **API Security**:
 *   - Implement proper CORS policies
 *   - Use secure headers (CSP, HSTS, etc.)
 *   - Regular API endpoint security testing
 *   - Implement API versioning and deprecation policies
 *   - Monitor and log all API access attempts
 *
 * - **Operational Security**:
 *   - Regular security updates and patch management
 *   - Implement proper error handling without exposing sensitive information
 *   - Regular review of security logs and audit trails
 *   - Document all security-related configurations and changes
 *   - Implement incident response procedures
 *
 * - **Best Practices**:
 *   - Regular security training for administrators
 *   - Implement change management procedures
 *   - Regular review of security policies and procedures
 *   - Maintain up-to-date security documentation
 *   - Regular backup and disaster recovery testing
 */
-->

<template>
    <v-container class="pa-md-12">
      <!-- UI-Header component for consistent header styling and layout across the application -->
      <UI-Header>
        <v-row class="align-center mb-4">
          <v-col cols="auto" class="pa-0 pl-2">
            <v-icon color="text" class="text-h4">mdi-shield-lock</v-icon>
          </v-col>
          <v-col>
            <h1 class="text-h4 font-weight-bold mb-0">Security Rule Management</h1>
          </v-col>
        </v-row>
        <h4 class="text-subtitle-1 mb-2 pb-2">
          <v-icon class="pb-1" color="text" icon="mdi-information" size="x-small"></v-icon>
          Manage access control rules via the Security Submodel
        </h4>
        <p class="text-orange-accent-4 font-weight-medium">
          <v-icon class="pb-1" color="warning" icon="mdi-alert" size="x-small"></v-icon>
          Changes can impact system access! Review carefully.
        </p>
        <v-divider class="ma-4"></v-divider>
        <!-- External documentation link -->
        <v-btn
          class="mr-2"
          color="blue"
          variant="tonal"
          style="min-width: auto; padding: 0 8px"
          :href="'https://basyx-security-plugin.gitbook.io/basyx-security'"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          prepend-icon="mdi-book-open-page-variant-outline">
          Documentation
        </v-btn>
        <!-- Link to Authentication Service admin interface - currently hardcoded -->
        <v-btn
          class="mr-2"
          color="blue"
          variant="tonal"
          style="min-width: auto; padding: 0 8px"
          :href="'http://localhost:9097/admin/master/console/#/BaSyx'"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          prepend-icon="mdi-key-variant">
          Authentication Service
        </v-btn>
      </UI-Header>

      <!-- Rules list with add button -->
      <v-card class="mt-6 pa-4">
        <v-card-title class="text-h5 d-flex justify-space-between">
          <span>Defined Security Rules</span>
          <v-btn color="primary" :disabled="isLoading" @click="openNewRuleDialog">
            <v-icon icon="mdi-plus" class="mr-1"></v-icon>
            New Rule
          </v-btn>
        </v-card-title>

        <v-card-text>
          <!-- Search and Filter Section -->
          <v-row class="mb-4 align-center">
            <v-col cols="12" sm="6" md="4">
              <v-text-field
                v-model="searchQuery"
                label="Search"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="Search in all fields...">
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filterAction"
                label="Action"
                :items="availableActions"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @update:model-value="value => filterAction = value && availableActions.includes(value as Action) ? value as Action : null">
              </v-select>
            </v-col>
            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="filterTargetType"
                label="Target Type"
                :items="Object.keys(targetInformationClassMap) as TargetType[]"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @update:model-value="value => filterTargetType = value && Object.keys(targetInformationClassMap).includes(value) ? value as TargetType : null">
              </v-select>
            </v-col>
            <v-col cols="12" sm="6" md="auto" class="d-flex align-center">
              <v-btn
                color="primary"
                variant="text"
                @click="resetFilters"
              >
                Reset Filters
              </v-btn>
            </v-col>
          </v-row>

          <!-- Loading indicator -->
          <v-progress-linear v-if="isLoading" indeterminate color="primary"></v-progress-linear>
          <!-- Error alert with troubleshooting information -->
          <v-alert v-if="error" type="warning" prominent border="start" class="mb-4">
            <p class="font-weight-bold">Error Loading Rules:</p>
            {{ error }}
            <p class="mt-2 text-caption">Possible causes:</p>

            <ul class="pl-4">
              <li>Submodel Repository URL incorrect or server unreachable.</li>
              <li>
                The Security Submodel ID (`{{ SECURITY_SUBMODEL_ID }}`) might not exist or its Base64
                representation (`{{ SECURITY_SUBMODEL_B64_ID }}`) is wrong for your deployment.
              </li>
              <li>Missing authentication token or insufficient permissions.</li>
              <li>CORS configuration issue on the server.</li>
            </ul>
          </v-alert>

          <!-- Rules table - only shown when rules exist and no errors -->
          <v-table
            v-if="!isLoading && !error && filteredRules.length > 0"
            density="compact"
            style="margin: 0 auto">
            <thead>
            <tr>
              <th style="width: 15%">Target Role</th>
              <th style="width: 15%">Actions</th>
              <th style="width: 15%">Target Type</th>
              <th style="width: 20%">Target IDs</th>
              <th style="width: 15%">
                Rule ID Short
                <v-tooltip location="bottom" text="Base64(Role + FirstAction + TargetInfoClass)"
                ><template #activator="{ props }"
                ><v-icon v-bind="props" size="xs" class="ml-1"
                >mdi-information-outline</v-icon
                ></template
                ></v-tooltip
                >
              </th>
              <th style="width: 20%; text-align: right">Manage</th>
            </tr>
            </thead>
            <tbody>
            <!-- Dynamic row for each rule -->
            <tr v-for="rule in filteredRules" :key="rule.idShort">
              <td>{{ getElementValue(rule.value, 'role') }}</td>
              <td>{{ getElementValues(rule.value, 'action').join(', ') }}</td>
              <td>
                {{
                  getElementValue(findElement(rule.value, 'targetInformation')?.value || [], '@type')
                }}
              </td>
              <td class="text-truncate" style="max-width: 200px">
                <div class="d-flex align-center">
                  <span class="text-truncate">
                    <!-- Display relevant Target IDs based on target type -->
                    {{ 
                      (() => {
                        const targetInfo = findElement(rule.value, 'targetInformation')?.value || [];
                        const targetType = getElementValue(targetInfo, '@type');
                        if (targetType === 'aas' || targetType === 'aas-registry') {
                          return getElementValues(targetInfo, 'aasIds').join(', ');
                        } else if (targetType === 'submodel' || targetType === 'submodel-registry') {
                          return getElementValues(targetInfo, 'submodelIds').join(', ');
                        }
                        return ''; // Return empty string if type is unknown
                      })()
                     }}
                  </span>
                  <!-- Conditionally display tooltip and icon -->
                  <template v-if="![...getElementValues(findElement(rule.value, 'targetInformation')?.value || [], 'aasIds'), ...getElementValues(findElement(rule.value, 'targetInformation')?.value || [], 'submodelIds')].every(id => id === '*') || [...getElementValues(findElement(rule.value, 'targetInformation')?.value || [], 'aasIds'), ...getElementValues(findElement(rule.value, 'targetInformation')?.value || [], 'submodelIds')].length !== 1">
                    <v-tooltip location="bottom">
                      <template v-slot:activator="{ props }">
                        <v-icon v-bind="props" size="xs" class="ml-1">mdi-eye-outline</v-icon>
                      </template>
                      <!-- Render each ID on a new line in the tooltip -->
                      <div class="d-flex flex-column">
                        <span v-for="id in 
                          (() => {
                            const targetInfo = findElement(rule.value, 'targetInformation')?.value || [];
                            const targetType = getElementValue(targetInfo, '@type');
                            if (targetType === 'aas' || targetType === 'aas-registry') {
                              return getElementValues(targetInfo, 'aasIds');
                            } else if (targetType === 'submodel' || targetType === 'submodel-registry') {
                              return getElementValues(targetInfo, 'submodelIds');
                            }
                            return [];
                          })()
                         " :key="id">
                          {{ id }}
                        </span>
                      </div>
                    </v-tooltip>
                  </template>
                </div>
              </td>
              <td class="text-truncate" style="max-width: 150px">
                <!-- Display ID with tooltip for full value -->
                <div class="d-flex align-center">
                  <span class="text-truncate">{{ decodeBase64(rule.idShort) }}</span>
                  <v-tooltip location="bottom" :text="decodeBase64(rule.idShort)">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="xs" class="ml-1">mdi-eye-outline</v-icon>
                    </template>
                  </v-tooltip>
                  <v-tooltip location="bottom" text="Copy to clipboard">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        size="x-small"
                        variant="text"
                        color="primary"
                        class="ml-1"
                        @click="copyToClipboard(decodeBase64(rule.idShort))">
                        <v-icon size="xs">mdi-content-copy</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </div>
              </td>
              <td style="text-align: right">
                <div class="d-flex justify-end">
                  <!-- Edit and delete action buttons -->
                  <v-btn
                    text="Edit"
                    size="small"
                    variant="tonal"
                    color="primary"
                    class="mr-2"
                    @click="openEditRuleDialog(rule)">
                  </v-btn>
                  <v-btn
                    text="Delete"
                    size="small"
                    variant="tonal"
                    color="error"
                    @click="openDeleteConfirmDialog(rule)">
                  </v-btn>
                </div>
              </td>
            </tr>
            </tbody>
          </v-table>
          <!-- Empty state message when no rules exist or no matches found -->
          <div v-if="!isLoading && !error && filteredRules.length === 0" class="text-center text-grey py-4">
            <v-icon size="large" class="mb-2">mdi-text-box-search-outline</v-icon>
            <p v-if="securityRules.length === 0">No security rules found in the submodel.</p>
            <p v-else>No rules match your search criteria.</p>
            <p class="text-caption" v-if="securityRules.length === 0">
              Ensure the Security Submodel exists at the configured URL and contains rules.
            </p>
          </div>
        </v-card-text>
      </v-card>

      <!-- Edit rule dialog form -->
      <v-dialog v-model="editRuleDialog" max-width="650" persistent>
        <v-card>
          <v-card-title>Edit Rule</v-card-title>
          <v-card-subtitle class="mb-2">The rule ID remains unchanged.</v-card-subtitle>
          <v-divider></v-divider>
          <v-card-text>
            <!-- Dialog-specific error message -->
            <v-alert v-if="dialogError" type="error" density="compact" class="mb-3">
              {{ dialogError }}
            </v-alert>
            <v-form ref="editRuleFormRef" @submit.prevent="updateSecurityRule">
              <!-- Role input field -->
              <v-text-field
                v-model="editRuleData.role"
                label="Target Role/Context*"
                variant="outlined"
                class="mb-6"
                hint="The role defined in the authentication service that this rule applies to"
                persistent-hint
                :rules="[(v) => !!v || 'Target Role is required']"
                required></v-text-field>
              <!-- Actions multi-select -->
              <v-select
                v-model="editRuleData.actions"
                label="Allowed Actions*"
                :items="['READ', 'WRITE', 'DELETE', 'EXECUTE']"
                multiple
                chips
                variant="outlined"
                class="mb-6"
                hint="Select one or more actions for this role."
                persistent-hint
                :rules="[(v) => v.length > 0 || 'At least one action is required']"
                required></v-select>
              <v-divider class="my-3"></v-divider>
              <p class="text-subtitle-1 mb-2">Target Information</p>
              <!-- Target type dropdown -->
              <v-select
                v-model="editRuleData.targetType"
                label="Target Type*"
                :items="Object.keys(targetInformationClassMap)"
                variant="outlined"
                class="mb-6"
                hint="Specify which target resource type and which IDs the rule should be applied to."
                persistent-hint
                :rules="[(v) => !!v || 'Target Type is required']"
                required></v-select>
              <!-- Target IDs multi-line input -->
              <v-textarea
                v-model="editRuleData.targetIds"
                label="Target IDs* (one per line)"
                variant="outlined"
                rows="3"
                class="mb-6"
                placeholder="example id short: HARTING_AAS_ZSN1"
                hint="Use '*' as a wildcard."
                persistent-hint
                :rules="[(v) => !!v || 'At least one Target ID is required']"
                required></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" text="Cancel" variant="text" @click="cancelEditRule">Cancel</v-btn>
            <v-btn color="primary" text="Update" :loading="isLoading" @click="updateSecurityRule">
              Update
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- New rule dialog form - similar structure to edit dialog -->
      <v-dialog v-model="newRuleDialog" max-width="650" persistent>
        <v-card>
          <v-card-title>Create New Security Rule</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <!-- Dialog-specific error message -->
            <v-alert v-if="dialogError" type="error" density="compact" class="mb-3">
              {{ dialogError }}
            </v-alert>
            <v-form ref="newRuleFormRef" @submit.prevent="createNewSecurityRule">
              <!-- Role input field -->
              <v-text-field
                v-model="newRuleData.role"
                label="Target Role/Context*"
                variant="outlined"
                class="mb-6"
                hint="The role defined in Keycloak this rule applies to (e.g., ManufacturerFrame, admin)"
                persistent-hint
                :rules="[(v) => !!v || 'Target Role is required']"
                required></v-text-field>
              <!-- Actions multi-select -->
              <v-select
                v-model="newRuleData.actions"
                label="Allowed Actions*"
                :items="['READ', 'WRITE', 'DELETE', 'EXECUTE']"
                multiple
                chips
                variant="outlined"
                class="mb-6"
                hint="Select one or more actions allowed for this role/target."
                persistent-hint
                :rules="[(v) => v.length > 0 || 'At least one action is required']"
                required></v-select>
              <v-divider class="my-3"></v-divider>
              <p class="text-subtitle-1 mb-2">Target Information</p>
              <!-- Target type dropdown -->
              <v-select
                v-model="newRuleData.targetType"
                label="Target Type*"
                :items="Object.keys(targetInformationClassMap)"
                variant="outlined"
                class="mb-6"
                hint="Specify what target resource type and specific IDs the rule applies to."
                persistent-hint
                :rules="[(v) => !!v || 'Target Type is required']"
                required></v-select>
              <!-- Target IDs multi-line input -->
              <v-textarea
                v-model="newRuleData.targetIds"
                label="Target IDs* (one per line)"
                variant="outlined"
                rows="3"
                class="mb-6"
                placeholder="example id short: HARTING_AAS_ZSN1"
                hint="Use '*' as a wildcard for all."
                persistent-hint
                :rules="[(v) => !!v || 'At least one Target ID is required']"
                required></v-textarea>
              <!-- Target element paths input -->
              <v-textarea
                v-model="newRuleData.targetElementPaths"
                label="Target Element Paths* (one per line)"
                variant="outlined"
                rows="3"
                class="mb-6"
                placeholder="example path: /components/1"
                hint="Use '*' as a wildcard for all."
                persistent-hint
                :rules="[(v) => !!v || 'At least one Target Element Path is required']"
                required></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" text="Cancel" variant="text" @click="cancelNewRule">Cancel</v-btn>
            <v-btn color="primary" text="Create Rule" :loading="isLoading" @click="createNewSecurityRule">
              Create Rule
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete confirmation dialog -->
      <v-dialog v-model="deleteConfirmDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="bg-error text-white d-flex align-center">
            <v-icon class="mr-2">mdi-delete</v-icon>
            Delete Security Rule
          </v-card-title>
          <v-card-text class="pt-4">
            <!-- Dialog-specific error message -->
            <v-alert v-if="dialogError" type="error" density="compact" class="mb-3">
              {{ dialogError }}
            </v-alert>
            
            <!-- Warning message -->
            <v-alert type="error" variant="tonal" class="mb-4">
              <template v-slot:prepend>
                <v-icon icon="mdi-alert-circle"></v-icon>
              </template>
              <span class="font-weight-medium">This action cannot be undone!</span>
            </v-alert>

            <!-- Rule details section -->
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <div class="d-flex flex-column gap-2">
                  <!-- Target Role -->
                  <div class="d-flex align-center">
                    <span class="text-subtitle-2 mr-2">Target Role:</span>
                    <span class="font-weight-medium">{{ getElementValue(ruleToDelete?.value || [], 'role') }}</span>
                  </div>

                  <!-- Actions -->
                  <div class="d-flex align-center">
                    <span class="text-subtitle-2 mr-2">Actions:</span>
                    <span class="font-weight-medium">{{ getElementValues(ruleToDelete?.value || [], 'action').join(', ') }}</span>
                  </div>

                  <!-- Target Type -->
                  <div class="d-flex align-center">
                    <span class="text-subtitle-2 mr-2">Target Type:</span>
                    <span class="font-weight-medium">{{
                      getElementValue(
                        findElement(ruleToDelete?.value || [], 'targetInformation')?.value || [],
                        '@type'
                      )
                    }}</span>
                  </div>

                  <!-- Rule ID Short -->
                  <div class="d-flex align-center">
                    <span class="text-subtitle-2 mr-2">Rule ID Short:</span>
                    <div class="d-flex align-center">
                      <span class="text-truncate font-weight-medium" style="max-width: 200px">
                        {{ decodeBase64(ruleToDelete?.idShort || '') }}
                      </span>
                      <v-tooltip location="bottom" :text="decodeBase64(ruleToDelete?.idShort || '')">
                        <template #activator="{ props }">
                          <v-icon v-bind="props" size="xs" class="ml-1">mdi-eye-outline</v-icon>
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <p class="text-body-2 text-medium-emphasis">
              Are you sure you want to delete this security rule? This will permanently remove the rule and its associated permissions.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" text="Cancel" variant="text" @click="cancelDeleteRule">Cancel</v-btn>
            <v-btn color="error" text="Delete" :loading="isLoading" @click="confirmDeleteRule">
              <v-icon start icon="mdi-delete" class="mr-1"></v-icon>
              Delete Rule
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Spacer between the cards -->
      <div style="height: 20px;"></div>

      <!-- API call logging component -->
      <API-Log class="mt-12">
        <v-card>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-api</v-icon>
                <span class="text-h5">API Call Logs</span>
                <!-- Badge showing number of logs -->
                <template #actions="{ expanded }">
                  <v-chip
                    size="small"
                    :color="expanded ? 'primary' : 'grey'"
                    variant="tonal"
                    class="ml-2">
                    {{ apiLogs.length }}
                  </v-chip>
                </template>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <!-- Empty state when no logs exist -->
                <div v-if="apiLogs.length === 0" class="text-center pa-4 text-grey">
                  <v-icon icon="mdi-information-outline" size="large"></v-icon>
                  <p class="mt-2">No API calls logged yet.</p>
                </div>
                <!-- Log entries in reverse chronological order -->
                <div
                  v-for="(log, index) in apiLogs.slice().reverse()"
                  :key="index"
                  class="pa-3 mb-3 rounded"
                  :style="{
                    borderLeft: '4px solid ' + (log.success ? '#4caf50' : '#f44336'),
                    backgroundColor: log.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                    marginBottom: '10px'
                  }">
                  <p><strong>Timestamp:</strong> {{ new Date(log.timestamp).toLocaleString() }}</p>
                  <p><strong>Action:</strong> {{ log.action }}</p>
                  <p><strong>Call:</strong> {{ log.method }} {{ log.endpoint }}</p>
                  <!-- Request payload with special formatting -->
                  <div v-if="log.payload !== 'N/A'">
                    <strong>Payload:</strong>
                    <pre style="
                      white-space: pre-wrap;
                      word-break: break-all;
                      background-color: rgba(0, 0, 0, 0.05);
                      padding: 8px;
                      border-radius: 4px;
                      margin-top: 4px;
                      max-height: 200px;
                      overflow-y: auto;
                      font-family: monospace;
                      font-size: 0.85em;
                    ">{{ log.payload }}</pre>
                  </div>
                  <p>
                    <strong>Status:</strong>
                    <v-chip :color="log.success ? 'success' : 'error'" size="small" variant="tonal">
                      {{ log.status }}
                    </v-chip>
                  </p>
                  <!-- Error message if applicable -->
                  <p v-if="!log.success && log.error"><strong>Error:</strong> {{ log.error }}</p>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </API-Log>
    </v-container>
  </template>

<script setup lang="ts">
    import { reactive, ref, onMounted, computed } from 'vue';
    import { useRequestHandling } from '@/composables/RequestHandling';
    import { VForm } from 'vuetify/components';

    // BaSyx Model and RBAC Rule Interfaces
    interface BaSyxProperty<T = string> {
        modelType: 'Property';
        idShort: string;
        value: T;
    }

    interface BaSyxSubmodelElementList<T = BaSyxProperty> {
        modelType: 'SubmodelElementList';
        idShort: string;
        orderRelevant?: boolean;
        value: T[];
    }

    type BaSyxSubmodelElementCollectionValue = BaSyxProperty | BaSyxSubmodelElementList | BaSyxSubmodelElementCollection;

    interface BaSyxSubmodelElementCollection {
        modelType: 'SubmodelElementCollection';
        idShort: string;
        value: BaSyxSubmodelElementCollectionValue[];
    }

    interface BaSyxTargetInformation {
        modelType: 'SubmodelElementCollection';
        idShort: string; // Should be 'targetInformation'
        value: (
            | BaSyxProperty<'aas' | 'submodel' | 'aas-registry' | 'submodel-registry' | string> // For @type
            | BaSyxSubmodelElementList<BaSyxProperty<string>> // For aasIds, submodelIds, submodelElementIdShortPaths
        )[];
    }

    interface SecurityRule {
        modelType: 'SubmodelElementCollection';
        idShort: string;
        value: [
            BaSyxProperty<string>,                       // Role Property
            BaSyxSubmodelElementList<BaSyxProperty<string>>,  // Actions List
            BaSyxTargetInformation                       // TargetInformation Collection
        ];
    }

    interface ApiLog {
        action: string;
        method: string;
        endpoint: string;
        headers: string;
        payload: string;
        success: boolean;
        timestamp: string;
        status: string;
        error?: string;
    }

    interface DialogState {
        value: boolean;
    }

    interface FormData {
        idShort: string;
        role: string;
        actions: string[];
        targetType: string;
        targetIds: string;
        targetElementPaths: string;
    }

    interface ErrorWithStatus extends Error {
        status?: number;
    }

    // Component state
    const securityRules = ref<SecurityRule[]>([]);
    const apiLogs = ref<ApiLog[]>([]);
    const newRuleDialog = ref<boolean>(false);
    const editRuleDialog = ref<boolean>(false);
    const deleteConfirmDialog = ref<boolean>(false);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const dialogError = ref<string | null>(null);
    const roleNameError = ref('');
    const ruleIdError = ref('');
    const currentRuleIndex = ref(-1);
    const ruleToDelete = ref<SecurityRule | null>(null);

    // Form refs
    const newRuleFormRef = ref<InstanceType<typeof VForm> | null>(null);
    const editRuleFormRef = ref<InstanceType<typeof VForm> | null>(null);

    // Form data
    const newRuleData = reactive<FormData>({
        idShort: '',
        role: '',
        actions: ['READ'],
        targetType: '',
        targetIds: '',
        targetElementPaths: ''
    });

    const editRuleData = reactive<FormData>({
        idShort: '',
        role: '',
        actions: [],
        targetType: '',
        targetIds: '',
        targetElementPaths: ''
    });

    // Types
    type TargetType = 'aas-registry' | 'aas' | 'submodel-registry' | 'submodel';
    type Action = 'READ' | 'WRITE' | 'DELETE' | 'EXECUTE';

    // Constants
    const SECURITY_SUBMODEL_ID = 'SecuritySubmodel';
    const SECURITY_SUBMODEL_B64_ID = 'U2VjdXJpdHlTdWJtb2RlbA==';
    const submodelUrl = `/submodels/${SECURITY_SUBMODEL_B64_ID}`;
    const submodelElementsUrl = `/submodels/${SECURITY_SUBMODEL_B64_ID}/submodel-elements`;

    const availableActions = ['READ', 'WRITE', 'DELETE', 'EXECUTE'] as const;

    const targetInformationClassMap: Record<TargetType, string> = {
        'aas-registry': 'AAS Registry',
        'aas': 'Asset Administration Shell',
        'submodel-registry': 'Submodel Registry',
        'submodel': 'Submodel'
    };

    // API handling
    const { getRequest, postRequest, putRequest, deleteRequest } = useRequestHandling();

    // Helper functions
    const getElementValue = (elements: any[], idShort: string): string => {
        const element = elements.find(el => el.idShort === idShort);
        return element?.value || '';
    };

    const getElementValues = (elements: any[], idShort: string): string[] => {
        const element = elements.find(el => el.idShort === idShort);
        if (!element || !element.value) return [];
        return element.value.map((v: any) => v.value);
    };

    const findElement = (elements: any[], idShort: string): any => {
        return elements.find(el => el.idShort === idShort);
    };

    // Dialog handlers
    const openNewRuleDialog = () => {
        newRuleDialog.value = true;
    };

    const openEditRuleDialog = (rule: SecurityRule) => {
        editRuleData.role = getElementValue(rule.value, 'role');
        editRuleData.actions = getElementValues(rule.value, 'action');
        const targetInfo = findElement(rule.value, 'targetInformation');
        if (targetInfo) {
            editRuleData.targetType = getElementValue(targetInfo.value, '@type');
            const aasIds = getElementValues(targetInfo.value, 'aasIds');
            const submodelIds = getElementValues(targetInfo.value, 'submodelIds');
            editRuleData.targetIds = [...aasIds, ...submodelIds].join('\n');
            editRuleData.targetElementPaths = getElementValues(targetInfo.value, 'submodelElementIdShortPaths').join('\n');
        }
        editRuleDialog.value = true;
    };

    const openDeleteConfirmDialog = (rule: SecurityRule) => {
        ruleToDelete.value = rule;
        deleteConfirmDialog.value = true;
    };

    const cancelEditRule = () => {
        editRuleDialog.value = false;
        dialogError.value = null;
    };

    const cancelDeleteRule = () => {
        deleteConfirmDialog.value = false;
        ruleToDelete.value = null;
        dialogError.value = null;
    };

    const confirmDeleteRule = async () => {
        if (!ruleToDelete.value) return;
        try {
            isLoading.value = true;
            await deleteRule(securityRules.value.indexOf(ruleToDelete.value), { value: deleteConfirmDialog.value });
        } catch (err) {
            dialogError.value = 'Failed to delete rule';
        } finally {
            isLoading.value = false;
        }
    };

    const createNewSecurityRule = async () => {
        try {
            isLoading.value = true;
            await createNewRule();
        } catch (err) {
            dialogError.value = 'Failed to create new rule';
        } finally {
            isLoading.value = false;
        }
    };

    const updateSecurityRule = async () => {
        try {
            isLoading.value = true;
            await saveRuleDetails(currentRuleIndex.value, { value: editRuleDialog.value });
        } catch (err) {
            dialogError.value = 'Failed to update rule';
        } finally {
            isLoading.value = false;
        }
    };

    // Lifecycle hooks
    onMounted(() => {
        fetchSecurityRules();
    });

    // API functions
    const fetchSecurityRules = async () => {
        try {
            const response = await getRequest(submodelUrl, 'Fetching security submodel', false);

            if (!response) {
                throw new Error('No response from server');
            }

            let rulesArray: SecurityRule[] = [];
            let sourceObject = response;

            if (response && (response as any).data) sourceObject = (response as any).data;
            else if (response && (response as any).value) sourceObject = (response as any).value;

            if (sourceObject && Array.isArray(sourceObject.submodelElements)) {
                rulesArray = sourceObject.submodelElements as SecurityRule[];
            } else if (Array.isArray(sourceObject)) {
                 rulesArray = sourceObject as SecurityRule[];
            } else {
                throw new Error('Unexpected response structure or no submodelElements array found');
            }

            securityRules.value = rulesArray;
            apiLogs.value.push({
                action: 'Fetch security rules',
                method: 'GET',
                endpoint: submodelUrl,
                headers: 'Handled by Composable',
                payload: 'N/A',
                success: true,
                timestamp: new Date().toISOString(),
                status: '200 OK'
            });
        } catch (err: unknown) {
            console.error('Error fetching security rules:', err);
            securityRules.value = [];
            apiLogs.value.push({
                action: 'Fetch security rules (FAILED)',
                method: 'GET',
                endpoint: submodelUrl,
                headers: 'Handled by Composable',
                payload: 'N/A',
                success: false,
                timestamp: new Date().toISOString(),
                status: err instanceof Error && err.message.includes('unreachable') ? '503 Service Unavailable' : '500 Internal Server Error',
                error: err instanceof Error ? err.message : 'Server not available'
            });
            error.value = 'Failed to fetch security rules: Server not available';
        }
    };

    // Rule management functions
    const createNewRule = async (): Promise<void> => {
        if (!newRuleData.role || newRuleData.role.trim() === '') {
            roleNameError.value = 'Role name for the rule cannot be empty';
            apiLogs.value.push({
                action: 'Create new rule (FAILED)',
                method: 'POST',
                endpoint: submodelElementsUrl,
                headers: 'Handled by Composable',
                payload: JSON.stringify(newRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'Role name is required'
            });
            return;
        }

        if (!newRuleData.actions || newRuleData.actions.length === 0) {
            dialogError.value = 'At least one action must be selected';
            apiLogs.value.push({
                action: 'Create new rule (FAILED)',
                method: 'POST',
                endpoint: submodelElementsUrl,
                headers: 'Handled by Composable',
                payload: JSON.stringify(newRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'At least one action is required'
            });
            return;
        }

        if (!newRuleData.targetType) {
            dialogError.value = 'Target type must be selected';
            apiLogs.value.push({
                action: 'Create new rule (FAILED)',
                method: 'POST',
                endpoint: submodelElementsUrl,
                headers: 'Handled by Composable',
                payload: JSON.stringify(newRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'Target type is required'
            });
            return;
        }

        // Convert targetIds from string to array
        const targetIdsArray = newRuleData.targetIds
            .split('\n')
            .map((id: string) => id.trim())
            .filter((id: string) => id);

        if (targetIdsArray.length === 0) {
            dialogError.value = 'At least one target ID must be provided';
            apiLogs.value.push({
                action: 'Create new rule (FAILED)',
                method: 'POST',
                endpoint: submodelElementsUrl,
                headers: 'Handled by Composable',
                payload: JSON.stringify(newRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'At least one target ID is required'
            });
            return;
        }

        if (newRuleData.targetType === 'submodel') {
            const pathsArray = newRuleData.targetElementPaths
                .split('\n')
                .map((path: string) => path.trim())
                .filter((path: string) => path);

            if (pathsArray.length === 0) {
                dialogError.value = 'Target element paths are required for submodel target type.';
                apiLogs.value.push({
                    action: 'Create new rule (FAILED)',
                    method: 'POST',
                    endpoint: submodelElementsUrl,
                    headers: 'Handled by Composable',
                    payload: JSON.stringify(newRuleData),
                    success: false,
                    timestamp: new Date().toISOString(),
                    status: '400 Bad Request',
                    error: 'Target element paths required'
                });
                return;
            }
        }

        // Generate idShort based on role, first action and target type
        const firstAction = newRuleData.actions[0];
        const idShortStringToEncode = `${newRuleData.role}${firstAction}${newRuleData.targetType}`;
        newRuleData.idShort = btoa(idShortStringToEncode);

        if (roleNameExists(newRuleData.idShort)) {
            roleNameError.value = 'A rule with this ID already exists';
            apiLogs.value.push({
                action: 'Create new rule (FAILED)',
                method: 'POST',
                endpoint: submodelElementsUrl,
                headers: 'Handled by Composable',
                payload: JSON.stringify(newRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '409 Conflict',
                error: 'Rule with this ID already exists'
            });
            return;
        }

        const targetInformationValue: (BaSyxProperty<string> | BaSyxSubmodelElementList<BaSyxProperty<string>>)[] = [];

        if (newRuleData.targetType) {
            targetInformationValue.push({
                modelType: 'Property',
                idShort: '@type',
                value: newRuleData.targetType
            } as BaSyxProperty<string>);

            let idListName: string | undefined;
            if (newRuleData.targetType === 'aas' || newRuleData.targetType === 'aas-registry') {
                idListName = 'aasIds';
            } else if (newRuleData.targetType === 'submodel' || newRuleData.targetType === 'submodel-registry') {
                idListName = 'submodelIds';
            }

            if (idListName && targetIdsArray.length > 0) {
                targetInformationValue.push({
                    modelType: 'SubmodelElementList',
                    idShort: idListName,
                    orderRelevant: false,
                    value: targetIdsArray.map((idVal: string) => (
                        { modelType: 'Property', idShort: 'id', value: idVal } as BaSyxProperty<string>
                    ))
                } as BaSyxSubmodelElementList<BaSyxProperty<string>>);
            }

            if (newRuleData.targetType === 'submodel' && newRuleData.targetElementPaths) {
                const pathsArray = newRuleData.targetElementPaths
                    .split('\n')
                    .map((path: string) => path.trim())
                    .filter((path: string) => path);

                if (pathsArray.length > 0) {
                    targetInformationValue.push({
                        modelType: 'SubmodelElementList',
                        idShort: 'submodelElementIdShortPaths',
                        orderRelevant: true,
                        value: pathsArray.map((pathVal: string) => (
                            { modelType: 'Property', idShort: 'path', value: pathVal } as BaSyxProperty<string>
                        ))
                    } as BaSyxSubmodelElementList<BaSyxProperty<string>>);
                }
            }
        }

        const ruleToAdd: SecurityRule = {
            modelType: 'SubmodelElementCollection',
            idShort: newRuleData.idShort,
            value: [
                { modelType: 'Property', idShort: 'role', value: newRuleData.role.trim() } as BaSyxProperty<string>,
                {
                    modelType: 'SubmodelElementList',
                    idShort: 'action',
                    orderRelevant: true,
                    value: (newRuleData.actions as string[]).map((actionName: string) => (
                        { modelType: 'Property', idShort: actionName, value: actionName } as BaSyxProperty<string>
                    ))
                } as BaSyxSubmodelElementList<BaSyxProperty<string>>,
                {
                    modelType: 'SubmodelElementCollection',
                    idShort: 'targetInformation',
                    value: targetInformationValue
                } as BaSyxTargetInformation
            ]
        };

        try {
            const response = await postRequest(submodelElementsUrl, ruleToAdd, new Headers(), 'Creating new security rule', false, undefined);

            if (!response || !response.success) {
                throw new Error('Failed to create rule: Server not available');
            }

            apiLogs.value.push({
                action: 'Create new rule',
                method: 'POST',
                endpoint: submodelElementsUrl,
                headers: 'Handled by Composable',
                payload: JSON.stringify(ruleToAdd, null, 2),
                success: true,
                timestamp: new Date().toISOString(),
                status: '201 Created'
            });
            fetchSecurityRules();
            resetNewRuleForm();
            newRuleDialog.value = false;
        } catch (error) {
            console.error('Error creating new rule:', error);
            apiLogs.value.push({
                action: 'Create new rule (FAILED)',
                method: 'POST',
                endpoint: submodelElementsUrl,
                headers: 'Handled by Composable',
                payload: JSON.stringify(ruleToAdd, null, 2),
                success: false,
                timestamp: new Date().toISOString(),
                status: '404',
                error: error instanceof Error ? error.message : 'Server not available'
            });
            dialogError.value = 'Failed to create rule: Server not available';
        }
    };

    const resetNewRuleForm = (): void => {
        newRuleData.idShort = '';
        newRuleData.role = '';
        newRuleData.actions = ['READ'];
        newRuleData.targetType = '';
        newRuleData.targetIds = '';
        newRuleData.targetElementPaths = '';
        roleNameError.value = '';
        ruleIdError.value = '';
    };

    const cancelNewRule = (): void => {
        resetNewRuleForm();
        newRuleDialog.value = false;
    };

    const saveRuleDetails = async (index: number, isActive: DialogState): Promise<void> => {
        if (!editRuleData.role || editRuleData.role.trim() === '') {
            roleNameError.value = 'Role name for the rule cannot be empty';
            apiLogs.value.push({
                action: 'Update rule details (FAILED)',
                method: 'PUT',
                endpoint: `${submodelElementsUrl}/${securityRules.value[index].idShort}`,
                headers: 'Handled by Composable',
                payload: JSON.stringify(editRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'Role name is required'
            });
            return;
        }

        if (!editRuleData.actions || editRuleData.actions.length === 0) {
            dialogError.value = 'At least one action must be selected';
            apiLogs.value.push({
                action: 'Update rule details (FAILED)',
                method: 'PUT',
                endpoint: `${submodelElementsUrl}/${securityRules.value[index].idShort}`,
                headers: 'Handled by Composable',
                payload: JSON.stringify(editRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'At least one action is required'
            });
            return;
        }

        if (!editRuleData.targetType) {
            dialogError.value = 'Target type must be selected';
            apiLogs.value.push({
                action: 'Update rule details (FAILED)',
                method: 'PUT',
                endpoint: `${submodelElementsUrl}/${securityRules.value[index].idShort}`,
                headers: 'Handled by Composable',
                payload: JSON.stringify(editRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'Target type is required'
            });
            return;
        }

        // Convert targetIds from string to array
        const targetIdsArray = editRuleData.targetIds
            .split('\n')
            .map((id: string) => id.trim())
            .filter((id: string) => id);

        if (targetIdsArray.length === 0) {
            dialogError.value = 'At least one target ID must be provided';
            apiLogs.value.push({
                action: 'Update rule details (FAILED)',
                method: 'PUT',
                endpoint: `${submodelElementsUrl}/${securityRules.value[index].idShort}`,
                headers: 'Handled by Composable',
                payload: JSON.stringify(editRuleData),
                success: false,
                timestamp: new Date().toISOString(),
                status: '400 Bad Request',
                error: 'At least one target ID is required'
            });
            return;
        }

        const oldIdShort = securityRules.value[index].idShort;
        const targetInformationValueUpdate: (BaSyxProperty<string> | BaSyxSubmodelElementList<BaSyxProperty<string>>)[] = [];

        if (editRuleData.targetType) {
            targetInformationValueUpdate.push({
                modelType: 'Property',
                idShort: '@type',
                value: editRuleData.targetType
            } as BaSyxProperty<string>);

            let idListName: string | undefined;
            if (editRuleData.targetType === 'aas' || editRuleData.targetType === 'aas-registry') {
                idListName = 'aasIds';
            } else if (editRuleData.targetType === 'submodel' || editRuleData.targetType === 'submodel-registry') {
                idListName = 'submodelIds';
            }

            if (idListName && targetIdsArray.length > 0) {
                targetInformationValueUpdate.push({
                    modelType: 'SubmodelElementList',
                    idShort: idListName,
                    orderRelevant: false,
                    value: targetIdsArray.map((idVal: string) => (
                        { modelType: 'Property', idShort: 'id', value: idVal } as BaSyxProperty<string>
                    ))
                } as BaSyxSubmodelElementList<BaSyxProperty<string>>);
            }

            if (editRuleData.targetType === 'submodel' && editRuleData.targetElementPaths) {
                const pathsArray = editRuleData.targetElementPaths
                    .split('\n')
                    .map((path: string) => path.trim())
                    .filter((path: string) => path);

                if (pathsArray.length > 0) {
                    targetInformationValueUpdate.push({
                        modelType: 'SubmodelElementList',
                        idShort: 'submodelElementIdShortPaths',
                        orderRelevant: true,
                        value: pathsArray.map((pathVal: string) => (
                            { modelType: 'Property', idShort: 'path', value: pathVal } as BaSyxProperty<string>
                        ))
                    } as BaSyxSubmodelElementList<BaSyxProperty<string>>);
                }
            }
        }

        const updatedRule: SecurityRule = {
            modelType: 'SubmodelElementCollection',
            idShort: oldIdShort,
            value: [
                { modelType: 'Property', idShort: 'role', value: editRuleData.role.trim() } as BaSyxProperty<string>,
                {
                    modelType: 'SubmodelElementList',
                    idShort: 'action',
                    orderRelevant: true,
                    value: (editRuleData.actions as string[]).map((actionName: string) => (
                        { modelType: 'Property', idShort: actionName, value: actionName } as BaSyxProperty<string>
                    ))
                } as BaSyxSubmodelElementList<BaSyxProperty<string>>,
                {
                    modelType: 'SubmodelElementCollection',
                    idShort: 'targetInformation',
                    value: targetInformationValueUpdate
                } as BaSyxTargetInformation
            ]
        };

        try {
            const response = await putRequest(`${submodelElementsUrl}/${oldIdShort}`, updatedRule, new Headers(), 'Updating security rule', false);

            if (!response) {
                throw new Error('No response from server');
            }

            apiLogs.value.push({
                action: 'Update rule details',
                method: 'PUT',
                endpoint: `${submodelElementsUrl}/${oldIdShort}`,
                headers: 'Handled by Composable',
                payload: JSON.stringify(updatedRule, null, 2),
                success: true,
                timestamp: new Date().toISOString(),
                status: '200 OK'
            });
            fetchSecurityRules();
            roleNameError.value = '';
            ruleIdError.value = '';
            isActive.value = false;
        } catch (error) {
            console.error('Error updating rule:', error);
            apiLogs.value.push({
                action: 'Update rule details (FAILED)',
                method: 'PUT',
                endpoint: `${submodelElementsUrl}/${oldIdShort}`,
                headers: 'Handled by Composable',
                payload: JSON.stringify(updatedRule, null, 2),
                success: false,
                timestamp: new Date().toISOString(),
                status: '404',
                error: error instanceof Error ? error.message : 'Server not available'
            });
            dialogError.value = 'Failed to update rule: Server not available';
        }
    };

    const deleteRule = async (index: number, isActive: DialogState): Promise<void> => {
        const ruleIdShort = securityRules.value[index].idShort;

        try {
            const response = await deleteRequest(`${submodelElementsUrl}/${ruleIdShort}`, 'Deleting security rule', false);

            if (!response) {
                throw new Error('No response from server');
            }

            apiLogs.value.push({
                action: 'Delete rule',
                method: 'DELETE',
                endpoint: `${submodelElementsUrl}/${ruleIdShort}`,
                headers: 'Handled by Composable',
                payload: 'N/A',
                success: true,
                timestamp: new Date().toISOString(),
                status: '204 No Content'
            });
            fetchSecurityRules();
            isActive.value = false;
        } catch (error) {
            console.error('Error deleting rule:', error);
            apiLogs.value.push({
                action: 'Delete rule (FAILED)',
                method: 'DELETE',
                endpoint: `${submodelElementsUrl}/${ruleIdShort}`,
                headers: 'Handled by Composable',
                payload: 'N/A',
                success: false,
                timestamp: new Date().toISOString(),
                status: error instanceof Error && error.message.includes('not found') ? '404 Not Found' : '500 Internal Server Error',
                error: error instanceof Error ? error.message : 'Server not available'
            });
            dialogError.value = 'Failed to delete rule: Server not available';
        }
    };

    const roleNameExists = (name: string, excludeIndex: number = -1): boolean => {
        if (!name) return false;

        return securityRules.value.some(
            (rule: SecurityRule, index: number) =>
                index !== excludeIndex && rule.idShort.toLowerCase() === name.toLowerCase()
        );
    };

    // Add new reactive variables for search and filter
    const searchQuery = ref('');
    const filterTargetType = ref<TargetType | null>(null);
    const filterAction = ref<Action | null>(null);

    // Add computed property for filtered rules
    const filteredRules = computed(() => {
        return securityRules.value.filter(rule => {
            const role = getElementValue(rule.value, 'role').toLowerCase();
            const actions = getElementValues(rule.value, 'action').join(', ').toLowerCase();
            const targetType = getElementValue(
                findElement(rule.value, 'targetInformation')?.value || [],
                '@type'
            ).toLowerCase();

            // Search query filter
            const matchesSearch = !searchQuery.value ||
                role.includes(searchQuery.value.toLowerCase()) ||
                actions.includes(searchQuery.value.toLowerCase()) ||
                targetType.includes(searchQuery.value.toLowerCase()) ||
                [...getElementValues(findElement(rule.value, 'targetInformation')?.value || [], 'aasIds'), ...getElementValues(findElement(rule.value, 'targetInformation')?.value || [], 'submodelIds')].join(', ').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                decodeBase64(rule.idShort).toLowerCase().includes(searchQuery.value.toLowerCase());

            // Target type filter
            const matchesTargetType = !filterTargetType.value ||
                targetType === filterTargetType.value.toLowerCase();

            // Action filter
            const matchesAction = !filterAction.value ||
                actions.includes(filterAction.value.toLowerCase());

            return matchesSearch && matchesTargetType && matchesAction;
        });
    });

    // Add method to reset filters
    const resetFilters = () => {
        searchQuery.value = '';
        filterTargetType.value = null;
        filterAction.value = null;
    };

    // Add copy to clipboard method
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    // Add Base64 decode function
    const decodeBase64 = (encoded: string): string => {
        try {
            return atob(encoded);
        } catch (e) {
            console.error('Failed to decode Base64 string:', e);
            return encoded; // Return original if decoding fails
        }
    };
</script>