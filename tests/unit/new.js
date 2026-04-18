import WebBrowser from '../../index.js';
import { log } from '@nodebug/logger';

// Mock the logger
jest.mock('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('WebBrowser start method tests', () => {
  let webBrowser;
  let mockDriver;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock driver
    mockDriver = {
      sessionId: 'test-session-123',
      deleteSession: jest.fn().mockResolvedValue(undefined),
    };
    
    // Create instance of WebBrowser
    webBrowser = new WebBrowser();
    webBrowser.driver = mockDriver;
    webBrowser.locatorStrategy = { driver: null };
    
    // Mock the super.new() method (assuming it exists from parent class)
    webBrowser.new = jest.fn().mockResolvedValue(undefined);
  });

  test('should start normally when no existing session exists', async () => {
    // Arrange
    webBrowser.driver = null;
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.driver?.deleteSession).not.toHaveBeenCalled();
    expect(webBrowser.new).toHaveBeenCalled();
    expect(webBrowser.locatorStrategy.driver).toBe(null);
    expect(log.info).not.toHaveBeenCalled();
  });

  test('should close existing session when sessionId exists', async () => {
    // Arrange
    webBrowser.close = jest.fn().mockResolvedValue(undefined);
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.close).toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith(`Deleted existing session: test-session-123`);
    expect(webBrowser.new).toHaveBeenCalled();
    expect(webBrowser.locatorStrategy.driver).toBe(mockDriver);
  });

  test('should handle case when driver exists but sessionId is undefined', async () => {
    // Arrange
    webBrowser.driver = { sessionId: null };
    webBrowser.close = jest.fn().mockResolvedValue(undefined);
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.close).not.toHaveBeenCalled();
    expect(log.info).not.toHaveBeenCalled();
    expect(webBrowser.new).toHaveBeenCalled();
  });

  test('should handle case when driver exists but sessionId is falsy', async () => {
    // Arrange
    const testCases = [null, undefined, '', 0, false];
    
    for (const sessionId of testCases) {
      jest.clearAllMocks();
      webBrowser.driver = { sessionId };
      webBrowser.close = jest.fn().mockResolvedValue(undefined);
      webBrowser.new = jest.fn().mockResolvedValue(undefined);
      
      // Act
      await webBrowser.start();
      
      // Assert
      expect(webBrowser.close).not.toHaveBeenCalled();
      expect(log.info).not.toHaveBeenCalled();
      expect(webBrowser.new).toHaveBeenCalled();
    }
  });

  test('should ignore ignorable errors during session cleanup', async () => {
    const ignorableErrors = [
      new Error("Cannot read property 'getSession' of undefined"),
      new Error("Cannot read property 'sessionId' of undefined"),
      new Error("Cannot read property 'as it is undefined"),
      new Error("reading 'getSession'"),
      new Error("reading 'sessionId'"),
    ];
    
    for (const error of ignorableErrors) {
      jest.clearAllMocks();
      webBrowser.driver = { sessionId: 'test-session' };
      webBrowser.close = jest.fn().mockRejectedValue(error);
      webBrowser.new = jest.fn().mockResolvedValue(undefined);
      
      // Act
      await webBrowser.start();
      
      // Assert
      expect(log.error).not.toHaveBeenCalled();
      expect(webBrowser.new).toHaveBeenCalled();
    }
  });

  test('should log error for non-ignorable errors during cleanup', async () => {
    // Arrange
    const nonIgnorableError = new Error('Connection timeout');
    webBrowser.driver = { sessionId: 'test-session' };
    webBrowser.close = jest.fn().mockRejectedValue(nonIgnorableError);
    webBrowser.new = jest.fn().mockResolvedValue(undefined);
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(log.error).toHaveBeenCalledWith(
      'Unrecognized error during session deletion: Connection timeout'
    );
    expect(webBrowser.new).toHaveBeenCalled();
  });

  test('should handle multiple different non-ignorable errors', async () => {
    // Arrange
    const errors = [
      new Error('Network failure'),
      new Error('Authentication failed'),
      new Error('Timeout exceeded'),
    ];
    
    for (const error of errors) {
      jest.clearAllMocks();
      webBrowser.driver = { sessionId: 'test-session' };
      webBrowser.close = jest.fn().mockRejectedValue(error);
      webBrowser.new = jest.fn().mockResolvedValue(undefined);
      
      // Act
      await webBrowser.start();
      
      // Assert
      expect(log.error).toHaveBeenCalledWith(
        `Unrecognized error during session deletion: ${error.message}`
      );
      expect(webBrowser.new).toHaveBeenCalled();
    }
  });

  test('should handle case where driver is undefined', async () => {
    // Arrange
    webBrowser.driver = undefined;
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.driver?.sessionId).toBeUndefined();
    expect(webBrowser.new).toHaveBeenCalled();
    expect(webBrowser.locatorStrategy.driver).toBeUndefined();
  });

  test('should handle case where driver is null', async () => {
    // Arrange
    webBrowser.driver = null;
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.new).toHaveBeenCalled();
    expect(webBrowser.locatorStrategy.driver).toBe(null);
  });

  test('should set locatorStrategy.driver after super.new()', async () => {
    // Arrange
    const newMockDriver = { sessionId: 'new-session-456' };
    webBrowser.driver = null;
    webBrowser.new = jest.fn().mockImplementation(() => {
      webBrowser.driver = newMockDriver;
      return Promise.resolve();
    });
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.locatorStrategy.driver).toBe(newMockDriver);
  });

  test('should handle super.new() throwing an error', async () => {
    // Arrange
    const error = new Error('Failed to create session');
    webBrowser.driver = null;
    webBrowser.new = jest.fn().mockRejectedValue(error);
    
    // Act & Assert
    await expect(webBrowser.start()).rejects.toThrow('Failed to create session');
    expect(webBrowser.locatorStrategy.driver).toBe(null);
  });

  test('should preserve driver reference when close fails with ignorable error', async () => {
    // Arrange
    const originalDriver = mockDriver;
    webBrowser.driver = originalDriver;
    webBrowser.close = jest.fn().mockRejectedValue(new Error("reading 'getSession'"));
    webBrowser.new = jest.fn().mockImplementation(() => {
      webBrowser.driver = { ...mockDriver, sessionId: 'new-session' };
      return Promise.resolve();
    });
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.driver).not.toBe(originalDriver);
    expect(webBrowser.locatorStrategy.driver).toBe(webBrowser.driver);
  });

  test('should handle close method not being defined', async () => {
    // Arrange
    webBrowser.driver = { sessionId: 'test-session' };
    webBrowser.close = undefined;
    webBrowser.new = jest.fn().mockResolvedValue(undefined);
    
    // Act & Assert
    await expect(webBrowser.start()).rejects.toThrow();
  });

  test('should handle empty error message', async () => {
    // Arrange
    webBrowser.driver = { sessionId: 'test-session' };
    webBrowser.close = jest.fn().mockRejectedValue(new Error(''));
    webBrowser.new = jest.fn().mockResolvedValue(undefined);
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(log.error).not.toHaveBeenCalled();
    expect(webBrowser.new).toHaveBeenCalled();
  });

  test('should handle error with null message', async () => {
    // Arrange
    const error = new Error();
    error.message = null;
    webBrowser.driver = { sessionId: 'test-session' };
    webBrowser.close = jest.fn().mockRejectedValue(error);
    webBrowser.new = jest.fn().mockResolvedValue(undefined);
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(log.error).toHaveBeenCalledWith(
      'Unrecognized error during session deletion: null'
    );
  });

  test('should handle non-Error objects thrown', async () => {
    // Arrange
    webBrowser.driver = { sessionId: 'test-session' };
    webBrowser.close = jest.fn().mockRejectedValue('String error');
    webBrowser.new = jest.fn().mockResolvedValue(undefined);
    
    // Act
    await webBrowser.start();
    
    // Assert
    // This will likely throw since error.message is accessed
    await expect(webBrowser.start()).rejects.toBeDefined();
  });

  test('should call close exactly once when session exists', async () => {
    // Arrange
    webBrowser.close = jest.fn().mockResolvedValue(undefined);
    
    // Act
    await webBrowser.start();
    
    // Assert
    expect(webBrowser.close).toHaveBeenCalledTimes(1);
  });

  test('should call new exactly once in all scenarios', async () => {
    // Arrange
    const scenarios = [
      { driver: null, shouldClose: false },
      { driver: { sessionId: 'test' }, shouldClose: true },
      { driver: { sessionId: null }, shouldClose: false },
    ];
    
    for (const scenario of scenarios) {
      jest.clearAllMocks();
      webBrowser.driver = scenario.driver;
      webBrowser.close = jest.fn().mockResolvedValue(undefined);
      webBrowser.new = jest.fn().mockResolvedValue(undefined);
      
      // Act
      await webBrowser.start();
      
      // Assert
      expect(webBrowser.new).toHaveBeenCalledTimes(1);
    }
  });
});

