<!--
 * !!! Security_MOCK.vue - Mockup for BaSyx Security Plugin - for demonstration purposes !!!!
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
 * - `resetNewRuleForm`: Resets the form data for creating a new rule.
 * - `logApiCall(details)`: Logs API calls for debugging and monitoring purposes.
 * - `updateApiLog(success, status, errorMessage)`: Updates the API call log with success/failure status.
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
 * - **Production Deployment**:
 *   - This is a MOCK implementation and should NOT be used in production without proper security review
 *   - All API endpoints and authentication mechanisms must be properly secured in production
 *   - Implement proper CSRF protection and input validation
 *   - Use HTTPS for all API communications
 *
 * - **Authentication & Authorization**:
 *   - Ensure proper role-based access control (RBAC) is implemented
 *   - Validate all user permissions before allowing rule modifications
 *   - Implement session management and token validation
 *   - Consider implementing rate limiting for API calls
 *
 * - **Data Protection**:
 *   - Sanitize all user inputs to prevent XSS attacks
 *   - Implement proper logging for security-relevant actions
 *   - Consider data encryption for sensitive information
 *   - Regular security audits of rule configurations
 *
 * - **API Security**:
 *   - Validate all API responses
 *   - Implement proper error handling without exposing sensitive information
 *   - Use secure headers (CORS, CSP, etc.)
 *   - Consider implementing API versioning
 *
 * - **Best Practices**:
 *   - Regular security updates of all dependencies
 *   - Implement proper backup mechanisms for security rules
 *   - Document all security-related configurations
 *   - Regular penetration testing in production environment
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
      <!-- Link to authentication service admin interface - currently hardcoded -->
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
                <span ref="targetIdSpan" class="text-truncate">
                  {{ 
                    (() => {
                      const targetInfo = findElement(rule.value, 'targetInformation')?.value || [];
                      const targetType = getElementValue(targetInfo, '@type');
                      let ids: string[] = [];
                      
                      if (targetType === 'aas') {
                        ids = getElementValues(targetInfo, 'aasIds');
                      } else if (targetType === 'aas-registry') {
                        ids = getElementValues(targetInfo, 'aasregistryIds');
                      } else if (targetType === 'submodel') {
                        ids = getElementValues(targetInfo, 'submodelIds');
                      } else if (targetType === 'submodel-registry') {
                        ids = getElementValues(targetInfo, 'submodelregistryIds');
                      }
                      
                      return ids.length > 0 ? ids.join(', ') : '*';
                    })()
                   }}
                </span>
                <v-tooltip location="bottom" v-if="shouldShowTooltip(rule)">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="xs" class="ml-1">mdi-eye-outline</v-icon>
                  </template>
                  <div class="d-flex flex-column">
                    <span v-for="id in (() => {
                      const targetInfo = findElement(rule.value, 'targetInformation')?.value || [];
                      const targetType = getElementValue(targetInfo, '@type');
                      let ids: string[] = [];
                      
                      if (targetType === 'aas') {
                        ids = getElementValues(targetInfo, 'aasIds');
                      } else if (targetType === 'aas-registry') {
                        ids = getElementValues(targetInfo, 'aasregistryIds');
                      } else if (targetType === 'submodel') {
                        ids = getElementValues(targetInfo, 'submodelIds');
                      } else if (targetType === 'submodel-registry') {
                        ids = getElementValues(targetInfo, 'submodelregistryIds');
                      }
                      
                      return ids.length > 0 ? ids : ['*'];
                    })()" :key="id">
                      {{ id }}
                    </span>
                  </div>
                </v-tooltip>
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
            <!-- Target element paths input -->
            <v-textarea
              v-if="editRuleData.targetType === 'submodel'"
              v-model="editRuleData.targetElementPaths"
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
            <!-- Removed manual ID input - now auto-generated
            <v-text-field
                v-model="newRuleData.idShort"
                label="Rule ID Short*"
                variant="outlined"
                class="mb-2"
                hint="Unique identifier for this rule (e.g., Base64 encoded string)"
                persistent-hint
                :rules="[(v) => !!v || 'Rule ID Short is required']"
                required></v-text-field>
            -->
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
              v-if="newRuleData.targetType === 'submodel'"
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
import type { VForm } from 'vuetify/components';
import { onMounted, reactive, ref, computed, nextTick } from 'vue';
import { base64Encode } from '@/utils/EncodeDecodeUtils';

