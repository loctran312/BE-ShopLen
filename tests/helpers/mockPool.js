// Centralized mock for pg Pool so unit tests don't need a real database.
// Each test file calls mockPool.setup() in beforeEach and mockPool.teardown() in afterEach.

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();

// A fake transaction client matching the interface used by repositories
const mockClient = {
  query: jest.fn(),
  release: mockRelease,
};

// Default: client.query behaves like pool.query unless a test overrides it
mockConnect.mockResolvedValue(mockClient);

function setup(overrides = {}) {
  jest.resetModules();

  // Apply per-test overrides to client.query
  if (overrides.clientQuery) {
    mockClient.query.mockImplementation(overrides.clientQuery);
  } else {
    mockClient.query.mockResolvedValue({ rows: [] });
  }

  if (overrides.connect) {
    mockConnect.mockImplementation(overrides.connect);
  } else {
    mockConnect.mockResolvedValue(mockClient);
  }

  mockQuery.mockImplementation(overrides.query || (() => Promise.resolve({ rows: [] })));
  mockRelease.mockReset();
  mockRelease.mockImplementation(() => {});

  jest.doMock('pg', () => {
    class Pool {
      constructor() {
        this.query = mockQuery;
        this.connect = mockConnect;
        this.on = jest.fn();
      }
    }
    return { Pool };
  });

  return { mockQuery, mockConnect, mockClient, mockRelease };
}

function teardown() {
  jest.dontMock('pg');
  jest.resetModules();
  mockQuery.mockReset();
  mockClient.query.mockReset();
  mockConnect.mockReset();
  mockRelease.mockReset();
}

module.exports = {
  setup,
  teardown,
  mockQuery,
  mockConnect,
  mockClient,
  mockRelease,
};
