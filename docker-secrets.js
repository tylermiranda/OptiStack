import fs from 'fs';
import path from 'path';

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
            const secretPath = path.resolve(fileVarValue);
            
            // Security: Ensure the path doesn't contain directory traversal attempts
            // This is a defense-in-depth measure, as environment variables should be trusted
            if (fileVarValue.includes('..')) {
                console.error(`ERROR: Invalid path for ${varName}: path traversal detected in ${fileVarValue}`);
                process.exit(1);
            }
            
            console.log(`Getting secret ${varName} from ${secretPath}`);
            const content = fs.readFileSync(secretPath, 'utf8').trim();
            return content;
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
            const secretPath = path.resolve(fileVarValue);
            
            // Security: Ensure the path doesn't contain directory traversal attempts
            // This is a defense-in-depth measure, as environment variables should be trusted
            if (fileVarValue.includes('..')) {
                console.error(`ERROR: Invalid path for ${baseVarName}: path traversal detected in ${fileVarValue}`);
                process.exit(1);
            }
            
            console.log(`Configure ${baseVarName}`);
            console.log(`Getting secret ${baseVarName} from ${secretPath}`);
            const content = fs.readFileSync(secretPath, 'utf8').trim();
            process.env[baseVarName] = content;
            delete process.env[fileVarName]; // Remove the _FILE variant
        } catch (error) {
            console.error(`ERROR: Failed to read secret file for ${baseVarName} at ${fileVarValue}:`, error.message);
            process.exit(1);
        }
    });
}