// Interfaces
interface ApiLog {
  timestamp: number;
  action: string;
  method: string;
  endpoint: string;
  payload: string;
  success: boolean;
  status: string;
  error?: string;
}

interface NewRuleFormData {
  role: string;
  actions: string[];
  targetType: TargetType | null;
  targetIds: string;
  targetElementPaths: string;
}

interface EditRuleFormData {
  idShort: string;
  role: string;
  actions: string[];
  targetType: TargetType;
  targetIds: string;
  targetElementPaths: string;
}

// Types
type TargetType = 'aas-registry' | 'aas' | 'submodel-registry' | 'submodel';

// Constants
const SECURITY_SUBMODEL_ID = 'Security';
const SECURITY_SUBMODEL_B64_ID = btoa(SECURITY_SUBMODEL_ID);

// Map simple target types to their Java classes
const targetInformationClassMap: Record<TargetType, string> = {
  'aas-registry': 'org.eclipse.digitaltwin.basyx.aasregistry.feature.authorization.AasRegistryTargetInformation',
  'aas': 'org.eclipse.digitaltwin.basyx.aasrepository.feature.authorization.AasTargetInformation',
  'submodel-registry': 'org.eclipse.digitaltwin.basyx.submodelregistry.feature.authorization.SubmodelRegistryTargetInformation',
  'submodel': 'org.eclipse.digitaltwin.basyx.submodelrepository.feature.authorization.SubmodelTargetInformation'
};

const availableActions = ['READ', 'WRITE', 'DELETE', 'EXECUTE'] as const;
type Action = typeof availableActions[number];

// Component State
const securityRules = ref<any[]>([]);
const apiLogs = ref<ApiLog[]>([]);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);
const dialogError = ref<string | null>(null);

// Dialog controls
const newRuleDialog = ref<boolean>(false);
const editRuleDialog = ref<boolean>(false);
const deleteConfirmDialog = ref<boolean>(false);
const ruleToDelete = ref<any>(null);
const ruleToEdit = ref<any>(null);

// Form refs
const newRuleFormRef = ref<InstanceType<typeof VForm> | null>(null);
const editRuleFormRef = ref<InstanceType<typeof VForm> | null>(null);

// Form data
const newRuleData = reactive<NewRuleFormData>({
  role: '',
  actions: ['READ'],
  targetType: null,
  targetIds: '',
  targetElementPaths: '',
});

const editRuleData = reactive<EditRuleFormData>({
  idShort: '',
  role: '',
  actions: [],
  targetType: 'aas-registry',
  targetIds: '',
  targetElementPaths: '',
});

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

// Add these in the script section
const targetIdRefs = ref<Record<string, Element>>({});
const truncatedIds = ref(new Set<string>());

function isTextTruncated(idShort: string): boolean {
  return truncatedIds.value.has(idShort);
}

onMounted(() => {
  fetchSecurityRules();
  // Check for truncated text after DOM updates
  nextTick(() => {
    Object.entries(targetIdRefs.value).forEach(([idShort, element]) => {
      if (element instanceof HTMLElement) {
        if (element.offsetWidth < element.scrollWidth) {
          truncatedIds.value.add(idShort);
        }
      }
    });
  });
});

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchSecurityRules();
});

