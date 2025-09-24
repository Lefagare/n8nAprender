// Application state
// === NUEVO: Estado con persistencia ===
const STORAGE_KEYS = {
    progress: 'automation_app_progress_v1',
    bootcamp: 'automation_bootcamp_state_v1'
};

const AppState = {
    currentSection: 'intro',
    completedSections: new Set(),
    totalSections: 7, // se mantiene, pero actualizaremos al montar si detecta nuevas secciones

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.progress);
            if (raw) {
                const data = JSON.parse(raw);
                this.currentSection = data.currentSection || 'intro';
                this.completedSections = new Set(data.completedSections || []);
                if (typeof data.totalSections === 'number') this.totalSections = data.totalSections;
            }
        } catch { }
    },
    save() {
        try {
            localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({
                currentSection: this.currentSection,
                completedSections: Array.from(this.completedSections),
                totalSections: this.totalSections
            }));
        } catch { }
    },

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill && progressText) {
            const percentage = (this.completedSections.size / this.totalSections) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${this.completedSections.size}/${this.totalSections} secciones`;
        }
        this.save();
    },

    markSectionComplete(sectionId) {
        this.completedSections.add(sectionId);
        this.updateProgress();
    },

    setTotalFromDOM() {
        const sections = document.querySelectorAll('main .section');
        this.totalSections = sections.length - 1; // excluye intro
    }
};
AppState.load();


// Navigation functionality
class Navigation {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.section');
        this.introCards = document.querySelectorAll('.intro-card');

        this.init();
    }

    init() {
        // Add event listeners to navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.navigateToSection(sectionId);
            });
        });

        // Add event listeners to intro cards
        this.introCards.forEach(card => {
            card.addEventListener('click', () => {
                const sectionId = card.getAttribute('data-navigate');
                if (sectionId) {
                    this.navigateToSection(sectionId);
                }
            });

            // Make cards keyboard accessible
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const sectionId = card.getAttribute('data-navigate');
                    if (sectionId) {
                        this.navigateToSection(sectionId);
                    }
                }
            });
        });
    }

    navigateToSection(sectionId) {
        // Hide all sections
        this.sections.forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        const targetNavLink = document.querySelector(`[data-section="${sectionId}"]`);

        if (targetSection && targetNavLink) {
            targetSection.classList.add('active');
            targetNavLink.classList.add('active');

            AppState.currentSection = sectionId;
            if (sectionId !== 'intro') AppState.markSectionComplete(sectionId);
            AppState.save();

            {
                AppState.markSectionComplete(sectionId);
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// Tab functionality
class TabManager {
    constructor() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        this.init();
    }

    init() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId, button);
            });
        });
    }

    switchTab(tabId, activeButton) {
        const container = activeButton.closest('.content-tabs');
        if (!container) return;

        // Remove active class from all tabs in this container
        const containerTabButtons = container.querySelectorAll('.tab-btn');
        const containerTabContents = container.querySelectorAll('.tab-content');

        containerTabButtons.forEach(btn => btn.classList.remove('active'));
        containerTabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        activeButton.classList.add('active');
        const targetContent = container.querySelector(`#${tabId}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }
}

// Enhanced Webhook Simulator - FIXED VERSION
class WebhookSimulator {
    constructor() {
        this.generateButton = document.getElementById('generatePayload');
        this.copyButton = document.getElementById('copyPayload');
        this.urlInput = document.getElementById('webhookUrl');
        this.payloadTypeSelect = document.getElementById('payloadType');
        this.payloadOutput = document.getElementById('simulatorPayload');
        this.validationStatus = document.getElementById('validationStatus');
        this.webhookSignature = document.getElementById('webhookSignature');

        this.payloadTemplates = {
            'order.created': {
                event: 'order.created',
                timestamp: '',
                data: {
                    orderId: '',
                    customerId: '',
                    customerEmail: 'cliente@ejemplo.com',
                    totalAmount: 299.99,
                    currency: 'USD',
                    status: 'created',
                    items: [
                        {
                            productId: 'PROD-001',
                            name: 'Producto Ejemplo',
                            quantity: 2,
                            unitPrice: 149.99,
                            totalPrice: 299.98
                        }
                    ],
                    shippingAddress: {
                        street: 'Calle Principal 123',
                        city: 'Bogotá',
                        state: 'Cundinamarca',
                        country: 'Colombia',
                        zipCode: '110111'
                    }
                }
            },
            'user.registered': {
                event: 'user.registered',
                timestamp: '',
                data: {
                    userId: '',
                    email: 'nuevo.usuario@ejemplo.com',
                    name: 'Juan Pérez García',
                    registrationSource: 'web',
                    preferences: {
                        newsletter: true,
                        notifications: true,
                        theme: 'light',
                        language: 'es'
                    },
                    profile: {
                        firstName: 'Juan',
                        lastName: 'Pérez García',
                        dateOfBirth: '1990-05-15',
                        phone: '+57 300 123 4567'
                    }
                }
            },
            'payment.completed': {
                event: 'payment.completed',
                timestamp: '',
                data: {
                    paymentId: '',
                    orderId: '',
                    customerId: '',
                    amount: 299.99,
                    currency: 'USD',
                    paymentMethod: 'credit_card',
                    cardLast4: '4242',
                    status: 'completed',
                    transactionId: '',
                    fees: {
                        processing: 8.99,
                        platform: 2.50
                    },
                    metadata: {
                        gateway: 'stripe',
                        merchantId: 'MERCH_123456'
                    }
                }
            }
        };

        this.init();
    }

