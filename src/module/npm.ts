import validateProjectName from "validate-npm-package-name";

/**
 * Validate project name
 *
 * @param name project name
 * @returns
 */
export function ValidateNpmName(name: string): {
    errors?: string[];
    valid: boolean;
} {
    const nameValidation = validateProjectName(name);
    if (nameValidation.validForNewPackages) {
        return {valid: true};
    }

    return {
        errors: [
            ...(nameValidation.errors || []),
            ...(nameValidation.warnings || []),
        ],
        valid: false,
    };
}
