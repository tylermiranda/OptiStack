import fs from 'fs';
import path from 'path';

/**
 * Read a secret from a file with security checks.
 * @private
 * @param {string} filePath - The file path to read
 * @param {string} varName - The variable name (for logging)
 * @returns {string} - The content of the file, trimmed
 */
function readSecretFile(filePath, varName) {
    const resolvedPath = path.resolve(filePath);
    
    // Security: Validate the resolved path matches the input after normalization
    // This prevents path traversal by ensuring the resolved path doesn't escape
    // to an unintended location
    const normalizedInput = path.normalize(filePath);
    const isAbsoluteInput = path.isAbsolute(filePath);
    
    // If input was absolute, check it matches the resolved path
    if (isAbsoluteInput && path.normalize(resolvedPath) !== normalizedInput) {
        console.error(`ERROR: Invalid path for ${varName}: potential path traversal detected`);
        process.exit(1);
    }
    
    console.log(`Getting secret ${varName} from ${resolvedPath}`);
    const content = fs.readFileSync(resolvedPath, 'utf8').trim();
    return content;
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
    const fileVarName = `${varName}_FILE`;
    const fileVarValue = process.env[fileVarName];
    const directValue = process.env[varName];

    // If both are set, error out (they are mutually exclusive)
    if (directValue && fileVarValue) {
        console.error(`ERROR: Both ${varName} and ${fileVarName} are set (but are exclusive)`);
        process.exit(1);
    }

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
    const fileVars = envVars.filter(key => key.endsWith('_FILE') && process.env[key]);

    fileVars.forEach(fileVarName => {
        const baseVarName = fileVarName.slice(0, -5); // Remove '_FILE' suffix
        const fileVarValue = process.env[fileVarName];
        const directValue = process.env[baseVarName];

        // If both are set, error out (they are mutually exclusive)
        if (directValue && fileVarValue) {
            console.error(`ERROR: Both ${baseVarName} and ${fileVarName} are set (but are exclusive)`);
            process.exit(1);
        }

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
