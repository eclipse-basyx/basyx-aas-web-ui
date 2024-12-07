![Docker Pulls](https://img.shields.io/docker/pulls/eclipsebasyx/aas-gui)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/eclipsebasyx/aas-gui)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/eclipse-basyx/basyx-aas-web-ui)
![GitHub](https://img.shields.io/github/license/eclipse-basyx/basyx-aas-web-ui)
![GitHub top language](https://img.shields.io/github/languages/top/eclipse-basyx/basyx-aas-web-ui)

# BaSyx AAS Web UI

The AAS Web UI is a Vue.js Webapplication to visualize and manage Asset Administration Shells, Submodels and Concept Descriptions.

![alt text](Docs/Figs/AAS_Web_UI.png "AAS GUI")

## Documentation

The documentation of the BaSyx AAS Web UI can be found in the [BaSyx Wiki](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html).

## AAS Web UI Compatibility and Features

### Important Notice :warning:

The AAS Web UI is now **only compatible with the components of BaSyx V2 and the Asset Administration Shell V3**. 

If you still wish to use BaSyx V1, please use the following release of the UI:

```bash
docker pull eclipsebasyx/aas-gui:v230703
```

### Supported SubmodelElements

As of now, not all new SubmodelElements of the AAS V3 are supported. Additional elements will be added in future updates. The currently supported SubmodelElements are:

- SubmodelElementCollection
- SubmodelElementList
- Property
- MultiLanguageProperty
- File
- Blob
- Operation
- ReferenceElement
- Range
- Entity
- RelationshipElement
- AnnotatedRelationshipElement

## Getting Started

### Quick Start:

See examples in the [basyx-java-server-sdk](https://github.com/eclipse-basyx/basyx-java-server-sdk/tree/main/examples
) Repository.

### Plugin Development

The BaSyx-UI includes a Feature to develop your own Plugins. They can be used to display and interact with a Submodel (and/or SubmodelElements).

Plugins will be displayed in the `Visualization`-Part of the UI. In order for Plugins to be loaded, a Submodel(Element) has to have a SemanticID which matches with the configured `semanticId` of the desired Plugin. The configuration of a Plugin `semanticId` can be done via a string (e.g. `'http://hello.world.de/plugin_submodel'`) or via an array for multiple SemanticIds (e.g. `['http://hello.world.de/plugin_submodel', 'http://hello.world.de/plugin_property']`)

To include your own Plugins, you have to create a Vue.js Component and add it to the `UserPlugins`-Folder in the `aas-web-ui/src`-Directory. The Plugin will then be automatically loaded and displayed in the UI. 

> If you plan on including your own plugins, keep in mind that you have to build the Docker Image yourself!

A Demo-Plugin can be found here:

[HelloWorldPlugin.vue](./aas-web-ui/src/UserPlugins/HelloWorldPlugin.vue)

### Prerequisites for developing on you own machine

After you cloned the project to your local machine, it is recommendet to install `ESLint` globally:

```
npm install --global eslint
```

and the `ESLint` and `Prettier ESLint` extensions in VS Code.

Before starting a dev server, run the

```
yarn
```

command inside the `aas-web-ui` directory. For more details for your specific OS, follow the instructions in the next subsections.

### How to develop on MacOS:

1. Install Node and NPM ([Node installation Tutorial for Mac](https://treehouse.github.io/installation-guides/mac/node-mac.html))
2. Install yarn
    ```bash
    npm install --global yarn
    ```
3. Clone Repository:
    ```bash
    git clone https://github.com/eclipse-basyx/basyx-aas-web-ui.git
    ```
4. Bootstrap the application:
    ```bash
    . bootstrap.sh
    ```
5. On initial installation answer first question with **y** (Yes) otherwise **n** (No)
6. Answer second question with **n** (No)

### How to develop on Linux:

1. Install Node and NPM ([Node installation Tutorial for Linux](https://nodejs.org/en/download/package-manager/))
2. Install yarn
    ```bash
    npm install --global yarn
    ```
3. Clone Repository:
    ```bash
    git clone https://github.com/eclipse-basyx/basyx-aas-web-ui.git
    ```
4. Bootstrap the application:
    ```bash
    . bootstrap.sh
    ```
5. On initial installation answer first question with **y** (Yes) otherwise **n** (No)
6. Answer second question with **n** (No)

### How to develop on Windows:

1. Install WSL 2 ([WSL installation Tutorial](https://docs.microsoft.com/en-us/windows/wsl/install))
2. Open IDE (e.g. VSCode: [WSL in VSCode](https://code.visualstudio.com/docs/remote/wsl))
3. Install Node and NPM ([Node installation Tutorial for Linux](https://nodejs.org/en/download/package-manager/))
4. Install yarn
    ```bash
    npm install --global yarn
    ```
5. Clone Repository:
    ```bash
    git clone https://github.com/eclipse-basyx/basyx-aas-web-ui.git
    ```
6. Bootstrap the application:
    ```bash
    . bootstrap.sh
    ```
7. On initial installation answer first question with **y** (Yes) otherwise **n** (No)
8. Answer second question with **n** (No)

### Building your own Docker Image:

The latest Off-the-Shelf version is available on [DockerHub](https://hub.docker.com/r/eclipsebasyx/aas-gui/tags).

1. Build the image by executing
```bash
docker build aas-web-ui -t eclipsebasyx/aas-ui
```

2. Start a container by executing
```bash
docker run -p 3000:3000 eclipsebasyx/aas-ui
```

3. You can also predefine the AAS Discovery Service Path, AAS- and Submodel Registry Path, AAS-, Submodel- and Concept Description Repository Path, the Apllications primary color and the Base Path by adding the following arguments to the run command:

`-e AAS_DISCOVERY_PATH=<aas_discovery_path>`

`-e AAS_REGISTRY_PATH=<aas_registry_path>`

`-e SUBMODEL_REGISTRY_PATH=<submodel_registry_path>`

`-e AAS_REPO_PATH: <aas_repo_path>`

`-e SUBMODEL_REPO_PATH: <submodel_repo_path>`

`-e CD_REPO_PATH: <concept_description_repo_path>`

`-e PRIMARY_LIGHT_COLOR=<primary_light_color>`

`-e PRIMARY_DARK_COLOR=<primary_dark_color>`

`-e LOGO_LIGHT_PATH=<logo_light_path>`

`-e LOGO_DARK_PATH=<logo_dark_path>`

`-e BASE_PATH=<base_path>`

`-e ENDPOINT_CONFIG_AVAILABLE=<true/false>`

4. If you want to use a custom logo, you can mount a folder containing the logo and the favicon.ico to the container by adding the following argument to the run command:

`-v <local_path_to_logo_folder>:/usr/src/app/dist/Logo`

5. The GUI is now available at:

```bash
http://localhost:3000/<base_path>
```

#### Docker Compose:

If you want to use the AAS Web UI as part of a Docker Compose project you can use the following example in your `docker-compose.yml`

```
aas-web-gui:
    image: eclipsebasyx/aas-gui:<tag>
    container_name: aas-web-gui
    ports:
        - "3000:3000"
    environment:
        AAS_DISCOVERY_PATH: "<aas_discovery_path>"
        AAS_REGISTRY_PATH: "<aas_registry_path>"
        SUBMODEL_REGISTRY_PATH: "<submodel_registry_path>"
        AAS_REPO_PATH: "aas_repo_path"
        SUBMODEL_REPO_PATH: "submodel_repo_path"
        CD_REPO_PATH: "concept_description_repo_path"
        PRIMARY_COLOR: "<primary_color>"
        PRIMARY_LIGHT_COLOR: "<primary_light_color>"
        PRIMARY_DARK_COLOR: "<primary_dark_color>"
        LOGO_PATH: "<logo_path>"
        LOGO_LIGHT_PATH: "<logo_light_path>"
        LOGO_DARK_PATH: "<logo_dark_path>"
        BASE_PATH: "<base_path>"
        ENDPOINT_CONFIG_AVAILABLE: "<true/false>"
    volumes:
        - <local_path_to_logo_folder>:/usr/src/app/dist/Logo
```

#### CORS configuration of the Registry and Repositories

To be able to access the BaSyx AAS data from the Web UI, you need to add a wildcard to cross-origin resource sharing on the Registry- and AAS-, Submodel- and Concept Description Repository (AAS Environment). An example on how to do this is shown in the examples folder in the [basyx-java-server-sdk](https://github.com/eclipse-basyx/basyx-java-server-sdk/tree/main/examples
) Repository.

#### Docker with nginx

The [basyx-java-server-sdk](https://github.com/eclipse-basyx/basyx-java-server-sdk/tree/main/examples/BaSyxNGINX) Repository includes an example Docker Compose project which shows how to use the UI with nginx and configure a base path so that the UI can be hosted under

```bash
http(s)://your-url/base-path
```

## How to contribute

### Start Dev Environment (e.g. VSCode):

1. Open terminal/shell on the root directory of the project
2. Bootstrap the project
    ```bash
    . bootstrap.sh
    ```
3. On initial installation answer first question with **y** (Yes) otherwise **n** (No)
4. Answer second question with **n** (No)
5. Start coding :wink:

### Create deployable (optimized) build:
> :warning: does not support the plugin mechanism :warning:

1. Open terminal/shell on the root directory of the project
2. Go to the aas-web-ui folder
    ```bash
    cd aas-web-ui
    ```
3. Build the project
    ```bash
    yarn install
    yarn build
    ```
6. Source Files are created here:

`aas-web-ui/dist`

### Contribute your code to this repo

As a prerequesite you need to sign the [Eclipse Contributor Agreement](https://www.eclipse.org/legal/ECA.php).

After you signed the ECA you can create Pull Requests to this Repository.

> All PRs will be checked for compliance and functionality!