    init() {
        if (this.generateButton) {
            this.generateButton.addEventListener('click', () => {
                this.generateWebhookPayload();
            });
        }

        if (this.copyButton) {
            this.copyButton.addEventListener('click', () => {
                this.copyPayloadToClipboard();
            });
        }

        // Generate initial payload
        setTimeout(() => {
            this.generateWebhookPayload();
        }, 500);
    }

    generateWebhookPayload() {
        try {
            const payloadType = this.payloadTypeSelect?.value || 'order.created';
            const template = JSON.parse(JSON.stringify(this.payloadTemplates[payloadType]));

            // Set current timestamp
            template.timestamp = new Date().toISOString();

            // Generate unique IDs based on payload type
            if (payloadType === 'order.created') {
                template.data.orderId = 'ORD-' + this.generateRandomId(8);
                template.data.customerId = 'CUST-' + this.generateRandomId(6);
            } else if (payloadType === 'user.registered') {
                template.data.userId = 'USER-' + this.generateRandomId(8);
            } else if (payloadType === 'payment.completed') {
                template.data.paymentId = 'PAY-' + this.generateRandomId(10);
                template.data.orderId = 'ORD-' + this.generateRandomId(8);
                template.data.customerId = 'CUST-' + this.generateRandomId(6);
                template.data.transactionId = 'TXN-' + this.generateRandomId(12);
            }

            // Format JSON with proper indentation
            const formattedJson = JSON.stringify(template, null, 2);

            // Update the display
            if (this.payloadOutput) {
                this.payloadOutput.textContent = formattedJson;

                // Trigger syntax highlighting if Prism is available
                if (window.Prism) {
                    window.Prism.highlightElement(this.payloadOutput);
                }
            }

            // Update validation status
            this.updateValidationStatus(true);

            // Generate and display webhook signature
            this.updateWebhookSignature(formattedJson);

            console.log('✅ Webhook payload generado correctamente');

        } catch (error) {
            console.error('❌ Error generando payload:', error);
            this.updateValidationStatus(false, error.message);
        }
    }

    generateRandomId(length) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    updateValidationStatus(isValid, errorMessage = '') {
        if (!this.validationStatus) return;

        const indicator = this.validationStatus.querySelector('.status-indicator');
        if (!indicator) return;

        if (isValid) {
            indicator.className = 'status-indicator status-success';
            indicator.innerHTML = '<span class="status-dot status-success"></span><span class="status-text">JSON Válido</span>';
        } else {
            indicator.className = 'status-indicator status-error';
            indicator.innerHTML = '<span class="status-dot status-error"></span><span class="status-text">Error: ' + errorMessage + '</span>';
        }
    }

    updateWebhookSignature(payload) {
        if (!this.webhookSignature) return;

        // Simulate HMAC signature generation
        const mockSignature = 'sha256=' + this.generateRandomId(64).toLowerCase();
        this.webhookSignature.textContent = mockSignature;
    }