describe('WebBrowser start method integration scenarios', () => {
  let webBrowser;

  beforeEach(() => {
    jest.clearAllMocks();
    webBrowser = new WebBrowser();
    webBrowser.locatorStrategy = { driver: null };
    webBrowser.new = jest.fn().mockResolvedValue(undefined);
  });

  test('should handle sequential start calls', async () => {
    // First start - no session
    webBrowser.driver = null;
    await webBrowser.start();
    expect(webBrowser.new).toHaveBeenCalledTimes(1);
    
    // Second start - with existing session
    webBrowser.driver = { sessionId: 'session-1' };
    webBrowser.close = jest.fn().mockResolvedValue(undefined);
    await webBrowser.start();
    expect(webBrowser.close).toHaveBeenCalledTimes(1);
    expect(webBrowser.new).toHaveBeenCalledTimes(2);
  });

  test('should maintain locatorStrategy reference after multiple starts', async () => {
    const mockDriver1 = { sessionId: 'session-1' };
    const mockDriver2 = { sessionId: 'session-2' };
    
    webBrowser.driver = null;
    webBrowser.new = jest.fn().mockImplementation(() => {
      webBrowser.driver = mockDriver1;
      return Promise.resolve();
    });
    
    await webBrowser.start();
    expect(webBrowser.locatorStrategy.driver).toBe(mockDriver1);
    
    webBrowser.close = jest.fn().mockResolvedValue(undefined);
    webBrowser.new = jest.fn().mockImplementation(() => {
      webBrowser.driver = mockDriver2;
      return Promise.resolve();
    });
    
    await webBrowser.start();
    expect(webBrowser.locatorStrategy.driver).toBe(mockDriver2);
  });
});