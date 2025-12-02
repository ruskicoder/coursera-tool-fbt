// ==========================================
// Chunk 3ae9cdef - Bundle Helpers
// ==========================================

/**
 * CommonJS Global Helper
 * Polyfill for the global object in different environments (Node, Browser, Worker).
 * Exports as 'c' in the original bundle.
 */
var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : 
                     typeof window !== 'undefined' ? window : 
                     typeof global !== 'undefined' ? global : 
                     typeof self !== 'undefined' ? self : {};

/**
 * Get Default Export Helper
 * Checks if a module is an ES module with a default export and returns it,
 * otherwise returns the module itself.
 * Exports as 'g' in the original bundle.
 */
function getDefaultExportFromCjs(module) {
    return module && module.__esModule && Object.prototype.hasOwnProperty.call(module, 'default') 
        ? module['default'] 
        : module;
}

/**
 * Get Augmented Namespace Helper
 * Creates a namespace object for a CommonJS module.
 * If the module's default export is a function, the namespace acts as a wrapper 
 * around that function (forwarding calls and constructions). 
 * It also copies all named exports from the original module to this new namespace.
 * Exports as 'a' in the original bundle.
 */
function getAugmentedNamespace(n) {
    // 1. If it's already an ES module, return as is.
    if (n.__esModule) return n;

    // 2. Get the default export
    var f = n.default;

    // 3. If default export is a function, create a wrapper that behaves like it
    if (typeof f === "function") {
        var a = function e() {
            // Handle usage as constructor vs function call
            if (this instanceof e) {
                return Reflect.construct(f, arguments, this.constructor);
            }
            return f.apply(this, arguments);
        };
        a.prototype = f.prototype;
    } else {
        // Otherwise start with an empty object
        var a = {};
    }

    // 4. Copy all properties from the original module to the new namespace
    Object.keys(n).forEach(function (k) {
        var d = Object.getOwnPropertyDescriptor(n, k);
        Object.defineProperty(a, k, d.get ? d : {
            enumerable: true,
            get: function () {
                return n[k];
            }
        });
    });

    // 5. Flag as ES Module
    Object.defineProperty(a, '__esModule', {
        value: true
    });

    return a;
}

export {
    getAugmentedNamespace as a,
    commonjsGlobal as c,
    getDefaultExportFromCjs as g
};