    async copyPayloadToClipboard() {
        if (!this.payloadOutput) return;

        try {
            const payloadText = this.payloadOutput.textContent;
            await navigator.clipboard.writeText(payloadText);

            // Show success feedback
            const originalText = this.copyButton.innerHTML;
            this.copyButton.innerHTML = '<span class="btn-icon">✅</span> ¡Copiado!';
            this.copyButton.classList.add('copied');

            setTimeout(() => {
                this.copyButton.innerHTML = originalText;
                this.copyButton.classList.remove('copied');
            }, 2000);

            console.log('✅ Payload copiado al portapapeles');

        } catch (error) {
            console.error('❌ Error copiando al portapapeles:', error);

            // Fallback: select text
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(this.payloadOutput);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
}

// FIXED JSON Validator - Completely Rewritten for Robust Validation
class JSONValidator {
    constructor() {
        this.jsonTextarea = document.getElementById('jsonData');
        this.validationResult = document.getElementById('validationResult');
        this.validationDetails = document.getElementById('validationDetails');
        this.validationIndicator = document.getElementById('validationIndicator');
        this.loadValidButton = document.getElementById('loadValidExample');
        this.loadInvalidButton = document.getElementById('loadInvalidExample');
        this.formatButton = document.getElementById('formatJson');
        this.lineNumbers = document.getElementById('lineNumbers');

        // Enhanced user schema for validation
        this.userSchema = {
            type: 'object',
            properties: {
                id: {
                    type: 'integer',
                    minimum: 1,
                    description: 'ID único del usuario (entero positivo)'
                },
                name: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 100,
                    description: 'Nombre completo del usuario'
                },
                email: {
                    type: 'string',
                    pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
                    description: 'Email válido del usuario'
                },
                age: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 150,
                    description: 'Edad del usuario (0-150)'
                },
                preferences: {
                    type: 'object',
                    properties: {
                        theme: {
                            type: 'string',
                            enum: ['light', 'dark', 'auto'],
                            description: 'Tema de la interfaz'
                        },
                        notifications: {
                            type: 'boolean',
                            description: 'Activar notificaciones'
                        }
                    },
                    additionalProperties: false
                }
            },
            required: ['id', 'name', 'email'],
            additionalProperties: false
        };

        this.validExample = {
            id: 123,
            name: "Juan Pérez",
            email: "juan@ejemplo.com",
            age: 30,
            preferences: {
                theme: "light",
                notifications: true
            }
        };

        this.invalidExample = {
            name: "",
            email: "email-invalido",
            age: -5,
            preferences: {
                theme: "invalid-theme",
                notifications: "not-boolean",
                extraField: "should not be here"
            }
        };

        this.isValidating = false;
        this.init();
    }

    init() {
        if (this.jsonTextarea) {
            // Real-time validation with proper debouncing
            this.jsonTextarea.addEventListener('input', this.debounce(() => {
                this.validateJSON();
                this.updateLineNumbers();
            }, 300));

            this.jsonTextarea.addEventListener('scroll', () => {
                if (this.lineNumbers) {
                    this.lineNumbers.scrollTop = this.jsonTextarea.scrollTop;
                }
            });
        }

        if (this.loadValidButton) {
            this.loadValidButton.addEventListener('click', () => {
                this.loadExample('valid');
            });
        }

        if (this.loadInvalidButton) {
            this.loadInvalidButton.addEventListener('click', () => {
                this.loadExample('invalid');
            });
        }

        if (this.formatButton) {
            this.formatButton.addEventListener('click', () => {
                this.formatJSON();
            });
        }

        // Load initial example
        this.loadExample('valid');
    }

    loadExample(type) {
        if (!this.jsonTextarea) return;

        const example = type === 'valid' ? this.validExample : this.invalidExample;
        this.jsonTextarea.value = JSON.stringify(example, null, 2);

        // Force immediate validation
        setTimeout(() => {
            this.validateJSON();
            this.updateLineNumbers();
        }, 100);
    }

    formatJSON() {
        if (!this.jsonTextarea) return;

        const jsonText = this.jsonTextarea.value.trim();
        if (!jsonText) return;

        try {
            const parsed = JSON.parse(jsonText);
            const formatted = JSON.stringify(parsed, null, 2);
            this.jsonTextarea.value = formatted;
            this.validateJSON();
            this.updateLineNumbers();
        } catch (error) {
            console.log('Cannot format invalid JSON:', error.message);
        }
    }

