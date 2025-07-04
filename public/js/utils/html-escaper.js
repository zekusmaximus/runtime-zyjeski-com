// HTML Escaping Utility for XSS Prevention
// Runtime.zyjeski.com - Secure HTML content handling

/**
 * Comprehensive HTML escaping utility to prevent XSS attacks
 * This module provides secure methods for handling dynamic content in the DOM
 */
class HTMLEscaper {
  /**
   * Escape HTML entities to prevent XSS attacks
   * @param {string} unsafe - The unsafe string to escape
   * @returns {string} The escaped string
   */
  static escape(unsafe) {
    if (typeof unsafe !== 'string') {
      return String(unsafe || '');
    }
    
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\//g, "&#x2F;"); // Extra safety for attributes
  }

  /**
   * Decode HTML entities (use sparingly and only for trusted content)
   * @param {string} encoded - The encoded string to decode
   * @returns {string} The decoded string
   */
  static decode(encoded) {
    if (typeof encoded !== 'string') {
      return String(encoded || '');
    }
    
    const textarea = document.createElement('textarea');
    textarea.innerHTML = encoded;
    return textarea.value;
  }

  /**
   * Escape HTML but preserve line breaks as <br> tags
   * @param {string} unsafe - The unsafe string to escape
   * @returns {string} The escaped string with line breaks preserved
   */
  static escapeWithLineBreaks(unsafe) {
    return this.escape(unsafe).replace(/\n/g, '<br>');
  }

  /**
   * Validate that a string is safe for innerHTML (contains only whitelisted HTML)
   * @param {string} html - The HTML string to validate
   * @returns {boolean} True if safe, false otherwise
   */
  static isSafeHTML(html) {
    // Only allow basic formatting tags - extend as needed
    const allowedTags = /<\/?(?:b|i|em|strong|br|p|span|div)(?:\s[^>]*)?>|&(?:amp|lt|gt|quot|#039|#x2F);/gi;
    const strippedHTML = html.replace(allowedTags, '');
    return !/<|>/.test(strippedHTML);
  }

  /**
   * Escape attributes for safe use in HTML attributes
   * @param {string} unsafe - The unsafe attribute value
   * @returns {string} The escaped attribute value
   */
  static escapeAttribute(unsafe) {
    if (typeof unsafe !== 'string') {
      return String(unsafe || '');
    }
    
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Escape content for safe use in JavaScript strings
   * @param {string} unsafe - The unsafe string
   * @returns {string} The escaped string safe for JS
   */
  static escapeJS(unsafe) {
    if (typeof unsafe !== 'string') {
      return String(unsafe || '');
    }
    
    return unsafe
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/\f/g, "\\f")
      .replace(/\v/g, "\\v")
      .replace(/\0/g, "\\0");
  }

  /**
   * Escape content for safe use in CSS
   * @param {string} unsafe - The unsafe string
   * @returns {string} The escaped string safe for CSS
   */
  static escapeCSS(unsafe) {
    if (typeof unsafe !== 'string') {
      return String(unsafe || '');
    }
    
    return unsafe.replace(/[<>"'&]/g, (match) => {
      const escapeMap = {
        '<': '\\3C ',
        '>': '\\3E ',
        '"': '\\22 ',
        "'": '\\27 ',
        '&': '\\26 '
      };
      return escapeMap[match];
    });
  }

  /**
   * Sanitize user input by removing potentially dangerous content
   * @param {string} input - The user input to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} The sanitized input
   */
  static sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }

    const {
      maxLength = 1000,
      allowLineBreaks = false,
      allowBasicFormatting = false
    } = options;

    let sanitized = input.slice(0, maxLength);

    if (!allowLineBreaks) {
      sanitized = sanitized.replace(/[\r\n]/g, ' ');
    }

    if (!allowBasicFormatting) {
      sanitized = this.escape(sanitized);
    } else {
      // Allow only basic formatting tags
      const allowedTags = ['b', 'i', 'em', 'strong', 'br'];
      const tagRegex = new RegExp(`<(?!/?(?:${allowedTags.join('|')})(?:\\s|>))[^>]*>`, 'gi');
      sanitized = sanitized.replace(tagRegex, '');
      
      // Escape remaining content while preserving allowed tags
      sanitized = sanitized.replace(/[&<>"']/g, (match, offset, string) => {
        // Don't escape if it's part of an allowed tag
        const beforeMatch = string.substring(0, offset);
        const afterMatch = string.substring(offset);
        const inTag = /<[^>]*$/.test(beforeMatch) && /^[^<]*>/.test(afterMatch);
        
        if (inTag) return match;
        
        const escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return escapeMap[match];
      });
    }

    return sanitized;
  }

  /**
   * Create a safe DOM element with escaped content
   * @param {string} tagName - The HTML tag name
   * @param {string} content - The content to escape and insert
   * @param {Object} attributes - Attributes to set (will be escaped)
   * @returns {HTMLElement} The created DOM element
   */
  static createSafeElement(tagName, content = '', attributes = {}) {
    const element = document.createElement(tagName);
    
    // Set text content safely
    if (content) {
      element.textContent = content;
    }
    
    // Set attributes safely
    for (const [key, value] of Object.entries(attributes)) {
      if (typeof key === 'string' && value !== null && value !== undefined) {
        element.setAttribute(key, this.escapeAttribute(String(value)));
      }
    }
    
    return element;
  }

  /**
   * Log security violations for monitoring
   * @param {string} input - The input that caused the violation
   * @param {string} context - Context where the violation occurred
   */
  static logSecurityViolation(input, context) {
    console.warn('XSS Prevention: Potentially unsafe content detected', {
      input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
      context,
      timestamp: new Date().toISOString()
    });
    
    // In production, you might want to send this to a security monitoring service
    if (window.DEBUG_MODE === false) {
      // Example: Send to monitoring service
      // fetch('/api/security/violations', { method: 'POST', body: JSON.stringify({ input, context }) });
    }
  }
}

// Export for ES6 modules
export default HTMLEscaper;

// Also make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.HTMLEscaper = HTMLEscaper;
}
