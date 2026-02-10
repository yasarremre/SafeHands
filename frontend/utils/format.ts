/**
 * XLM Formatting Utilities
 * Soroban uses "stroops" (1 XLM = 10,000,000 stroops)
 */

const STROOPS_PER_XLM = BigInt(10000000);

/**
 * Convert stroops string to human-readable XLM format
 * e.g. "10000000" → "1.0000000 XLM"
 */
export function formatXLM(stroops: string): string {
    try {
        const val = BigInt(stroops);
        const whole = val / STROOPS_PER_XLM;
        const frac = val % STROOPS_PER_XLM;

        // Show up to 7 decimals, trim trailing zeros but keep at least 2
        const fracStr = frac.toString().padStart(7, "0");
        const trimmed = fracStr.replace(/0+$/, "").padEnd(2, "0");

        return `${whole}.${trimmed}`;
    } catch {
        return stroops; // fallback: return raw value
    }
}

/**
 * Convert user-input XLM amount to stroops string for contract
 * e.g. "1.5" → "15000000"
 */
export function parseXLMtoStroops(xlm: string): string {
    try {
        const parts = xlm.split(".");
        const whole = BigInt(parts[0] || "0") * STROOPS_PER_XLM;
        if (parts.length === 1) return whole.toString();

        const fracPart = parts[1].padEnd(7, "0").slice(0, 7);
        const frac = BigInt(fracPart);
        return (whole + frac).toString();
    } catch {
        return "0";
    }
}
