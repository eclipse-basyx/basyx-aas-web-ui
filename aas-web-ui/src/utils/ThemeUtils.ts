// Utility function to make the color lighter or darker
export function adjustColorBrightness(hex: string, value: number) {
    // Ensure value is clamped between -1 and 1
    value = Math.max(-1, Math.min(1, value));

    // Remove the hash if present
    hex = hex.replace(/^#/, '');

    // Handle shorthand hex colors (e.g., "03F") by converting to full form
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((char) => char + char)
            .join('');
    }

    // Validate hex color
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color. Please provide a 3 or 6 character hex string.');
    }

    // Convert hex to RGB
    const num = parseInt(hex, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    // Function to adjust each color component
    const adjust = (color: number) => {
        if (value > 0) {
            // Lighten color: interpolate towards 255
            return Math.round(color + (255 - color) * value);
        } else if (value < 0) {
            // Darken color: interpolate towards 0
            return Math.round(color + color * value);
        } else {
            // No change
            return color;
        }
    };

    r = adjust(r);
    g = adjust(g);
    b = adjust(b);

    // Clamp values to [0, 255]
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // Convert RGB back to hex
    const toHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
