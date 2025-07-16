// Sistema centralizado de logging y manejo de errores
class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = this.getLogLevel();
        this.enableConsole = this.getConsoleEnabled();
    }

    // Configuración desde localStorage
    getLogLevel() {
        const stored = localStorage.getItem('webliqui_log_level');
        return stored || 'INFO'; // DEBUG, INFO, WARN, ERROR
    }

    getConsoleEnabled() {
        const stored = localStorage.getItem('webliqui_console_enabled');
        return stored === 'true' || stored === null; // Default true
    }

    setLogLevel(level) {
        localStorage.setItem('webliqui_log_level', level);
        this.logLevel = level;
    }

    setConsoleEnabled(enabled) {
        localStorage.setItem('webliqui_console_enabled', enabled.toString());
        this.enableConsole = enabled;
    }

    // Niveles de logging
    debug(message, data = null) {
        this.log('DEBUG', message, data);
    }

    info(message, data = null) {
        this.log('INFO', message, data);
    }

    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    error(message, error = null, data = null) {
        this.log('ERROR', message, { error: error?.toString(), stack: error?.stack, ...data });
    }

    // Método principal de logging
    log(level, message, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            page: window.location.pathname,
            userAgent: navigator.userAgent.split(' ')[0] // Simplificado
        };

        // Agregar a array interno
        this.logs.push(logEntry);

        // Mantener límite de logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Log a consola si está habilitado y el nivel es apropiado
        if (this.enableConsole && this.shouldLog(level)) {
            this.logToConsole(logEntry);
        }

        // Enviar a sistema externo si es ERROR crítico
        if (level === 'ERROR') {
            this.reportError(logEntry);
        }
    }

    shouldLog(level) {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }

    logToConsole(logEntry) {
        const { level, message, data } = logEntry;
        const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

        switch (level) {
            case 'DEBUG':
                console.debug(`[${timestamp}] 🐛 ${message}`, data);
                break;
            case 'INFO':
                console.info(`[${timestamp}] ℹ️ ${message}`, data);
                break;
            case 'WARN':
                console.warn(`[${timestamp}] ⚠️ ${message}`, data);
                break;
            case 'ERROR':
                console.error(`[${timestamp}] ❌ ${message}`, data);
                break;
        }
    }

    reportError(logEntry) {
        // Almacenar errores críticos en localStorage para análisis
        try {
            const criticalErrors = JSON.parse(localStorage.getItem('webliqui_critical_errors') || '[]');
            criticalErrors.push(logEntry);

            // Mantener solo los últimos 50 errores críticos
            if (criticalErrors.length > 50) {
                criticalErrors.shift();
            }

            localStorage.setItem('webliqui_critical_errors', JSON.stringify(criticalErrors));
        } catch (e) {
            // Si localStorage falla, al menos mantenemos en memoria
            console.error('Failed to store critical error:', e);
        }
    }

    // Obtener logs para debugging
    getLogs(level = null) {
        if (level) {
            return this.logs.filter((log) => log.level === level);
        }
        return [...this.logs];
    }

    // Limpiar logs
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('webliqui_critical_errors');
    }

    // Exportar logs para análisis
    exportLogs() {
        const data = {
            logs: this.logs,
            criticalErrors: JSON.parse(localStorage.getItem('webliqui_critical_errors') || '[]'),
            exportDate: new Date().toISOString(),
            page: window.location.href
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `webliqui-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Clase para manejo de errores específicos
class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        // Capturar errores JavaScript no manejados
        window.addEventListener('error', (event) => {
            this.logger.error('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                message: event.message
            });
        });

        // Capturar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.logger.error('Unhandled Promise Rejection', event.reason, {
                promise: event.promise
            });
        });
    }

    // Wrapper para funciones async con manejo de errores
    async safeAsync(asyncFunction, context = 'Unknown') {
        try {
            this.logger.debug(`Executing async operation: ${context}`);
            const result = await asyncFunction();
            this.logger.debug(`Completed async operation: ${context}`);
            return result;
        } catch (error) {
            this.logger.error(`Error in async operation: ${context}`, error);
            throw error; // Re-throw para que el caller pueda manejar
        }
    }

    // Wrapper para operaciones síncronas
    safe(syncFunction, context = 'Unknown', defaultReturn = null) {
        try {
            this.logger.debug(`Executing sync operation: ${context}`);
            const result = syncFunction();
            this.logger.debug(`Completed sync operation: ${context}`);
            return result;
        } catch (error) {
            this.logger.error(`Error in sync operation: ${context}`, error);
            return defaultReturn;
        }
    }

    // Manejo específico de errores de red
    handleNetworkError(error, url, method = 'GET') {
        this.logger.error('Network Error', error, {
            url,
            method,
            status: error.status,
            statusText: error.statusText
        });

        // Retornar error estructurado
        return {
            success: false,
            error: 'NETWORK_ERROR',
            message: 'Error de conexión. Por favor, intenta nuevamente.',
            details: error.message
        };
    }

    // Manejo de errores de datos
    handleDataError(error, operation, data = null) {
        this.logger.error('Data Processing Error', error, {
            operation,
            data: data ? Object.keys(data) : null
        });

        return {
            success: false,
            error: 'DATA_ERROR',
            message: 'Error procesando los datos. Verifica el formato.',
            details: error.message
        };
    }

    // Manejo de errores de UI
    handleUIError(error, component, action = 'Unknown') {
        this.logger.error('UI Error', error, {
            component,
            action
        });

        return {
            success: false,
            error: 'UI_ERROR',
            message: 'Error en la interfaz. La página se recargará automáticamente.',
            details: error.message
        };
    }
}

// Instancias globales
const logger = new Logger();
const errorHandler = new ErrorHandler(logger);

// Utilidades de performance
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.measurements = new Map();
    }

    start(name) {
        this.measurements.set(name, {
            startTime: performance.now(),
            startMemory: this.getMemoryUsage()
        });
        this.logger.debug(`Performance measurement started: ${name}`);
    }

    end(name) {
        const measurement = this.measurements.get(name);
        if (!measurement) {
            this.logger.warn(`Performance measurement not found: ${name}`);
            return null;
        }

        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();

        const result = {
            name,
            duration: endTime - measurement.startTime,
            memoryStart: measurement.startMemory,
            memoryEnd: endMemory,
            memoryDiff: endMemory - measurement.startMemory
        };

        this.logger.info(`Performance measurement completed: ${name}`, result);
        this.measurements.delete(name);

        return result;
    }

    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    measure(name, fn) {
        this.start(name);
        try {
            const result = fn();
            return result;
        } finally {
            this.end(name);
        }
    }

    async measureAsync(name, asyncFn) {
        this.start(name);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            this.end(name);
        }
    }
}

const performanceMonitor = new PerformanceMonitor(logger);

// Debug panel para desarrollo
class DebugPanel {
    constructor(logger, errorHandler, performanceMonitor) {
        this.logger = logger;
        this.errorHandler = errorHandler;
        this.performanceMonitor = performanceMonitor;
        this.visible = false;
        this.panel = null;
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (this.panel) {
            this.panel.style.display = 'block';
            this.visible = true;
            return;
        }

        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: white;
            border: 2px solid #007acc;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            overflow: hidden;
        `;

        this.updatePanel();
        document.body.appendChild(this.panel);
        this.visible = true;

        // Auto-refresh cada 2 segundos
        this.refreshInterval = setInterval(() => this.updatePanel(), 2000);
    }

    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
            this.visible = false;
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
        }
    }

    updatePanel() {
        if (!this.panel) return;

        const logs = this.logger.getLogs().slice(-10); // Últimos 10 logs
        const errors = this.logger.getLogs('ERROR').length;
        const warnings = this.logger.getLogs('WARN').length;

        this.panel.innerHTML = `
            <div style="background: #007acc; color: white; padding: 10px; font-weight: bold;">
                🐛 Debug Panel
                <button onclick="debugPanel.hide()" style="float: right; background: none; border: none; color: white; cursor: pointer;">✖</button>
            </div>
            <div style="padding: 10px; max-height: 500px; overflow-y: auto;">
                <div style="margin-bottom: 10px;">
                    <strong>Stats:</strong> ${logs.length} logs | ${errors} errors | ${warnings} warnings
                </div>
                <div style="margin-bottom: 10px;">
                    <button onclick="logger.clearLogs()">Clear Logs</button>
                    <button onclick="logger.exportLogs()">Export Logs</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Log Level:</label>
                    <select onchange="logger.setLogLevel(this.value)" value="${this.logger.logLevel}">
                        <option value="DEBUG" ${this.logger.logLevel === 'DEBUG' ? 'selected' : ''}>Debug</option>
                        <option value="INFO" ${this.logger.logLevel === 'INFO' ? 'selected' : ''}>Info</option>
                        <option value="WARN" ${this.logger.logLevel === 'WARN' ? 'selected' : ''}>Warn</option>
                        <option value="ERROR" ${this.logger.logLevel === 'ERROR' ? 'selected' : ''}>Error</option>
                    </select>
                </div>
                <div><strong>Recent Logs:</strong></div>
                ${logs
                    .map(
                        (log) => `
                    <div style="margin: 2px 0; padding: 2px; background: ${this.getLogColor(
                        log.level
                    )}; border-radius: 2px;">
                        <strong>${log.level}</strong> ${new Date(log.timestamp).toLocaleTimeString()} - ${log.message}
                    </div>
                `
                    )
                    .join('')}
            </div>
        `;
    }

    getLogColor(level) {
        switch (level) {
            case 'ERROR':
                return '#ffe6e6';
            case 'WARN':
                return '#fff3cd';
            case 'INFO':
                return '#e6f3ff';
            case 'DEBUG':
                return '#f0f0f0';
            default:
                return 'white';
        }
    }
}

const debugPanel = new DebugPanel(logger, errorHandler, performanceMonitor);

// Hacer disponibles globalmente
window.logger = logger;
window.errorHandler = errorHandler;
window.performanceMonitor = performanceMonitor;
window.debugPanel = debugPanel;

// Shortcut para toggle debug panel (Ctrl+Shift+D)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        debugPanel.toggle();
    }
});

// Log inicial
logger.info('Logging system initialized', {
    level: logger.logLevel,
    consoleEnabled: logger.enableConsole
});

export { logger, errorHandler, performanceMonitor, debugPanel };
