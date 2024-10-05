<template>
    <v-container fluid class="pa-0">
        <!-- Header -->
        <v-card v-if="!hideSettings" class="mb-4">
            <v-card-title>
                <div class="text-subtitle-1">{{ 'Time Series Data:' }}</div>
            </v-card-title>
        </v-card>
        <!-- Data Preview Config -->
        <v-card v-if="!hideSettings || editDialog" class="mb-4">
            <!-- Title -->
            <v-list v-if="!hideSettings || editDialog" nav class="py-0">
                <v-list-item class="pb-0">
                    <template #title>
                        <div class="text-subtitle-2">{{ 'Preview Configuration: ' }}</div>
                    </template>
                </v-list-item>
            </v-list>
            <!-- Preview Config -->
            <v-card-text class="pt-1">
                <!-- Segment Selection -->
                <v-select
                    v-model="selectedSegment"
                    variant="outlined"
                    density="compact"
                    clearable
                    label="Segment"
                    :items="segments"
                    item-title="idShort"
                    item-value="idShort"
                    return-object
                    @update:model-value="emitSegment"></v-select>
                <!-- Record Selection -->
                <v-row>
                    <v-col cols="12" md="6">
                        <v-select
                            v-model="timeVariable"
                            variant="outlined"
                            density="compact"
                            clearable
                            label="time-value"
                            :items="records"
                            item-title="idShort"
                            item-value="idShort"
                            return-object
                            @update:model-value="emitTimeValue"></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-select
                            v-model="yVariables"
                            variant="outlined"
                            density="compact"
                            clearable
                            label="y-value(s)"
                            :items="records"
                            item-title="idShort"
                            item-value="idShort"
                            return-object
                            multiple
                            @update:model-value="emitYValue"></v-select>
                    </v-col>
                </v-row>
                <!-- API Token -->
                <v-text-field
                    v-if="segmentType == 'LinkedSegment' && showTokenInput"
                    v-model="apiToken"
                    variant="outlined"
                    density="compact"
                    clearable
                    label="API Token"
                    hide-details></v-text-field>
            </v-card-text>
            <v-divider></v-divider>
            <v-list nav class="pr-2 pt-0">
                <v-list-item>
                    <template #append>
                        <v-btn
                            v-if="segmentType == 'LinkedSegment'"
                            size="small"
                            class="text-buttonText"
                            color="primary"
                            @click="fetchLinkedData()"
                            >Fetch Data</v-btn
                        >
                        <v-btn
                            v-if="segmentType == 'InternalSegment'"
                            size="small"
                            class="text-buttonText"
                            color="primary"
                            @click="fetchInternalData()"
                            >Fetch Data</v-btn
                        >
                        <v-btn
                            v-if="segmentType == 'ExternalSegment'"
                            size="small"
                            class="text-buttonText"
                            color="primary"
                            @click="fetchExternalData()"
                            >Fetch Data</v-btn
                        >
                    </template>
                </v-list-item>
            </v-list>
        </v-card>
        <!-- Data Preview Chart -->
        <v-card :flat="hideSettings">
            <!-- Title -->
            <v-list v-if="!hideSettings || editDialog" nav class="py-0">
                <v-list-item>
                    <template #title>
                        <div class="text-subtitle-2">{{ 'Preview Chart: ' }}</div>
                    </template>
                    <template #append>
                        <v-btn
                            v-if="selectedChartType && !hideSettings"
                            color="primary"
                            class="text-buttonText"
                            size="small"
                            variant="elevated"
                            append-icon="mdi-plus"
                            @click="createObject()"
                            >Dashboard</v-btn
                        >
                    </template>
                </v-list-item>
            </v-list>
            <v-card-text class="pt-1">
                <!-- Chart Type Selection -->
                <v-select
                    v-if="!hideSettings || editDialog"
                    v-model="selectedChartType"
                    variant="outlined"
                    density="compact"
                    clearable
                    label="Chart Type"
                    :items="chartTypes"
                    item-title="name"
                    item-value="name"
                    return-object
                    @update:model-value="clearChartOptions"></v-select>
                <!-- Chart Preview -->
                <LineChart
                    v-if="selectedChartType && selectedChartType.id == 1"
                    :chart-data="timeSeriesValues"
                    :time-variable="timeVariable"
                    :y-variables="yVariables"
                    :chart-options-external="chartOptions"
                    :edit-dialog="editDialog"
                    @chart-options="getChartOptions"></LineChart>
                <AreaChart
                    v-if="selectedChartType && selectedChartType.id == 2"
                    :chart-data="timeSeriesValues"
                    :time-variable="timeVariable"
                    :y-variables="yVariables"
                    :chart-options-external="chartOptions"
                    :edit-dialog="editDialog"
                    @chart-options="getChartOptions"></AreaChart>
                <ScatterChart
                    v-if="selectedChartType && selectedChartType.id == 3"
                    :chart-data="timeSeriesValues"
                    :time-variable="timeVariable"
                    :y-variables="yVariables"
                    :chart-options-external="chartOptions"
                    :edit-dialog="editDialog"
                    @chart-options="getChartOptions"></ScatterChart>
                <Histogram
                    v-if="selectedChartType && selectedChartType.id == 4"
                    :chart-data="timeSeriesValues"
                    :time-variable="timeVariable"
                    :y-variables="yVariables"
                    :chart-options-external="chartOptions"
                    :edit-dialog="editDialog"
                    @chart-options="getChartOptions"></Histogram>
                <Gauge
                    v-if="selectedChartType && selectedChartType.id == 5"
                    :chart-data="timeSeriesValues"
                    :time-variable="timeVariable"
                    :y-variables="yVariables"
                    :chart-options-external="chartOptions"
                    :edit-dialog="editDialog"
                    @chart-options="getChartOptions"></Gauge>
                <DisplayField
                    v-if="selectedChartType && selectedChartType.id == 6"
                    :chart-data="timeSeriesValues"
                    :time-variable="timeVariable"
                    :y-variables="yVariables"></DisplayField>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';
    import { useTheme } from 'vuetify';
    import AreaChart from '@/components/Widgets/AreaChart.vue';
    import DisplayField from '@/components/Widgets/DisplayField.vue';
    import Gauge from '@/components/Widgets/Gauge.vue';
    import Histogram from '@/components/Widgets/Histogram.vue';
    // Widget imports
    import LineChart from '@/components/Widgets/LineChart.vue';
    import ScatterChart from '@/components/Widgets/ScatterChart.vue';
    import DashboardHandling from '@/mixins/DashboardHandling';
    import RequestHandling from '@/mixins/RequestHandling';
    import SubmodelElementHandling from '@/mixins/SubmodelElementHandling';
    import { useAASStore } from '@/store/AASDataStore';
    import { useEnvStore } from '@/store/EnvironmentStore';

    export default defineComponent({
        name: 'TimeSeriesData',
        components: {
            LineChart,
            AreaChart,
            ScatterChart,
            Histogram,
            Gauge,
            DisplayField,
        },
        mixins: [RequestHandling, SubmodelElementHandling, DashboardHandling],
        props: ['submodelElementData', 'configData', 'editDialog', 'loadTrigger'],
        emits: ['timeVal', 'YVal', 'newOptions'],

        setup() {
            const theme = useTheme();
            const aasStore = useAASStore();
            const envStore = useEnvStore();
            const route = useRoute();

            return {
                theme, // Theme Object
                aasStore, // AASStore Object
                envStore, // EnvironmentStore Object
                route, // Route Object
            };
        },

        data() {
            return {
                timeSeriesData: {} as any, // Object to store the data of the time series smt
                segments: [] as Array<any>, // Array to store the segments of the time series smt
                selectedSegment: null as any, // Object to store the selected segment of the time series smt
                records: [] as Array<any>, // Array to store the records of the time series smt
                timeVariable: null as any, // Object to store the selected time variable of the time series smt
                yVariables: [] as Array<any>, // Array to store the selected y variables of the time series smt
                yVariableTemplate: '{{y-value}}' as string, // String that is used to inject y-variable in linkedSeg Query
                apiToken: '', // API Token for the Time Series Database
                showTokenInput: true, // Boolean to show the API Token Input
                timeSeriesValues: [] as Array<any>, // Array to store the values of the time series smt
                chartTypes: [
                    { id: 1, name: 'Line Chart' },
                    { id: 2, name: 'Area Chart' },
                    { id: 3, name: 'Scatter Chart' },
                    { id: 4, name: 'Histogram' },
                    { id: 5, name: 'Gauge' },
                    { id: 6, name: 'Display Field' },
                ] as Array<any>, // Array to store the chart types
                selectedChartType: null as any, // Object to store the selected chart type
                chartOptions: {} as any, // Object to store the chart options
            };
        },

        computed: {
            // get selected AAS from Store
            SelectedAAS() {
                return this.aasStore.getSelectedAAS;
            },

            // Get the selected Treeview Node (SubmodelElement) from the store
            SelectedNode() {
                return this.aasStore.getSelectedNode;
            },

            // Check if the current Theme is dark
            isDark() {
                return this.theme.global.current.value.dark;
            },

            // Determine Segment Type of the selected Segment
            segmentType() {
                if (!this.selectedSegment) {
                    return null;
                }
                // create an array of semanticIds from the selected Segment (this.selectedSegment.semanticId.keys)
                let semanticIds = this.selectedSegment.semanticId.keys.map((semanticId: any) => semanticId.value);
                // check if the semanticIds contain the semanticId for InternalSegment
                if (semanticIds.includes('https://admin-shell.io/idta/TimeSeries/Segments/InternalSegment/1/1')) {
                    return 'InternalSegment';
                }
                // check if the semanticIds contain the semanticId for LinkedSegment
                if (semanticIds.includes('https://admin-shell.io/idta/TimeSeries/Segments/LinkedSegment/1/1')) {
                    return 'LinkedSegment';
                }
                // check if the semanticIds contain the semanticId for ExternalSegment
                if (semanticIds.includes('https://admin-shell.io/idta/TimeSeries/Segments/ExternalSegment/1/1')) {
                    return 'ExternalSegment';
                }
                // return null if no Segment Type was found
                return null;
            },
        },

        watch: {
            loadTrigger() {
                this.initializeTimeSeriesData();
                this.initDashboardTSD();
                const influxDBToken = this.envStore.getEnvInfluxdbToken;
                if (influxDBToken && influxDBToken !== '') {
                    this.apiToken = influxDBToken;
                    this.showTokenInput = false;
                }
            },
        },

        mounted() {
            this.initializeTimeSeriesData(); // initialize TimeSeriesData Plugin
            this.initDashboardTSD();
            const influxDBToken = this.envStore.getEnvInfluxdbToken;
            if (influxDBToken && influxDBToken !== '') {
                this.apiToken = influxDBToken;
                this.showTokenInput = false;
            }
        },

        methods: {
            // Function to initialize the TimeSeriesData Plugin
            initializeTimeSeriesData() {
                // Check if a Node is selected
                if (Object.keys(this.submodelElementData).length == 0) {
                    this.timeSeriesData = {}; // Reset the TimeSeriesData when no Node is selected
                    return;
                }
                let timeSeriesData = { ...this.submodelElementData }; // create local copy of the TimeSeriesData
                this.timeSeriesData = timeSeriesData; // set the local copy to the data object
                // get the collection for segments
                const segmentsSMC = timeSeriesData.submodelElements.find((smc: any) => smc.idShort === 'Segments');
                // create an array of segments
                this.segments = segmentsSMC.value;
                // console.log('Segments: ', this.segments)
                // get the collection for metadata
                const metadataSMC = timeSeriesData.submodelElements.find((smc: any) => smc.idShort === 'Metadata');
                // get the collection for records
                const recordsSMC = metadataSMC.value.find((smc: any) => smc.idShort === 'Record');
                // create an array of records
                let records = recordsSMC.value;
                // request the concept descriptions for the records (if they have semanticIds)
                // Create a list of promises
                let promises = records.map((record: any) => {
                    return this.getConceptDescriptions(record).then((response: any) => {
                        // add ConceptDescription to the record
                        if (response) {
                            record.conceptDescriptions = response;
                        }
                        return record;
                    });
                });

                // Wait for all promises to resolve and then update this.records
                Promise.all(promises).then((updatedRecords) => {
                    // console.log('Updated Records: ', updatedRecords)
                    this.records = updatedRecords;
                });
            },

            initDashboardTSD() {
                if (!this.hideSettings) return;
                this.selectedChartType = this.configData.configObject.chartType;
                // console.log(this.selectedChartType)
                this.selectedSegment = this.configData.configObject.segment;
                this.timeVariable = this.configData.configObject.timeVal;
                // console.log(this.timeVariable)
                this.yVariables = this.configData.configObject.yvals;
                // add the chart type specific options to the chartOptions
                this.chartOptions = this.configData.configObject.chartOptions;
                // add the API Token to the API Token field if it is available
                if (this.configData.configObject.apiToken && this.configData.configObject.apiToken !== '') {
                    this.apiToken = this.configData.configObject.apiToken;
                    this.showTokenInput = false;
                }
                if (this.selectedSegment.idShort == 'LinkedSegment') this.fetchLinkedData();
                if (this.selectedSegment.idShort == 'InternalSegment') this.fetchInternalData();
                if (this.selectedSegment.idShort == 'ExternalSegment') this.fetchExternalData();
            },

            fetchInternalData() {
                if (!this.selectedSegment) {
                    return;
                }
                if (!this.timeVariable) {
                    return;
                }
                if (this.yVariables.length == 0) {
                    return;
                }
                this.getRecordValues();
            },

            // Function to get the record values of an InternalSegment
            getRecordValues() {
                // console.log('Selected Segment: ', this.selectedSegment);
                // get the records submodel element collection
                const recordsSMC = this.selectedSegment.value.find((smc: any) => smc.idShort === 'Records');
                // save the records in an array
                const records = recordsSMC.value;
                // console.log('Records: ', records, ' Time Variable: ', this.timeVariable, ' Y Variables: ', this.yVariables);
                let transformedArray = this.yVariables
                    .filter(
                        (yVar) =>
                            // Check if yVarEntry exists in all records
                            records.every((item: any) =>
                                item.value.some((entry: any) => entry.idShort === yVar.idShort)
                            ) ||
                            // display an alert if the yVariable is not available in the records (specify the yVariable name)
                            this.navigationStore.dispatchSnackbar({
                                status: true,
                                timeout: 4000,
                                color: 'warning',
                                btnColor: 'buttonText',
                                text: 'y-value ' + yVar.idShort + ' not available in InternalSegment Records!',
                            })
                    )
                    .map((yVar) => {
                        // For each yVariable, go through each item in the original array
                        return records.map((item: any) => {
                            // Extract the time value
                            const timeEntry = item.value.find(
                                (entry: any) => entry.idShort === this.timeVariable.idShort
                            );
                            // display an alert if the timeVariable is not available the Records
                            if (!timeEntry) {
                                this.navigationStore.dispatchSnackbar({
                                    status: true,
                                    timeout: 4000,
                                    color: 'warning',
                                    btnColor: 'buttonText',
                                    text:
                                        'time-value ' +
                                        this.timeVariable.idShort +
                                        ' not available in InternalSegment Records!',
                                });
                            }
                            const time = timeEntry ? timeEntry.value : null;

                            // Extract the yVariable value
                            const yVarEntry = item.value.find((entry: any) => entry.idShort === yVar.idShort);
                            const yVarValue = yVarEntry ? yVarEntry.value : null;

                            // Return an object with time and the yVariable value
                            return { time, value: yVarValue };
                        });
                    });
                // console.log('Transformed Array: ', transformedArray);
                this.timeSeriesValues = transformedArray;
            },

            // Function to fetch the data from the API of the Time Series Database
            fetchLinkedData() {
                // check if a segment is selected
                if (!this.selectedSegment || Object.keys(this.selectedSegment).length == 0) {
                    console.warn('No Segment selected');
                    return;
                }
                // get the Endpoint from the selected Segment
                const endpoint = this.selectedSegment.value.find((smc: any) => smc.idShort === 'Endpoint').value;
                // get the query from the selected Segment
                let query = this.selectedSegment.value.find((smc: any) => smc.idShort === 'Query').value;
                if (this.yVariables.length > 0)
                    query = query.replace(this.yVariableTemplate, this.yVariables[0].idShort);

                // console.log('Endpoint: ', endpoint, ' Query: ', query);
                // construct the headers for the request
                let requestHeaders = new Headers();
                requestHeaders.append('Authorization', 'Token ' + this.apiToken);
                requestHeaders.append('Accept', 'application/csv');
                requestHeaders.append('Content-Type', 'application/vnd.flux');
                // construct the request
                let path = endpoint;
                let content = query;
                let headers = requestHeaders;
                let context = 'fetching data from Time Series Database';
                let disableMessage = false;
                // send the request
                this.postRequest(path, content, headers, context, disableMessage, true).then((response: any) => {
                    if (response.success) {
                        // this.navigationStore.dispatchSnackbar({ status: true, timeout: 2000, color: 'success', btnColor: 'buttonText', text: 'Succesfully retrieved data!' });
                        this.convertInfluxCSVtoArray(response.data);
                    }
                });
            },

            convertInfluxCSVtoArray(csvData: any) {
                const lines = csvData.trim().split('\n');
                const datasets = {} as any;
                let currentDataset = [] as Array<any>;
                let currentTable = null as any;
                let headerLine = '';

                lines.forEach((line: any) => {
                    const columns = line.split(',');

                    // Skip the header line (because it's not including data)
                    if (columns[1] === 'result') {
                        headerLine = line;
                        return;
                    }

                    const table = columns[2];
                    if (currentTable === null) {
                        // this handles the first line after the header
                        currentTable = table;
                        currentDataset.push(line);
                    } else if (table !== currentTable) {
                        // this handles the first line of a new table
                        const topic = this.extractTopic(currentDataset[0]);
                        datasets[topic] = this.processDataset(headerLine, currentDataset);
                        currentDataset = [line];
                        currentTable = table;
                    } else {
                        // this handles all other lines
                        currentDataset.push(line);
                    }
                });

                if (currentDataset.length > 0) {
                    // this handles the last dataset
                    const topic = this.extractTopic(currentDataset[0]);
                    datasets[topic] = this.processDataset(headerLine, currentDataset);
                }

                // console.log('Datasets: ', datasets);

                // remove the keys from the datasets based on the yVariables
                const datasetsKeys = Object.keys(datasets);
                const datasetsFiltered = datasetsKeys.filter((key) =>
                    this.yVariables.some((yVar) => key.includes(yVar.idShort))
                );

                // Find yVariables that are not in the datasets
                const missingYVars = this.yVariables.filter(
                    (yVar) => !datasetsFiltered.some((key) => key.includes(yVar.idShort))
                );

                // If there are any missing yVariables, display a warning snackbar
                if (missingYVars.length > 0) {
                    const missingYVarNames = missingYVars.map((yVar) => yVar.idShort).join(', ');
                    this.navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'warning',
                        btnColor: 'buttonText',
                        text: 'y-values "' + missingYVarNames + '" not available in LinkedSegment Data!',
                    });
                }

                // Order the datasets based on the yVariables
                const newDatasets = this.yVariables
                    .map((yVar) => datasetsFiltered.find((key) => key.includes(yVar.idShort)))
                    .filter((key) => key !== undefined)
                    .map((key: any) => datasets[key]);

                // console.log('Filtered and Ordered Datasets: ', newDatasets);
                this.timeSeriesValues = newDatasets;
            },

            extractTopic(headerLine: string) {
                // Implement this method to extract the topic from the header line
                // This is a placeholder implementation
                const columns = headerLine.split(',');
                return columns[columns.length - 1];
            },

            processDataset(headerLine: string, datasetLines: any) {
                // console.log('Dataset Lines: ', datasetLines, ' Header Line: ', headerLine)
                const headers = headerLine.split(',');
                const valueIndex = headers.indexOf('_value');
                const timeIndex = headers.indexOf('_time');

                return datasetLines.slice(1).map((line: any) => {
                    const columns = line.split(',');
                    return {
                        time: columns[timeIndex],
                        value: parseFloat(columns[valueIndex]),
                    };
                });
            },

            fetchExternalData() {
                if (!this.selectedSegment) {
                    return;
                }
                if (!this.timeVariable) {
                    return;
                }
                if (this.yVariables.length == 0) {
                    return;
                }
                this.getFileData();
            },

            // Function to get the file contents of an ExternalSegments File
            getFileData() {
                // console.log('Selected Segment: ', this.selectedSegment);
                // get the Data File/Blob submodel element
                const dataFile = this.selectedSegment.value.find((smc: any) => smc.idShort === 'Data');
                // determine the path to the file
                let path = dataFile.value;
                if (path.startsWith('/')) {
                    path =
                        this.submodelElementData.path +
                        '/submodel-elements/Segments.' +
                        this.selectedSegment.idShort +
                        '.Data/attachment';
                }
                // console.log('Path: ', path);
                // get the file contents
                let context = 'retrieving File Contents';
                let disableMessage = true;
                this.getRequest(path, context, disableMessage).then((response: any) => {
                    if (response.success) {
                        // console.log('File Contents: ', response.data);
                        this.convertPlainCSVtoArray(response.data);
                    }
                });
            },

            convertPlainCSVtoArray(csvData: any) {
                const { headers, data } = this.parseCSV(csvData);
                const timeIndex = headers.indexOf(this.timeVariable.idShort);
                // handle the case where timeIndex is -1
                if (timeIndex === -1) {
                    this.navigationStore.dispatchSnackbar({
                        status: true,
                        timeout: 4000,
                        color: 'warning',
                        btnColor: 'buttonText',
                        text: 'time-value ' + this.timeVariable.idShort + ' not available in ExternalSegment Data!',
                    });
                    return;
                }
                let yIndexes = this.yVariables.map((yVar) => headers.indexOf(yVar.idShort));
                // display an alert if the yVariable is not available in the records (specify the yVariable name)
                yIndexes.forEach((yIndex, index) => {
                    if (yIndex === -1) {
                        this.navigationStore.dispatchSnackbar({
                            status: true,
                            timeout: 4000,
                            color: 'warning',
                            btnColor: 'buttonText',
                            text:
                                'y-value ' + this.yVariables[index].idShort + ' not available in ExternalSegment Data!',
                        });
                    }
                });
                // handle the case where yIndexes contains -1 (remove only the -1 values)
                yIndexes = yIndexes.filter((index) => index !== -1);
                const datasets = yIndexes.map((yIndex) =>
                    data.map((row) => ({
                        time: row[timeIndex],
                        value: Number(row[yIndex]),
                    }))
                );
                // console.log('Datasets: ', datasets);
                this.timeSeriesValues = datasets;
            },

            parseCSV(csvString: string) {
                // Splitting by a regular expression to handle both \n and \r\n
                const lines = csvString.split(/\r?\n/);
                const headers = lines[0].split(',').map((header) => header.trim()); // Trimming to remove any trailing \r
                // Filter out empty lines and then split each line into columns
                const data = lines
                    .slice(1)
                    .filter((line) => line)
                    .map((line) => line.split(','));
                // console.log('Headers: ', headers, ' Data: ', data);
                return { headers, data };
            },

            createObject() {
                let dashboardElement = {} as any;
                dashboardElement.title = this.submodelElementData.idShort;
                dashboardElement.segment = this.selectedSegment;
                dashboardElement.timeValue = this.timeVariable;
                dashboardElement.yValues = this.yVariables;
                if (this.apiToken && this.apiToken !== '') dashboardElement.apiToken = this.apiToken;
                dashboardElement.chartType = this.selectedChartType;
                dashboardElement.chartOptions = this.chartOptions;
                this.dashboardAdd(dashboardElement);
            },

            getChartOptions(options: any) {
                // console.log('Chart Options: ', options);
                this.chartOptions = options;
                let chartOptionsObject = {
                    chartOptions: options,
                };
                // Emit the new chart options to the Edit Element Dialog
                this.$emit('newOptions', chartOptionsObject);
            },

            clearChartOptions(event: any) {
                this.chartOptions = {};
                let chartType = {
                    chartType: event,
                };
                // Emit the new chart type to the Edit Element Dialog
                this.$emit('newOptions', chartType);
            },

            emitSegment(event: any) {
                let segmentObject = {
                    segment: event,
                };
                // Emit the new segment to the Edit Element Dialog
                this.$emit('newOptions', segmentObject);
            },

            emitTimeValue(event: any) {
                let timeValObject = {
                    timeVal: event,
                };
                // Emit the new time value to the Edit Element Dialog
                this.$emit('newOptions', timeValObject);
            },

            emitYValue(event: any) {
                let yValObject = {
                    yvals: event,
                };
                // Emit the new y values to the Edit Element Dialog
                this.$emit('newOptions', yValObject);
            },
        },
    });
</script>
