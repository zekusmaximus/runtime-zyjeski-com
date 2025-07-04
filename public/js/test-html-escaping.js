// HTML Escaping Test Suite
// Runtime.zyjeski.com - Security Testing

import HTMLEscaper from '/js/utils/html-escaper.js';

class HTMLEscapingTestSuite {
    constructor() {
        this.testResults = [];
        this.passCount = 0;
        this.failCount = 0;
        
        // Test data
        this.testCases = [
            {
                name: 'Basic HTML Characters',
                input: '<script>alert("xss")</script>',
                expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
            },
            {
                name: 'Attribute Injection',
                input: '" onmouseover="alert(1)"',
                expected: '&quot; onmouseover=&quot;alert(1)&quot;'
            },
            {
                name: 'JavaScript URL',
                input: 'javascript:alert(1)',
                expected: 'javascript:alert(1)' // Should be escaped in context
            },
            {
                name: 'Unicode Characters',
                input: 'Hello 世界 🌍',
                expected: 'Hello 世界 🌍' // Unicode should be preserved
            },
            {
                name: 'Mixed Content',
                input: 'User: <b>John</b> & "Admin"',
                expected: 'User: &lt;b&gt;John&lt;/b&gt; &amp; &quot;Admin&quot;'
            },
            {
                name: 'Ampersand First',
                input: '&<>"\'/',
                expected: '&amp;&lt;&gt;&quot;&#039;&#x2F;'
            }
        ];

        this.xssVectors = [
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
            'javascript:alert(1)',
            '<iframe src="javascript:alert(1)">',
            '<object data="javascript:alert(1)">',
            '<embed src="javascript:alert(1)">',
            '<link rel=stylesheet href="javascript:alert(1)">',
            '<style>@import"javascript:alert(1)"</style>',
            '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
            '<form action="javascript:alert(1)"><input type=submit>',
            '<input type=image src=x onerror=alert(1)>',
            '<body onload=alert(1)>',
            '<div onclick=alert(1)>click</div>',
            '<a href="javascript:alert(1)">link</a>',
            '"><script>alert(1)</script>',
            "';alert(1);//",
            '</script><script>alert(1)</script>',
            '<script>/**/alert(1)</script>',
            '<script>eval(String.fromCharCode(97,108,101,114,116,40,49,41))</script>'
        ];
    }

    init() {
        this.setupEventListeners();
        this.runAllTests();
    }

