import type {
    AASTemplate,
    TemplateValidationError,
    ValidationResult,
} from '@/UserPlugins/TemplateAASPlugin/types/templates/TemplateTypes';
import type { ErrorObject } from 'ajv';
import Ajv from 'ajv';
import templateSchema from '@/UserPlugins/TemplateAASPlugin/templates/template-schemas.json';

export class TemplateValidatorService {
    private ajv: InstanceType<typeof Ajv>;

    constructor() {
        this.ajv = new Ajv({ allErrors: true });
    }

    private isValidVersion(version: string): boolean {
        return /^\d+\.\d+$/.test(version);
    }

    private compareVersions(v1: string, v2: string): number {
        const [major1, minor1] = v1.split('.').map(Number);
        const [major2, minor2] = v2.split('.').map(Number);

        if (major1 !== major2) {
            return major1 - major2;
        }
        return minor1 - minor2;
    }

    validateTemplate(template: AASTemplate): ValidationResult {
        const errors: TemplateValidationError[] = [];
        const validate = this.ajv.compile(templateSchema);
        const isValid = validate(template);

        if (!isValid && validate.errors) {
            validate.errors.forEach((error: ErrorObject) => {
                errors.push({
                    code: 'SCHEMA_VALIDATION_ERROR',
                    message: error.message || 'Unknown validation error',
                    path: error.schemaPath,
                });
            });
        }

        // Additional custom validations
        if (!this.isValidVersion(template.version)) {
            errors.push({
                code: 'INVALID_VERSION_FORMAT',
                message: 'Version must be in format major.minor (e.g. 1.0)',
            });
        }

        if (!this.isValidVersion(template.aasVersion)) {
            errors.push({
                code: 'INVALID_AAS_VERSION_FORMAT',
                message: 'AAS version must be in format major.minor (e.g. 3.0)',
            });
        }

        // Validate submodel versions
        template.submodels.forEach((submodel, index) => {
            if (!this.isValidVersion(submodel.version)) {
                errors.push({
                    code: 'INVALID_SUBMODEL_VERSION_FORMAT',
                    message: `Submodel ${submodel.name} version must be in format major.minor (e.g. 1.0)`,
                    path: `/submodels/${index}/version`,
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    validateAASVersionCompatibility(template: AASTemplate, targetVersion: string): ValidationResult {
        const errors: TemplateValidationError[] = [];

        if (this.compareVersions(template.aasVersion, targetVersion) > 0) {
            errors.push({
                code: 'INCOMPATIBLE_AAS_VERSION',
                message: `Template requires AAS version ${template.aasVersion} but target system supports ${targetVersion}`,
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    validateTemplateInheritance(template: AASTemplate, parentTemplate: AASTemplate): ValidationResult {
        const errors: TemplateValidationError[] = [];

        // Check version compatibility
        if (this.compareVersions(template.version, parentTemplate.version) < 0) {
            errors.push({
                code: 'INVALID_INHERITANCE_VERSION',
                message: `Template version ${template.version} cannot inherit from parent version ${parentTemplate.version}`,
            });
        }

        // Check AAS version compatibility
        if (this.compareVersions(template.aasVersion, parentTemplate.aasVersion) < 0) {
            errors.push({
                code: 'INVALID_INHERITANCE_AAS_VERSION',
                message: `Template AAS version ${template.aasVersion} cannot inherit from parent AAS version ${parentTemplate.aasVersion}`,
            });
        }

        // Check for duplicate submodel IDs
        const parentSubmodelIds = new Set(parentTemplate.submodels.map((sm) => sm.id));
        template.submodels.forEach((submodel, index) => {
            if (parentSubmodelIds.has(submodel.id)) {
                errors.push({
                    code: 'DUPLICATE_SUBMODEL_ID',
                    message: `Submodel ID ${submodel.id} already exists in parent template`,
                    path: `/submodels/${index}/id`,
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
