
// This is a client-side simulation of authentication for development/demo.

const PLAIN_PASSWORD = 'CNA-DEV-2026';
const ALLOWED_USERNAMES = ['DPM_OP_0001'];

/**
 * Verifies user credentials.
 * @param username Entered Operator ID
 * @param password Entered Access Key
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
    const trimmedUsername = (username || '').trim();
    const trimmedPassword = (password || '').trim();
    
    // Normalize username (handle both DPM_OP_0001 and DPM-OP-0001)
    const normalizedInput = trimmedUsername.replace(/-/g, '_').toUpperCase();
    
    const isUsernameValid = ALLOWED_USERNAMES.includes(normalizedInput);
    const isPasswordValid = trimmedPassword === PLAIN_PASSWORD;
    
    if (!isUsernameValid || !isPasswordValid) {
        console.warn(`[AUTH] Failed attempt. Input User: "${trimmedUsername}" (Normalized: "${normalizedInput}"), Input Pass: "${trimmedPassword}"`);
        return false;
    }
    
    console.log(`[AUTH] Successful login for: ${normalizedInput}`);
    return true;
}
