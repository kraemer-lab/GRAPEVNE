// TextEncoder/TextDecoder (needed by @mui/x packages, among others)
import { TextEncoder, TextDecoder } from 'node:util';
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// Web Crypto (getRandomValues, subtle, etc.)
import { webcrypto } from 'node:crypto';
if (!global.crypto) global.crypto = webcrypto;

// ResizeObserver (some UI libs expect it in jsdom)
if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ---- Global builderAPI stub that always returns a safe shape ----
if (!global.builderAPI) {
  const SAFE_RESULT = {
    returncode: 0,
    stdout: '',
    stderr: '',
    data: null,
    result: null,
  };

  global.builderAPI = new Proxy(
    {},
    {
      get: (_target, prop) => {
        // If a method is awaited, resolve to a safe result.
        // If it's used sync, still give something harmless.
        const fn = async (..._args) => SAFE_RESULT;
        // expose toString for nicer logs if needed
        if (prop === 'toString') return () => '[builderAPI stub]';
        return fn;
      },
    }
  );
}
