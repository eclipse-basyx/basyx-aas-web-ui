# BaSyx AAS Web UI

![Docker Pulls](https://img.shields.io/docker/pulls/eclipsebasyx/aas-gui)
![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/eclipsebasyx/aas-gui)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/eclipse-basyx/basyx-aas-web-ui)
![Metamodel](https://img.shields.io/badge/Metamodel-v3.X-yellow)
![API](https://img.shields.io/badge/API-v3.X-yellow)

A modern Vue.js web application for visualizing, managing, and interacting with Asset Administration Shells (AAS), Submodels, and Concept Descriptions in distributed BaSyx infrastructures.

![BaSyx AAS Web UI](Docs/Figs/AAS_Web_UI.png)

## ✨ Key Features

- **🌐 Multi-Infrastructure Support** - Connect to multiple distributed AAS infrastructures simultaneously
- **🔐 Secure Connections** - Full OAuth2, Basic Auth, and Bearer Token authentication support
- **✏️ Editing Capabilities** - Create, modify, and manage AAS, Submodels, and SubmodelElements
- **📊 Live Data Polling** - Real-time updates for dynamic SubmodelElements
- **🔌 Plugin System** - Extend functionality with custom Submodel visualization plugins
- **🧩 Modular Architecture** - Develop custom application modules for specialized use cases
- **✅ AAS V3 Compliant** - Full compliance with Asset Administration Shell V3 specification

## 📚 Documentation

Comprehensive documentation is available in the **[BaSyx Wiki](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html)**.

## 🚀 Quick Start

### For End Users (Deployment)

Pull and run the latest Docker image:

```bash
docker pull eclipsebasyx/aas-gui:latest
docker run -p 3000:3000 eclipsebasyx/aas-gui:latest
```

Access the UI at `http://localhost:3000`

📖 **Detailed Guides:**

- **[Getting Started with the Web UI](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/index.html#quick-start)** - First steps and basic usage
- **[Docker Configuration](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/features/docker_config.html)** - Deployment options and container setup
- **[Environment & Configuration](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/features/configuration.html)** - Environment variables and YAML-based infrastructure configuration
- **[Security Configuration](https://wiki.basyx.org/en/latest/content/user_documentation/basyx_components/web_ui/features/security.html)** - OAuth2, Basic Auth, and Bearer Token setup
- **[Working Examples](./examples/)** - Ready-to-use Docker Compose examples with multi-infrastructure and time-series setups

### For Developers (Extension & Contribution)

Clone the repository and start the development environment:

```bash
git clone https://github.com/eclipse-basyx/basyx-aas-web-ui.git
cd basyx-aas-web-ui
./bootstrap.sh
```

📖 **Development Guides:**

- **[Development Setup Guide](https://wiki.basyx.org/en/latest/content/developer_documentation/basyx_web_ui/getting_started.html)** - Prerequisites, environment setup, and local development
- **[Architecture Overview](https://wiki.basyx.org/en/latest/content/developer_documentation/basyx_web_ui/architecture.html)** - Understanding the codebase structure and design patterns
- **[Plugin Development](https://wiki.basyx.org/en/latest/content/developer_documentation/basyx_web_ui/creating_submodel_plugins.html)** - Create custom Submodel visualization plugins ([Demo Plugin](./aas-web-ui/src/UserPlugins/HelloWorldPlugin.vue))
- **[Custom Module Development](https://wiki.basyx.org/en/latest/content/developer_documentation/basyx_web_ui/developing_custom_modules.html)** - Build standalone application modules for the BaSyx UI
- **[Contribution Guidelines](https://wiki.basyx.org/en/latest/content/developer_documentation/basyx_web_ui/design_guidelines.html)** - Code standards, testing, and pull request process

## 📦 Examples

The [`examples/`](./examples/) directory contains ready-to-use configurations:

- **[MultiInfrastructure](./examples/MultiInfrastructure/)** - Connect to multiple BaSyx environments with different authentication methods
- **[TimeSeriesData](./examples/TimeSeriesData/)** - Real-time time-series data visualization with InfluxDB
- **[PcfCalculation](./examples/PcfCalculation/)** - Product Carbon Footprint calculation example

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Sign the **[Eclipse Contributor Agreement (ECA)](https://www.eclipse.org/legal/ECA.php)**
2. Fork the repository and create a feature branch
3. Make your changes following our code standards
4. Submit a pull request

All pull requests will be reviewed for compliance and functionality.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