// --- Methods ---
async function fetchSecurityRules(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Mock data for security rules
    securityRules.value = [
      {
        idShort: "YWRtaW5SRUFEb3JnLmVjbGlwc2UuZGlnaXRhbHR3aW4uYmFzeXguYWFzcmVwb3NpdG9yeS5mZWF0dXJlLmF1dGhvcml6YXRpb24uQWFzVGFyZ2V0SW5mb3JtYXRpb24=",
        value: [
          { modelType: "Property", idShort: "role", valueType: "xs:string", value: "admin" },
          {
            modelType: "SubmodelElementList",
            idShort: "action",
            value: [
              { modelType: "Property", value: "READ" },
              { modelType: "Property", value: "WRITE" }
            ]
          },
          {
            modelType: "SubmodelElementCollection",
            idShort: "targetInformation",
            value: [
              { modelType: "Property", idShort: "@type", value: "aas" },
              {
                modelType: "SubmodelElementList",
                idShort: "aasIds",
                value: [
                  { modelType: "Property", value: "*" }
                ]
              }
            ]
          }
        ]
      },
      {
        idShort: "dXNlclJFQURvcmcuZWNsaXBzZS5kaWdpdGFsdHdpbi5iYXN5eC5zdWJtb2RlbHJlcG9zaXRvcnkuZmVhdHVyZS5hdXRob3JpemF0aW9uLlN1Ym1vZGVsVGFyZ2V0SW5mb3JtYXRpb24=",
        value: [
          { modelType: "Property", idShort: "role", valueType: "xs:string", value: "user" },
          {
            modelType: "SubmodelElementList",
            idShort: "action",
            value: [
              { modelType: "Property", value: "READ" }
            ]
          },
          {
            modelType: "SubmodelElementCollection",
            idShort: "targetInformation",
            value: [
              { modelType: "Property", idShort: "@type", value: "submodel" },
              {
                modelType: "SubmodelElementList",
                idShort: "submodelIds",
                value: [
                  { modelType: "Property", value: "HARTING_AAS_ZSN1" },
                  { modelType: "Property", value: "FESTO_AAS_42Z5" }
                ]
              }
            ]
          }
        ]
      }
    ];

    // Log the action
    logApiCall({
      action: "Fetch All Rules",
      method: "GET",
      endpoint: "mock/security-submodel",
      payload: "N/A"
    });
    updateApiLog(true, "200 OK");
  } catch (err: any) {
    console.error("Error simulating rules:", err);
    if (err.message?.includes("unreachable")) {
      updateApiLog(false, "503 Service Unavailable", "Security Submodel Service is currently unavailable");
    } else {
      updateApiLog(false, "500 Internal Server Error", err.message);
    }
  } finally {
    isLoading.value = false;
  }
}

// --- Helper Functions ---
function findElement(elements: any[], idShort: string): any | null {
  if (!Array.isArray(elements)) return null;
  return elements.find((el) => el && el.idShort === idShort) || null;
}

function getElementValue(elements: any[], idShort: string): any {
  const element = findElement(elements, idShort);
  return element && typeof element.value !== 'undefined' ? element.value : 'N/A';
}

function getElementValues(elements: any[], idShort: string): any[] {
  const listElement = findElement(elements, idShort);
  if (listElement && listElement.modelType === 'SubmodelElementList' && Array.isArray(listElement.value)) {
    return listElement.value
      .map((item: any) => (item && typeof item.value !== 'undefined' ? item.value : null))
      .filter((value: any): value is NonNullable<any> => value !== null);
  }
  return [];
}

// --- New Rule Dialog ---
function openNewRuleDialog(): void {
  resetNewRuleForm();
  newRuleDialog.value = true;
}

function cancelNewRule(): void {
  newRuleDialog.value = false;
}

function resetNewRuleForm(): void {
  newRuleData.role = '';
  newRuleData.actions = ['READ'];
  newRuleData.targetType = null;
  newRuleData.targetIds = '';
  newRuleData.targetElementPaths = '';
  dialogError.value = null;
  newRuleFormRef.value?.resetValidation();
}

