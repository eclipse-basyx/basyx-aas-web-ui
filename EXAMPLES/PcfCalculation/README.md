# PCF Calculation

This example demonstrates the `PCF Process` Module in the AAS Web UI. The module allows users to select a product shell (`assetkind`=`Type`) for a product that is being manufactured. A PCF calculation will take place based on selected materials resulting in a product instance shell (`assetkind`=`Instance`) with a calculated PCF Submodel.

## Getting started

You can run the provided example using Docker Compose. Make sure you have Docker and Docker Compose installed on your machine.

1. Clone the repository if you haven't already:

    ```bash
    git clone https://github.com/eclipse-basyx/basyx-aas-web-ui.git
    cd basyx-aas-web-ui/examples/PcfCalculation
    ```

2. Start the setup with Docker Compose:

    ```bash
    docker compose up -d
    ```

## Usage

1. Open the AAS Web UI in your browser (http://localhost:3000)
2. Navigate to the `PCF Process` module via the main menu
   ![PCF module selection](../../Docs/Figs/SelectPcfModule.png)
3. Select a product from the list of available shells
   ![Product type selection](../../Docs/Figs/ProductTypeSelection.png)
4. Provide a display name for the new product instance
5. Click on `Produce` to proceed to material selection
6. Select materials to be used in the product
7. Enter the amount of each material used
   ![Material selection](../../Docs/Figs/MaterialSelection.png)
8. See the preview of the calculated PCF equivalent CO2 emissions
9. Click on `Complete` to create the product instance AAS with the calculated PCF Submodel (+ Submodels of the original Type AAS)
