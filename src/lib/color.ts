/**
 * Determines the appropriate text color (white or black) for a button
 * based on the background color's luminance.
 * 
 * Uses the W3C WCAG formula for relative luminance:
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getReadableButtonTextColor(hexColor: string): "white" | "black" {
  // Validate hex color format (#RRGGBB)
  if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
    console.warn(`Invalid hex color: ${hexColor}, defaulting to white text`);
    return "white";
  }

  // Extract RGB values
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  // Linearize RGB values
  const linearize = (value: number): number => {
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  const rLinear = linearize(r);
  const gLinear = linearize(g);
  const bLinear = linearize(b);

  // Calculate relative luminance
  const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? "white" : "black";
}