async function createNewSecurityRule(): Promise<void> {
  dialogError.value = null;
  if (!newRuleFormRef.value) return;

  // Validate form using Vuetify's validation
  const formValidation = await newRuleFormRef.value.validate();
  if (!formValidation.valid) {
    dialogError.value = "Please fill in all required fields correctly.";
    // Log validation failure
    logApiCall({
      action: "Create Rule (Validation Failed)",
      method: "POST",
      endpoint: "mock/security-submodel/submodel-elements",
      payload: JSON.stringify(newRuleData)
    });
    updateApiLog(false, "400 Bad Request", "Invalid form data");
    return;
  }

  // Additional check specifically if targetType is selected (not null)
  if (newRuleData.targetType === null) {
      dialogError.value = 'Target type must be selected';
      logApiCall({
          action: "Create Rule (Validation Failed)",
          method: "POST",
          endpoint: "mock/security-submodel/submodel-elements",
          payload: JSON.stringify(newRuleData)
      });
      updateApiLog(false, "400 Bad Request", "Target type is required");
      return;
  }

  const targetIdList = newRuleData.targetIds
    .split('\n')
    .map(id => id.trim())
    .filter(id => id);

  if (targetIdList.length === 0) {
    dialogError.value = "At least one target ID must be provided (use * for wildcard).";
    logApiCall({
      action: "Create Rule (Validation Failed)",
      method: "POST",
      endpoint: "mock/security-submodel/submodel-elements",
      payload: JSON.stringify(newRuleData)
    });
    updateApiLog(false, "400 Bad Request", "No target IDs provided");
    return;
  }

  // Add validation for targetElementPaths if targetType is submodel
  if (newRuleData.targetType === 'submodel') {
      const pathsArray = newRuleData.targetElementPaths
          .split('\n')
          .map((path: string) => path.trim())
          .filter((path: string) => path);

      if (pathsArray.length === 0) {
          if (newRuleData.targetElementPaths.trim() !== '') {
              dialogError.value = 'Target element paths are required for submodel target type.';
              logApiCall({
                  action: "Create Rule (Validation Failed)",
                  method: "POST",
                  endpoint: "mock/security-submodel/submodel-elements",
                  payload: JSON.stringify(newRuleData)
              });
              updateApiLog(false, "400", "Target element paths required");
              return;
          }
      }
  }

  isLoading.value = true;

  // Log the API call before creating the rule
  logApiCall({
    action: "Create Rule",
    method: "POST",
    endpoint: "mock/security-submodel/submodel-elements",
    payload: JSON.stringify(newRuleData)
  });

  // Use non-null asserted targetType here (safe because of the check above)
  const firstAction = newRuleData.actions[0];
  const targetInfoClass = targetInformationClassMap[newRuleData.targetType as TargetType];

  if (!targetInfoClass) {
      const errorMessage = `Internal error: Could not find target information class for type '${newRuleData.targetType}'.`;
      console.error(errorMessage);
      dialogError.value = errorMessage;
      updateApiLog(false, "500 Internal Server Error", errorMessage);
      isLoading.value = false;
      return;
  }

  // Calculate ID short based on role, first action and target type
  const idShortStringToEncode = `${newRuleData.role}${firstAction}${targetInfoClass}`;
  const calculatedIdShort = base64Encode(idShortStringToEncode);

  // Create new rule object based on NewRuleFormData
  const idsListKey = `${newRuleData.targetType.replace('-', '')}Ids`;

  const newRule = {
    idShort: calculatedIdShort,
    value: [
      { modelType: "Property", idShort: "role", valueType: "xs:string", value: newRuleData.role },
      {
        modelType: "SubmodelElementList",
        idShort: "action",
        orderRelevant: true,
        value: newRuleData.actions.map(action => ({
          modelType: "Property",
          value: action
        }))
      },
      {
        modelType: "SubmodelElementCollection",
        idShort: "targetInformation",
        value: [
          { modelType: "Property", idShort: "@type", value: newRuleData.targetType },
          {
            modelType: "SubmodelElementList",
            idShort: idsListKey,
            orderRelevant: false,
            value: targetIdList.map(id => ({
              modelType: "Property",
              value: id
            }))
          },
          ...(newRuleData.targetType === 'submodel' && newRuleData.targetElementPaths.trim() ?
              [{
                  modelType: "SubmodelElementList",
                  idShort: "submodelElementIdShortPaths",
                  orderRelevant: true,
                  value: newRuleData.targetElementPaths.split('\n').map(path => ({ modelType: "Property", value: path.trim() })).filter(item => item.value.trim() !== '')
              }] : []
          )
        ]
      }
    ]
  };

  // Simulate API call success and add rule to mock data
  await new Promise(resolve => setTimeout(resolve, 800));

  securityRules.value.push(newRule);
  updateApiLog(true, "201 Created");
  resetNewRuleForm();
  newRuleDialog.value = false;
  isLoading.value = false;
}

