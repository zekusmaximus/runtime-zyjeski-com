/**
 * CSP-compliant utilities for dynamic style creation
 * Provides safe methods for creating dynamic styles that comply with Content Security Policy
 */

/**
 * Creates a CSP-compliant style element with nonce
 * @param {string} id - Unique ID for the style element
 * @param {string} cssText - CSS content to add
 * @returns {HTMLStyleElement|null} Created style element or null if failed
 */
export function createCSPCompliantStyle(id, cssText) {
  // Check if style already exists
  if (document.getElementById(id)) {
    return document.getElementById(id);
  }

  try {
    const style = document.createElement('style');
    style.id = id;

    // Add nonce if available for CSP compliance
    const nonce = window.APP_CONFIG?.cspNonce;

    if (nonce) {
      style.setAttribute('nonce', nonce);
      console.log('CSP Utils: Setting nonce', nonce, 'on style element', id);
    } else {
      console.error('CSP Utils: No nonce available! APP_CONFIG:', window.APP_CONFIG);
      console.error('CSP Utils: Style will be blocked by CSP');
    }

    style.textContent = cssText;
    document.head.appendChild(style);
    return style;
  } catch (error) {
    console.error('Failed to create CSP-compliant style:', error);
    return null;
  }
}

/**
 * Updates or creates a CSP-compliant style element
 * @param {string} id - Unique ID for the style element
 * @param {string} cssText - CSS content to add or update
 * @returns {HTMLStyleElement|null} Style element or null if failed
 */
export function updateCSPCompliantStyle(id, cssText) {
  const existingStyle = document.getElementById(id);
  
  if (existingStyle) {
    existingStyle.textContent = cssText;
    return existingStyle;
  }
  
  return createCSPCompliantStyle(id, cssText);
}

/**
 * Removes a dynamic style element
 * @param {string} id - ID of the style element to remove
 * @returns {boolean} True if removed, false if not found
 */
export function removeCSPCompliantStyle(id) {
  const style = document.getElementById(id);
  if (style && style.tagName === 'STYLE') {
    style.remove();
    return true;
  }
  return false;
}

/**
 * Checks if CSP nonce is available
 * @returns {boolean} True if nonce is available
 */
export function hasCSPNonce() {
  return !!(window.APP_CONFIG?.cspNonce);
}

/**
 * Gets the current CSP nonce
 * @returns {string|null} Current nonce or null if not available
 */
export function getCSPNonce() {
  return window.APP_CONFIG?.cspNonce || null;
}
