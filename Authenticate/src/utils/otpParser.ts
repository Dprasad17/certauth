/**
 * Utility to parse otpauth:// URIs.
 * Standard format: otpauth://TYPE/LABEL?secret=SECRET&issuer=ISSUER
 */
export const parseOTPAuthURI = (uri: string) => {
    try {
        // Regex to capture: type, label, and query string
        const match = uri.match(/^otpauth:\/\/([^/]+)\/([^?]+)\?(.+)$/i);

        if (!match) {
            throw new Error('Invalid OTPAuth URI format');
        }

        const type = match[1];
        const label = decodeURIComponent(match[2]);
        const queryString = match[3];

        // Simple query string parser
        const params: Record<string, string> = {};
        queryString.split('&').forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                params[key.toLowerCase()] = decodeURIComponent(value);
            }
        });

        const secret = params['secret'];
        const issuer = params['issuer'];

        // Advanced extraction: Label often contains Issuer:Account (e.g. Twitter:john@doe.com)
        const labelParts = label.split(':');
        const extractedIssuer = issuer || (labelParts.length > 1 ? labelParts[0].trim() : null);
        const account = labelParts.length > 1 ? labelParts[1].trim() : (issuer ? label : labelParts[0]?.trim());

        if (!secret) {
            throw new Error('Secret parameter is missing');
        }

        return {
            type,
            label,
            secret,
            issuer: extractedIssuer || 'Vault',
            account: account || 'Unnamed Identifier'
        };
    } catch (error) {
        // Quiet mode: return null if not a valid OTPAuth URI
        return null;
    }
};