// --- Edit Rule Dialog ---
function openEditRuleDialog(rule: any): void {
  // Check if rule and its value are valid before proceeding
  if (!rule || !rule.value) {
    console.error('Invalid rule object provided for editing', rule);
    dialogError.value = 'Error opening edit dialog: Invalid rule data.';
    return;
  }

  // Store the original rule object (optional, depending on further needs)
  ruleToEdit.value = rule;

  // Fill form with current rule data using the EditRuleFormData structure
  // Ensure editRuleData is reset or all fields are explicitly set
  editRuleData.idShort = rule.idShort;
  editRuleData.role = getElementValue(rule.value, 'role');
  editRuleData.actions = getElementValues(rule.value, 'action');

  const targetInfo = findElement(rule.value, 'targetInformation')?.value || [];
  const type = getElementValue(targetInfo, '@type');
  // Validate and set targetType - it MUST be a valid type for editing
  if (type && Object.keys(targetInformationClassMap).includes(type)) {
      editRuleData.targetType = type as TargetType;
  } else {
      // This indicates an issue with the stored rule data if @type is missing or invalid
      console.error('Invalid or missing target @type for rule:', rule.idShort, targetInfo);
      dialogError.value = `Error editing rule ${rule.idShort}: Invalid target type data.`;
      // Attempt to set a default or stop the edit process, depending on desired UX
      // For now, we'll default and log, but a production app might handle this differently
      editRuleData.targetType = 'aas-registry'; // Fallback to a valid type
      // Optionally, prevent opening the dialog: editRuleDialog.value = false; return;
  }

  // Extract IDs from the appropriate list (aasIds or submodelIds based on targetType)
  const idListKey = `${editRuleData.targetType.replace('-', '')}Ids`;
  const idListElement = findElement(targetInfo, idListKey);

  if (idListElement && Array.isArray(idListElement.value)) {
    editRuleData.targetIds = idListElement.value
      .map((item: any) => item.value || '')
      .filter((id: string) => id.trim() !== '')
      .join('\n');
  } else {
    editRuleData.targetIds = '';
  }

  // Extract element paths for submodel target type
  if (editRuleData.targetType === 'submodel') {
      const pathsListElement = findElement(targetInfo, 'submodelElementIdShortPaths');
      if (pathsListElement && Array.isArray(pathsListElement.value)) {
          editRuleData.targetElementPaths = pathsListElement.value
              .map((item: any) => item.value || '')
              .filter((path: string) => path.trim() !== '')
              .join('\n');
      } else {
          editRuleData.targetElementPaths = '';
      }
  } else {
      editRuleData.targetElementPaths = ''; // Clear if not submodel type
  }

  dialogError.value = null; // Clear previous errors
  editRuleDialog.value = true;
  // Reset form validation state after filling form data if needed
  // editRuleFormRef.value?.resetValidation();
}

function cancelEditRule(): void {
  editRuleDialog.value = false;
  ruleToEdit.value = null;
  dialogError.value = null; // Clear dialog error on cancel
  // Consider resetting editRuleData here if needed
}