    validateJSON() {
        if (this.isValidating) return;
        this.isValidating = true;

        try {
            if (!this.jsonTextarea || !this.validationResult) return;

            const jsonText = this.jsonTextarea.value.trim();

            if (!jsonText) {
                this.showValidationResult('Ingresa JSON para validar', 'pending');
                this.showValidationDetails([]);
                return;
            }

            // First: Check JSON syntax
            let jsonData;
            try {
                jsonData = JSON.parse(jsonText);
                console.log('✅ JSON parsing successful');
            } catch (syntaxError) {
                console.log('❌ JSON syntax error detected:', syntaxError.message);
                this.showValidationResult('❌ Error de sintaxis JSON', 'error');
                this.showValidationDetails([
                    `Error de sintaxis: ${syntaxError.message}`,
                    'Revisa: comas faltantes, llaves no cerradas, comillas incorrectas'
                ]);
                return;
            }

            // Second: Validate against schema
            const validation = this.validateAgainstSchema(jsonData, this.userSchema);

            if (validation.valid) {
                console.log('✅ Schema validation successful');
                this.showValidationResult('✅ JSON válido! Cumple con el schema de usuario.', 'success');
                this.showValidationDetails([]);
            } else {
                console.log('❌ Schema validation failed:', validation.errors);
                this.showValidationResult('❌ JSON inválido - No cumple schema', 'error');
                this.showValidationDetails(validation.errors);
            }
        } catch (error) {
            console.error('❌ Validation error:', error);
            this.showValidationResult('❌ Error en validación', 'error');
            this.showValidationDetails(['Error interno en el validador']);
        } finally {
            this.isValidating = false;
        }
    }

    validateAgainstSchema(data, schema) {
        const errors = [];

        try {
            // Check type
            if (schema.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
                errors.push('El JSON debe ser un objeto válido');
                return { valid: false, errors };
            }

            // Check required fields
            if (schema.required && Array.isArray(schema.required)) {
                for (const field of schema.required) {
                    if (!(field in data)) {
                        errors.push(`Campo requerido '${field}' faltante`);
                    }
                }
            }

            // Check properties
            if (schema.properties) {
                for (const [key, value] of Object.entries(data)) {
                    const fieldSchema = schema.properties[key];
                    if (fieldSchema) {
                        const fieldErrors = this.validateField(value, fieldSchema, key);
                        errors.push(...fieldErrors);
                    } else if (schema.additionalProperties === false) {
                        errors.push(`Propiedad '${key}' no permitida en el schema`);
                    }
                }
            }

            return {
                valid: errors.length === 0,
                errors: errors
            };
        } catch (error) {
            console.error('Schema validation error:', error);
            return {
                valid: false,
                errors: ['Error en validación de schema']
            };
        }
    }

    validateField(value, schema, fieldName) {
        const errors = [];

        try {
            // Type validation
            if (schema.type) {
                const actualType = typeof value;
                const expectedType = schema.type;

                if (expectedType === 'integer') {
                    if (actualType !== 'number' || !Number.isInteger(value) || isNaN(value)) {
                        errors.push(`'${fieldName}' debe ser un número entero válido`);
                    }
                } else if (expectedType === 'number') {
                    if (actualType !== 'number' || isNaN(value)) {
                        errors.push(`'${fieldName}' debe ser un número válido`);
                    }
                } else if (expectedType === 'string') {
                    if (actualType !== 'string') {
                        errors.push(`'${fieldName}' debe ser una cadena de texto`);
                    }
                } else if (expectedType === 'boolean') {
                    if (actualType !== 'boolean') {
                        errors.push(`'${fieldName}' debe ser booleano (true o false)`);
                    }
                } else if (expectedType === 'object') {
                    if (actualType !== 'object' || value === null || Array.isArray(value)) {
                        errors.push(`'${fieldName}' debe ser un objeto válido`);
                    }
                }
            }

            // String validations
            if (typeof value === 'string') {
                if (schema.minLength !== undefined && value.length < schema.minLength) {
                    errors.push(`'${fieldName}' debe tener al menos ${schema.minLength} caracteres`);
                }
                if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                    errors.push(`'${fieldName}' debe tener máximo ${schema.maxLength} caracteres`);
                }
                if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                    if (fieldName === 'email') {
                        errors.push(`'${fieldName}' debe ser un email válido (ejemplo: usuario@dominio.com)`);
                    } else {
                        errors.push(`'${fieldName}' no tiene el formato correcto`);
                    }
                }
            }

            // Number validations
            if (typeof value === 'number' && !isNaN(value)) {
                if (schema.minimum !== undefined && value < schema.minimum) {
                    errors.push(`'${fieldName}' debe ser mayor o igual a ${schema.minimum}`);
                }
                if (schema.maximum !== undefined && value > schema.maximum) {
                    errors.push(`'${fieldName}' debe ser menor o igual a ${schema.maximum}`);
                }
            }

