import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest isn't configured with `test.globals: true`, so React Testing
// Library's automatic per-test cleanup (which relies on detecting a global
// `afterEach`) needs to be wired up explicitly here.
afterEach(cleanup);

// jsdom doesn't implement IntersectionObserver — PageOutline's
// active-section highlighting needs a stub to render without throwing.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error -- test-environment stub, not a spec-accurate implementation
globalThis.IntersectionObserver = IntersectionObserverStub;