async function updateSecurityRule(): Promise<void> {
  dialogError.value = null;
  // Check form ref and if editRuleData.idShort is set (indicates a rule is loaded)
  if (!editRuleFormRef.value || !editRuleData.idShort) {
      console.error('Update attempted without a rule loaded for editing');
      dialogError.value = 'Error updating rule: No rule data to update.';
      return;
  }

  // Validate form using Vuetify's validation
  const formValidation = await editRuleFormRef.value.validate();
  if (!formValidation.valid) {
    dialogError.value = "Please fill in all required fields correctly.";
    logApiCall({
      action: "Update Rule (Validation Failed)", // More specific action name
      method: "PUT", // Method is PUT for update
      endpoint: `mock/security-submodel/submodel-elements/${editRuleData.idShort}`, // Use idShort from editRuleData
      payload: JSON.stringify(editRuleData) // Log editRuleData
    });
    updateApiLog(false, "400 Bad Request", "Invalid form data");
    return;
  }

  // Additional validation for targetIds and targetElementPaths
  const targetIdList = editRuleData.targetIds
    .split('\n')
    .map(id => id.trim())
    .filter(id => id !== ''); // Filter out empty strings

  if (targetIdList.length === 0) {
    dialogError.value = "At least one Target ID must be provided.";
    logApiCall({
      action: "Update Rule (Validation Failed)",
      method: "PUT",
      endpoint: `mock/security-submodel/submodel-elements/${editRuleData.idShort}`,
      payload: JSON.stringify(editRuleData)
    });
    updateApiLog(false, "400 Bad Request", "No target IDs provided");
    return;
  }

  // Add validation for targetElementPaths if targetType is submodel
  if (editRuleData.targetType === 'submodel' && !editRuleData.targetElementPaths.trim()) {
      dialogError.value = 'Target element paths are required for submodel target type.';
      logApiCall({
          action: "Update Rule (Validation Failed)",
          method: "PUT",
          endpoint: `mock/security-submodel/submodel-elements/${editRuleData.idShort}`,
          payload: JSON.stringify(editRuleData)
      });
      updateApiLog(false, "400 Bad Request", "Target element paths required");
      return;
  }

  isLoading.value = true;
  const ruleIdShort = editRuleData.idShort; // Use idShort from editRuleData

  logApiCall({
    action: "Update Rule",
    method: "PUT",
    endpoint: `mock/security-submodel/submodel-elements/${ruleIdShort}`,
    payload: JSON.stringify(editRuleData) // Log editRuleData
  });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Create updated rule structure based on editRuleData
  const idsListKey = `${editRuleData.targetType.replace('-', '')}Ids`;

  const updatedRule = {
    idShort: ruleIdShort,  // ID remains the same
    value: [
      { modelType: "Property", idShort: "role", valueType: "xs:string", value: editRuleData.role.trim() }, // Trim whitespace
      {
        modelType: "SubmodelElementList",
        idShort: "action",
        orderRelevant: true,
        value: editRuleData.actions.map(action => ({
          modelType: "Property",
          value: action
        }))
      },
      {
        modelType: "SubmodelElementCollection",
        idShort: "targetInformation",
        value: [
          { modelType: "Property", idShort: "@type", value: editRuleData.targetType },
          { // Include the appropriate IDs list (aasIds or submodelIds)
            modelType: "SubmodelElementList",
            idShort: idsListKey,
            orderRelevant: false,
            value: targetIdList.map(id => ({
              modelType: "Property",
              value: id
            }))
          },
          // Include submodelElementIdShortPaths if targetType is submodel and paths exist
          ...(editRuleData.targetType === 'submodel' && editRuleData.targetElementPaths.trim() ?
              [{
                  modelType: "SubmodelElementList",
                  idShort: "submodelElementIdShortPaths",
                  orderRelevant: true,
                  value: editRuleData.targetElementPaths.split('\n').map(path => ({ modelType: "Property", value: path.trim() })).filter(item => item.value.trim() !== '')
              }] : []
          )
        ]
      }
    ]
  };

  // Replace rule in list by idShort
  const indexToUpdate = securityRules.value.findIndex(rule => rule.idShort === ruleIdShort);
  if (indexToUpdate !== -1) {
    securityRules.value[indexToUpdate] = updatedRule; // Replace with the updated rule object
  }

  updateApiLog(true, "200 OK");
  editRuleDialog.value = false;
  ruleToEdit.value = null; // Clear ruleToEdit
  isLoading.value = false;
}

