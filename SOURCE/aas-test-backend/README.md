# BaSyx Test Backend

Dies ist eine Testkonfiguration zur vereinfachten Bereitstellung des Backends für Entwickler am Frontend.

Die Konfiguration basiert auf dem minimalen Beispiel im [basyx-java-server-sdk](https://github.com/eclipse-basyx/basyx-java-server-sdk/tree/main/examples) Repository.

# BaSyx Infrastructure Setup

Nach der Ausführung von

```bash
docker-compose up -d
```

werden die jeweiligen Komponenten auf folgenden Adressen gestartet:
* AAS Repository (http://localhost:8081/shells)
* Submodel Repository (http://localhost:8081/submodels)
* ConceptDescription Repository (http://localhost:8081/concept-descriptions)
* AAS Registry (http://localhost:8082/shell-descriptors)
* Submodel Registry (http://localhost:8083/submodel-descriptors)
* AAS Discovery (http://localhost:8084/lookup/shells)
* AAS Web UI (http://localhost:3000)