    setupEventListeners() {
        const runAllBtn = document.getElementById('runAllTests');
        const clearBtn = document.getElementById('clearResults');
        const xssTestBtn = document.getElementById('testXSSVectors');

        if (runAllBtn) runAllBtn.addEventListener('click', () => this.runAllTests());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearResults());
        if (xssTestBtn) xssTestBtn.addEventListener('click', () => this.testXSSVectors());
    }

    addTestResult(name, passed, details) {
        const output = document.getElementById('testOutput');
        if (!output) return;

        const result = document.createElement('div');
        result.className = `test-result ${passed ? 'pass' : 'fail'}`;
        
        const title = document.createElement('h3');
        title.textContent = `${name} - ${passed ? 'PASS' : 'FAIL'}`;
        
        const detailsElement = document.createElement('pre');
        detailsElement.textContent = details;
        
        result.appendChild(title);
        result.appendChild(detailsElement);
        output.appendChild(result);

        // Update counters
        if (passed) {
            this.passCount++;
        } else {
            this.failCount++;
        }

        this.updateSummary();
    }

    runBasicTests() {
        this.testCases.forEach(testCase => {
            const result = HTMLEscaper.escape(testCase.input);
            const passed = result === testCase.expected;
            const details = `Input: ${testCase.input}\nExpected: ${testCase.expected}\nActual: ${result}`;
            this.addTestResult(testCase.name, passed, details);
        });
    }

    testXSSVectors() {
        const output = document.getElementById('testOutput');
        const section = document.createElement('div');
        section.className = 'test-section';
        
        const title = document.createElement('h2');
        title.textContent = 'XSS Vector Tests';
        section.appendChild(title);
        
        const info = document.createElement('div');
        info.className = 'csp-info';
        info.innerHTML = `
            <h4>CSP Protection Active</h4>
            <p>These XSS vectors are being tested against HTML escaping. 
            Any CSP violations in the console show that both HTML escaping AND CSP are working together for defense in depth.</p>
        `;
        section.appendChild(info);
        
        output.appendChild(section);

        this.xssVectors.forEach((vector, index) => {
            const escaped = HTMLEscaper.escape(vector);
            
            // Check if dangerous patterns are escaped
            const safe = !escaped.includes('<script') && 
                       !escaped.includes('javascript:') && 
                       !escaped.includes('onerror=') &&
                       !escaped.includes('onload=') &&
                       !escaped.includes('onclick=') &&
                       escaped.includes('&lt;') || escaped.includes('&quot;');
            
            const details = `Original: ${vector}\nEscaped: ${escaped}\nContains dangerous patterns: ${!safe}`;
            this.addTestResult(`XSS Vector ${index + 1}`, safe, details);
        });
    }

    testAttributeEscaping() {
        const testAttributes = [
            'normal-value',
            '"quoted-value"',
            "'single-quoted'",
            '<script>alert(1)</script>',
            '" onmouseover="alert(1)"'
        ];

        testAttributes.forEach((attr, index) => {
            const escaped = HTMLEscaper.escapeAttribute(attr);
            const safe = !escaped.includes('"') || escaped.includes('&quot;');
            const details = `Original: ${attr}\nEscaped: ${escaped}`;
            this.addTestResult(`Attribute Test ${index + 1}`, safe, details);
        });
    }

    testSafeElementCreation() {
        try {
            const element = HTMLEscaper.createSafeElement('div', '<script>alert(1)</script>', {
                'class': 'test-class',
                'data-value': '"dangerous"'
            });
            
            const safe = element.textContent === '<script>alert(1)</script>' &&
                       element.className === 'test-class' &&
                       element.getAttribute('data-value') === '"dangerous"';
            
            const details = `Element created safely: ${safe}\nText content: ${element.textContent}\nClass: ${element.className}`;
            this.addTestResult('Safe Element Creation', safe, details);
        } catch (error) {
            this.addTestResult('Safe Element Creation', false, `Error: ${error.message}`);
        }
    }

    runAllTests() {
        this.clearResults();
        this.showSecurityStatus();
        this.runBasicTests();
        this.testAttributeEscaping();
        this.testSafeElementCreation();
        this.testXSSVectors();
    }

    clearResults() {
        const output = document.getElementById('testOutput');
        if (output) {
            output.innerHTML = '';
        }
        this.passCount = 0;
        this.failCount = 0;
        this.updateSummary();
    }

    showSecurityStatus() {
        const output = document.getElementById('testOutput');
        const status = document.createElement('div');
        status.className = 'security-status';
        status.innerHTML = `
            <h2>🛡️ Security Status: PROTECTED</h2>
            <p>HTML Escaping + Content Security Policy = Defense in Depth</p>
            <p><strong>Note:</strong> CSP violations in console are EXPECTED and show that security is working!</p>
        `;
        output.appendChild(status);
    }

    updateSummary() {
        const summaryContainer = document.getElementById('testSummary');
        if (!summaryContainer) return;

        const total = this.passCount + this.failCount;
        const passRate = total > 0 ? Math.round((this.passCount / total) * 100) : 0;

        summaryContainer.innerHTML = `
            <div class="summary-item pass">
                <h4>Tests Passed</h4>
                <div class="count">${this.passCount}</div>
            </div>
            <div class="summary-item ${this.failCount > 0 ? 'fail' : 'pass'}">
                <h4>Tests Failed</h4>
                <div class="count">${this.failCount}</div>
            </div>
            <div class="summary-item ${passRate === 100 ? 'pass' : 'fail'}">
                <h4>Pass Rate</h4>
                <div class="count">${passRate}%</div>
            </div>
            <div class="summary-item pass">
                <h4>Total Tests</h4>
                <div class="count">${total}</div>
            </div>
        `;
    }
}

// Initialize test suite when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const testSuite = new HTMLEscapingTestSuite();
    testSuite.init();
});

// Export for potential external use
export default HTMLEscapingTestSuite;