// --- Delete Rule Dialog ---
function openDeleteConfirmDialog(rule: any): void {
  ruleToDelete.value = rule;
  deleteConfirmDialog.value = true;
  dialogError.value = null;
}

function cancelDeleteRule(): void {
  deleteConfirmDialog.value = false;
  ruleToDelete.value = null;
}

async function confirmDeleteRule(): Promise<void> {
  dialogError.value = null;
  if (!ruleToDelete.value || !ruleToDelete.value.idShort) {
    dialogError.value = "Delete not possible: Rule information or ID Short missing.";
    logApiCall({
      action: "Delete Rule",
      method: "DELETE",
      endpoint: `mock/security-submodel/submodel-elements/${ruleToDelete.value?.idShort}`,
      payload: "N/A"
    });
    updateApiLog(false, "400 Bad Request", "Invalid rule information");
    return;
  }

  // Check if rule exists
  const ruleExists = securityRules.value.some(rule => rule.idShort === ruleToDelete.value.idShort);
  if (!ruleExists) {
    dialogError.value = "Rule not found.";
    logApiCall({
      action: "Delete Rule",
      method: "DELETE",
      endpoint: `mock/security-submodel/submodel-elements/${ruleToDelete.value.idShort}`,
      payload: "N/A"
    });
    updateApiLog(false, "404 Not Found", "Rule not found");
    return;
  }

  const ruleIdShort = ruleToDelete.value.idShort;

  isLoading.value = true;
  logApiCall({
    action: "Delete Rule",
    method: "DELETE",
    endpoint: `mock/security-submodel/submodel-elements/${ruleIdShort}`,
    payload: "N/A"
  });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // Remove rule from list
  const indexToDelete = securityRules.value.findIndex(rule => rule.idShort === ruleIdShort);
  if (indexToDelete !== -1) {
    securityRules.value.splice(indexToDelete, 1);
  }

  updateApiLog(true, "204 No Content");
  deleteConfirmDialog.value = false;
  ruleToDelete.value = null;
  isLoading.value = false;
}

// --- API Logging ---
function logApiCall(details: Omit<ApiLog, 'timestamp' | 'success' | 'status' | 'error'>): void {
  apiLogs.value.push({
    ...details,
    timestamp: Date.now(),
    success: false,
    status: 'Pending...',
  });
}

function updateApiLog(success: boolean, status: string, errorMessage?: string): void {
  // Find most recent log entry to update
  if (apiLogs.value.length > 0) {
    const lastLog = apiLogs.value[apiLogs.value.length - 1];
    lastLog.success = success;
    lastLog.status = status;
    if (errorMessage) {
      lastLog.error = errorMessage;
    }
  }
}

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

// Add this function in the script section
function shouldShowTooltip(rule: any): boolean {
  const targetInfo = findElement(rule.value, 'targetInformation')?.value || [];
  const targetType = getElementValue(targetInfo, '@type');
  let ids: string[] = [];
  
  if (targetType === 'aas') {
    ids = getElementValues(targetInfo, 'aasIds');
  } else if (targetType === 'aas-registry') {
    ids = getElementValues(targetInfo, 'aasregistryIds');
  } else if (targetType === 'submodel') {
    ids = getElementValues(targetInfo, 'submodelIds');
  } else if (targetType === 'submodel-registry') {
    ids = getElementValues(targetInfo, 'submodelregistryIds');
  }

  // Only show tooltip if there are multiple IDs or a single ID that is not '*'
  return ids.length > 1 || (ids.length === 1 && ids[0] !== '*');
}
</script>