            // Enum validation
            if (schema.enum && Array.isArray(schema.enum) && !schema.enum.includes(value)) {
                errors.push(`'${fieldName}' debe ser uno de: ${schema.enum.join(', ')}`);
            }

            // Nested object validation
            if (schema.type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const nestedValidation = this.validateAgainstSchema(value, schema);
                const prefixedErrors = nestedValidation.errors.map(err =>
                    err.startsWith(fieldName) ? err : `${fieldName}.${err}`
                );
                errors.push(...prefixedErrors);
            }
        } catch (error) {
            console.error(`Error validating field ${fieldName}:`, error);
            errors.push(`Error validando campo '${fieldName}'`);
        }

        return errors;
    }

    showValidationResult(message, status) {
        if (this.validationResult) {
            this.validationResult.textContent = message;
            this.validationResult.className = `validation-result ${status}`;
        }

        if (this.validationIndicator) {
            const statusDot = this.validationIndicator.querySelector('.status-dot');
            const statusText = this.validationIndicator.querySelector('.status-text');

            if (statusDot) {
                statusDot.className = `status-dot status-${status}`;
            }

            if (statusText) {
                const statusMessages = {
                    success: 'JSON Válido',
                    error: 'JSON Inválido',
                    pending: 'Esperando validación'
                };
                statusText.textContent = statusMessages[status] || statusMessages.pending;
            }
        }
    }

    showValidationDetails(errors) {
        if (!this.validationDetails) return;

        if (errors.length === 0) {
            this.validationDetails.innerHTML = `
                <div style="color: var(--color-success); text-align: center; padding: var(--space-16);">
                    <h5 style="margin-bottom: var(--space-8);">🎉 ¡Perfecto!</h5>
                    <p style="margin: 0;">Tu JSON cumple completamente con el schema de usuario.</p>
                </div>
            `;
        } else {
            const errorList = errors.map(error => `<li>${error}</li>`).join('');
            this.validationDetails.innerHTML = `
                <div style="color: var(--color-error);">
                    <h5 style="margin-bottom: var(--space-12);">❌ Errores encontrados (${errors.length}):</h5>
                    <ul class="error-list">${errorList}</ul>
                    <div style="margin-top: var(--space-16); padding: var(--space-12); background: var(--color-bg-2); border-radius: var(--radius-base);">
                        <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: 0;">
                            💡 <strong>Tip:</strong> Corrige estos errores para que tu JSON cumpla con el schema de usuario.
                        </p>
                    </div>
                </div>
            `;
        }
    }

    updateLineNumbers() {
        if (!this.lineNumbers || !this.jsonTextarea) return;

        const lines = this.jsonTextarea.value.split('\n');
        const lineNumbersText = lines.map((_, index) => index + 1).join('\n');
        this.lineNumbers.textContent = lineNumbersText;
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Enhanced Copy Functionality
class CopyManager {
    constructor() {
        this.init();
    }

    init() {
        // Add copy buttons to all code examples
        setTimeout(() => {
            this.addCopyButtons();
        }, 1000);
    }

    addCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-btn');

        copyButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const codeId = button.getAttribute('data-copy');
                const codeElement = document.getElementById(codeId);

                if (codeElement) {
                    try {
                        const code = codeElement.textContent;
                        await navigator.clipboard.writeText(code);
                        this.showCopySuccess(button);
                    } catch (error) {
                        console.error('Error copying code:', error);
                        this.fallbackCopy(codeElement);
                    }
                }
            });
        });
    }

    showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = '✅ Copiado';
        button.classList.add('copied');

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }

    fallbackCopy(element) {
        // Fallback selection method
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// Quiz Manager
class QuizManager {
    constructor() {
        this.quizButtons = document.querySelectorAll('.quiz-check');
        this.init();
    }

    init() {
        this.quizButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.checkAnswer(button);
            });
        });
    }

    checkAnswer(button) {
        const correctAnswer = button.getAttribute('data-answer');
        const questionContainer = button.closest('.quiz-question');
        const selectedOption = questionContainer.querySelector('input[type="radio"]:checked');
        const resultContainer = questionContainer.querySelector('.quiz-result');

        if (!selectedOption) {
            resultContainer.className = 'quiz-result incorrect';
            resultContainer.textContent = '⚠️ Por favor selecciona una respuesta.';
            return;
        }

        const selectedValue = selectedOption.value;
        const isCorrect = selectedValue === correctAnswer;

        if (isCorrect) {
            resultContainer.className = 'quiz-result correct';
            resultContainer.textContent = '🎉 ¡Correcto! Los webhooks permiten comunicación en tiempo real, eliminando la necesidad de polling constante.';
        } else {
            resultContainer.className = 'quiz-result incorrect';
            resultContainer.textContent = '❌ Incorrecto. La principal ventaja de los webhooks es la comunicación en tiempo real, no el polling que consume más recursos.';
        }

        // Mark question as completed
        button.disabled = true;
        button.textContent = 'Respondido';
        button.classList.add('btn--disabled');
    }
}

