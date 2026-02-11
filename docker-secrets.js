import fs from 'fs';
import path from 'path';

const FILE_SUFFIX = '_FILE';

/**
 * Read a secret from a file with security checks.
 * @private
 * @param {string} filePath - The file path to read
 * @param {string} varName - The variable name (for logging)
 * @returns {string} - The content of the file, trimmed
 */
function readSecretFile(filePath, varName) {
    const resolvedPath = path.resolve(filePath);
    
    // Security: Basic validation to detect obvious path traversal attempts
    // Note: This is defense-in-depth. The primary security relies on:
    // 1. File system permissions (secrets should only be readable by the app)
    // 2. Trusted environment variables (set by system admin, not users)
    if (filePath.includes('..') || filePath.includes('~')) {
        console.error(`ERROR: Invalid path for ${varName}: suspicious characters detected in ${filePath}`);
        process.exit(1);
    }
    
    console.log(`Getting secret ${varName} from ${resolvedPath}`);
    const content = fs.readFileSync(resolvedPath, 'utf8').trim();
    return content;
}

/**
 * Validate mutual exclusivity of direct and file-based environment variables.
 * @private
 * @param {string} varName - The base variable name
 * @param {string} directValue - The direct environment variable value
 * @param {string} fileValue - The file-based environment variable value
 */
function validateMutualExclusivity(varName, directValue, fileValue) {
    if (directValue && fileValue) {
        console.error(`ERROR: Both ${varName} and ${varName}${FILE_SUFFIX} are set (but are exclusive)`);
        process.exit(1);
    }
}

/**
 * Load Docker secrets from environment variables with _FILE suffix.
 * This function checks for environment variables ending in _FILE and reads
 * the content of the file they point to, then exposes it as the base variable name.
 * 
 * For example, if ADMIN_PASSWORD_FILE=/run/secrets/admin_password exists,
 * it will read that file and make its content available as ADMIN_PASSWORD.
 * 
 * @param {string} varName - The base environment variable name (without _FILE suffix)
 * @returns {string|undefined} - The value from the file, or undefined if not set
 */
export function getSecretOrEnv(varName) {
    const fileVarName = `${varName}${FILE_SUFFIX}`;
    const fileVarValue = process.env[fileVarName];
    const directValue = process.env[varName];

    // Validate mutual exclusivity
    validateMutualExclusivity(varName, directValue, fileVarValue);

    // If _FILE variant is set, read the file
    if (fileVarValue) {
        try {
            return readSecretFile(fileVarValue, varName);
        } catch (error) {
            console.error(`ERROR: Failed to read secret file for ${varName} at ${fileVarValue}:`, error.message);
            process.exit(1);
        }
    }

    // Otherwise return the direct value (which might be undefined)
    return directValue;
}

/**
 * Initialize all Docker secrets by processing all environment variables with _FILE suffix.
 * This will load secrets into process.env for backwards compatibility.
 */
export function initDockerSecrets() {
    const envVars = Object.keys(process.env);
    const fileVars = envVars.filter(key => key.endsWith(FILE_SUFFIX) && process.env[key]);

    fileVars.forEach(fileVarName => {
        const baseVarName = fileVarName.slice(0, -FILE_SUFFIX.length);
        const fileVarValue = process.env[fileVarName];
        const directValue = process.env[baseVarName];

        // Validate mutual exclusivity
        validateMutualExclusivity(baseVarName, directValue, fileVarValue);

        // Read the file and set the base variable
        try {
            console.log(`Configure ${baseVarName}`);
            const content = readSecretFile(fileVarValue, baseVarName);
            process.env[baseVarName] = content;
            delete process.env[fileVarName]; // Remove the _FILE variant
        } catch (error) {
            console.error(`ERROR: Failed to read secret file for ${baseVarName} at ${fileVarValue}:`, error.message);
            process.exit(1);
        }
    });
}
