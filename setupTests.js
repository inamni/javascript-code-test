import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { server } from "./src/mocks/server";

window.alert = vi.fn(); // Mock alert function

// Start the server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that are declared as a part of our tests
// (i.e. for testing one-time error scenarios)
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());