// Mobile menu toggle
class MobileMenu {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.createToggleButton();
    }

    createToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-menu-toggle btn btn--primary';
        toggleButton.innerHTML = '☰ Menú';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            display: none;
        `;

        document.body.appendChild(toggleButton);

        toggleButton.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });

        // Show/hide based on screen size
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                toggleButton.style.display = 'block';
            } else {
                toggleButton.style.display = 'none';
                this.sidebar.classList.remove('open');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
    }
}

// Enhanced syntax highlighting for code blocks
class SyntaxHighlighter {
    constructor() {
        this.highlightAll();
    }

    highlightAll() {
        // Wait for Prism to load
        if (window.Prism) {
            window.Prism.highlightAll();
        } else {
            // Fallback basic highlighting
            setTimeout(() => {
                this.basicHighlighting();
            }, 1000);
        }
    }

    basicHighlighting() {
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            let html = block.innerHTML;

            // Basic JSON highlighting
            html = html.replace(/"([^"]+)":/g, '<span style="color: #e6db74;">"$1":</span>');
            html = html.replace(/: "([^"]+)"/g, ': <span style="color: #a6e22e;">"$1"</span>');
            html = html.replace(/: (\d+)/g, ': <span style="color: #ae81ff;">$1</span>');
            html = html.replace(/: (true|false|null)/g, ': <span style="color: #fd971f;">$1</span>');

            block.innerHTML = html;
        });
    }
}

// Keyboard navigation
class KeyboardNavigation {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            // Alt + number keys for quick section navigation
            if (e.altKey && e.key >= '1' && e.key <= '7') {
                e.preventDefault();
                const sections = ['intro', 'webhooks', 'json', 'agents', 'triggers', 'patterns', 'implementation'];
                const index = parseInt(e.key) - 1;
                if (sections[index] && window.navigation) {
                    window.navigation.navigateToSection(sections[index]);
                }
            }

            // Escape key to close mobile menu
            if (e.key === 'Escape') {
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
}

// Progress tracking
class ProgressTracker {
    constructor() {
        this.startTime = Date.now();
        this.sectionTimes = {};
        this.currentSectionStart = Date.now();
    }

    trackSectionVisit(sectionId) {
        const now = Date.now();

        // Track time spent on previous section
        if (AppState.currentSection && AppState.currentSection !== sectionId) {
            const timeSpent = now - this.currentSectionStart;
            this.sectionTimes[AppState.currentSection] = timeSpent;
        }

        this.currentSectionStart = now;

        // Log progress
        console.log(`📍 Sección visitada: ${sectionId}`, {
            timestamp: new Date().toISOString(),
            timeSpent: this.sectionTimes,
            totalTime: now - this.startTime
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando aplicación de automatización...');

    // Initialize core components
    window.navigation = new Navigation();
    window.tabManager = new TabManager();
    window.webhookSimulator = new WebhookSimulator();
    window.jsonValidator = new JSONValidator();
    window.copyManager = new CopyManager();
    window.quizManager = new QuizManager();
    window.mobileMenu = new MobileMenu();
    window.syntaxHighlighter = new SyntaxHighlighter();
    window.keyboardNav = new KeyboardNavigation();
    window.progressTracker = new ProgressTracker();

    // Update progress on navigation
    const originalNavigate = window.navigation.navigateToSection;
    window.navigation.navigateToSection = function (sectionId) {
        window.progressTracker.trackSectionVisit(sectionId);
        return originalNavigate.call(this, sectionId);
    };

    // Initialize progress
    AppState.updateProgress();

    console.log('✅ Aplicación de Automatización iniciada correctamente');
    console.log('💡 Usa Alt + 1-7 para navegación rápida entre secciones');
    console.log('🔧 Simulador de webhooks y validador JSON corregidos y funcionales');
});

// Performance monitoring
const PerformanceMonitor = {
    logPageLoad() {
        window.addEventListener('load', () => {
            if ('performance' in window) {
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                console.log(`⚡ Página cargada en ${loadTime}ms`);
            }
        });
    }
};

// Initialize performance monitoring
PerformanceMonitor.logPageLoad();

// === NUEVO: Estado Bootcamp ===
const BootcampState = {
  challenges: { // ejemplo de estructura, extensible
    dedupeEmails: { done: false, notes: "" }
  },
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.bootcamp);
      if (raw) Object.assign(this, JSON.parse(raw));
    } catch {}
  },
  save() {
    try {
      localStorage.setItem(STORAGE_KEYS.bootcamp, JSON.stringify(this));
    } catch {}
  }
};
BootcampState.load();

function renderBootcampProgress() {
  const el = document.getElementById('bootcampProgressView');
  if (!el) return;
  const percent = Math.round((AppState.completedSections.size / AppState.totalSections) * 100);
  el.innerHTML = `
    <div class="card"><div class="card__body">
      <p><strong>Secciones completadas:</strong> ${AppState.completedSections.size}/${AppState.totalSections} (${percent}%)</p>
      <p><strong>Reto emails deduplicados:</strong> ${BootcampState.challenges.dedupeEmails.done ? '✅ Completado' : '⏳ Pendiente'}</p>
    </div></div>
  `;
}

document.addEventListener('click', (e) => {
  const id = e.target?.id;
  if (id === 'exportProgress') {
    const blob = new Blob([JSON.stringify({
      app: {
        currentSection: AppState.currentSection,
        completedSections: Array.from(AppState.completedSections),
        totalSections: AppState.totalSections
      },
      bootcamp: BootcampState
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'progreso_automatizacion.json';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }
  if (id === 'saveChallengeState') {
    BootcampState.challenges.dedupeEmails.done = true;
    BootcampState.save();
    renderBootcampProgress();
  }
  if (id === 'cronPreview') previewCron();
  if (id === 'retrySim') simulateRetry();
  if (id === 'rlSim') simulateRateLimit();
  if (id === 'exprRun') runExpression();
  if (id === 'simulateFlow') simulateComposer();
  if (id === 'clearFlow') {
    const out = document.getElementById('composerOutput');
    if (out) out.textContent = '{}';
  }
});

// Importar progreso
const importInput = document.getElementById('importProgress');
if (importInput) {
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.app) {
      AppState.currentSection = data.app.currentSection || 'intro';
      AppState.completedSections = new Set(data.app.completedSections || []);
      AppState.totalSections = data.app.totalSections || AppState.totalSections;
      AppState.save();
      AppState.updateProgress();
    }
    if (data.bootcamp) {
      Object.assign(BootcampState, data.bootcamp);
      BootcampState.save();
    }
    renderBootcampProgress();
    alert('¡Progreso importado!');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  AppState.setTotalFromDOM();
  AppState.updateProgress();
  renderBootcampProgress();
});

// === NUEVO: Cron preview (simple, no TZ) ===
function cronMatches(expr, date) {
  // expr tipo "*/5 * * * *"
  const [min, hour, dom, mon, dow] = expr.trim().split(' ');
  const checks = [
    matchField(min, date.getMinutes()),
    matchField(hour, date.getHours()),
    matchField(dom, date.getDate()),
    matchField(mon, date.getMonth() + 1),
    matchField(dow, date.getDay())
  ];
  return checks.every(Boolean);

  function matchField(field, value) {
    if (field === '*') return true;
    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const baseOk = base === '*' ? true : listMatch(base, value);
      return baseOk && (value % parseInt(step, 10) === 0);
    }
    return listMatch(field, value);
  }
  function listMatch(field, value) {
    return field.split(',').some(part => {
      if (part.includes('-')) {
        const [a,b] = part.split('-').map(Number);
        return value >= a && value <= b;
      }
      return Number(part) === value;
    });
  }
}

function previewCron() {
  const expr = document.getElementById('cronExpr')?.value || '* * * * *';
  const out = document.getElementById('cronOutput');
  if (!out) return;
  const now = new Date();
  const results = [];
  let d = new Date(now);
  let count = 0;
  while (results.length < 10 && count < 10000) {
    d = new Date(d.getTime() + 60 * 1000); // avanza minuto
    if (cronMatches(expr, d)) results.push(d.toISOString());
    count++;
  }
  out.textContent = JSON.stringify(results, null, 2);
  if (window.Prism) Prism.highlightElement(out);
}

// === NUEVO: Retry/Backoff ===
function simulateRetry() {
  const max = parseInt(document.getElementById('retryMax').value || '5', 10);
  const base = parseInt(document.getElementById('retryBase').value || '500', 10);
  const jitter = document.getElementById('retryJitter').value;
  const out = document.getElementById('retryOutput');
  const delays = [];
  for (let i = 0; i < max; i++) {
    let delay = base * Math.pow(2, i); // exponencial
    if (jitter === 'full') delay = Math.floor(Math.random() * delay);
    delays.push({ attempt: i + 1, delay_ms: delay });
  }
  out.textContent = JSON.stringify(delays, null, 2);
  if (window.Prism) Prism.highlightElement(out);
}

// === NUEVO: Rate Limiter (ventana fija por minuto) ===
function simulateRateLimit() {
  const limit = parseInt(document.getElementById('rlLimit').value || '60', 10);
  const requests = parseInt(document.getElementById('rlRequests').value || '120', 10);
  const out = document.getElementById('rlOutput');
  const windowMs = 60 * 1000;
  let windowStart = 0;
  let count = 0;
  const result = [];
  for (let i = 0; i < requests; i++) {
    const t = i * 500; // cada 500ms
    if (t - windowStart >= windowMs) {
      windowStart = t;
      count = 0;
    }
    if (count < limit) {
      count++;
      result.push({ i, t_ms: t, status: 'allowed' });
    } else {
      result.push({ i, t_ms: t, status: 'throttled' });
    }
  }
  out.textContent = JSON.stringify(result.slice(0, 50), null, 2); // muestra primeros 50
  if (window.Prism) Prism.highlightElement(out);
}

// === NUEVO: Expression Tester (estilo n8n) ===
function runExpression() {
  const ctxText = document.getElementById('exprCtx').value || '{}';
  const expr = document.getElementById('exprInput').value || '';
  const out = document.getElementById('exprOutput');
  try {
    const ctx = JSON.parse(ctxText);
    const value = expr.replace(/\{\{\s*\$json([^}]*)\}\}/g, (_, path) => {
      const p = path.trim().replace(/^\./,'').split('.').filter(Boolean);
      let cur = ctx;
      for (const key of p) {
        if (cur && typeof cur === 'object' && key in cur) cur = cur[key];
        else return '';
      }
      return String(cur);
    });
    out.textContent = JSON.stringify(value);
  } catch (e) {
    out.textContent = JSON.stringify({ error: e.message });
  }
  if (window.Prism) Prism.highlightElement(out);
}

// === NUEVO: Workflow Composer (orden de ejecución) ===
function simulateComposer() {
  const nodesText = document.getElementById('composerNodes').value || '[]';
  const edgesText = document.getElementById('composerEdges').value || '[]';
  const inputText = document.getElementById('composerInput').value || '{}';
  const out = document.getElementById('composerOutput');
  try {
    const nodes = JSON.parse(nodesText);
    const edges = JSON.parse(edgesText);
    const input = JSON.parse(inputText);

    // topological sort
    const graph = new Map(nodes.map(n => [n.id, []]));
    const indeg = new Map(nodes.map(n => [n.id, 0]));
    for (const [a,b] of edges) {
      graph.get(a)?.push(b);
      indeg.set(b, (indeg.get(b) || 0) + 1);
    }
    const q = [];
    indeg.forEach((deg, id) => { if (deg === 0) q.push(id); });

    const order = [];
    while (q.length) {
      const id = q.shift();
      order.push(id);
      for (const v of graph.get(id) || []) {
        indeg.set(v, indeg.get(v) - 1);
        if (indeg.get(v) === 0) q.push(v);
      }
    }
    const disconnected = nodes.filter(n => !order.includes(n.id)).map(n => n.id);

    out.textContent = JSON.stringify({
      execution_order: order,
      disconnected_nodes: disconnected,
      preview_context: input
    }, null, 2);
    if (window.Prism) Prism.highlightElement(out);
  } catch (e) {
    out.textContent = JSON.stringify({ error: e.message }, null, 2);
  }
}


