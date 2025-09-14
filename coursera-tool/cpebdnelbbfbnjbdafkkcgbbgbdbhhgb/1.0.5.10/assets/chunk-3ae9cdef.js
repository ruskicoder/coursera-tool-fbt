// Clean helper utilities (deobfuscated)

// c: Global object resolver
const globalObject = typeof globalThis !== 'undefined'
  ? globalThis
  : (typeof window !== 'undefined'
      ? window
      : (typeof global !== 'undefined'
          ? global
          : (typeof self !== 'undefined' ? self : {})));

// g: Get default export when available; otherwise return the module itself
function getDefaultExport(moduleLike) {
  if (moduleLike && moduleLike.__esModule && Object.prototype.hasOwnProperty.call(moduleLike, 'default')) {
    return moduleLike.default;
  }
  return moduleLike;
}

// a: Convert a CommonJS-like object to an ESM-like namespace with getters
function toModule(mod) {
  if (mod && mod.__esModule) return mod;
  const namespace = {};
  if (mod != null) {
    const descriptors = Object.getOwnPropertyDescriptors(mod);
    for (const key of Object.keys(descriptors)) {
      const desc = descriptors[key];
      if (desc.get || desc.set) {
        Object.defineProperty(namespace, key, desc);
      } else {
        Object.defineProperty(namespace, key, { enumerable: true, get: () => mod[key] });
      }
    }
  }
  Object.defineProperty(namespace, 'default', { enumerable: true, value: mod });
  Object.defineProperty(namespace, '__esModule', { value: true });
  return namespace;
}

export { toModule as a, globalObject as c, getDefaultExport as g };
