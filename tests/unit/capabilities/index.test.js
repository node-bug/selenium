import capabilities from '../../../app/capabilities/index.js'

describe('capabilities factory', () => {
  test('should export a function', () => {
    expect(typeof capabilities).toBe('function')
  })

  test('should return a value when called', () => {
    const result = capabilities()
    expect(result).toBeDefined()
  })

  test('should handle the basic functionality without crashing', () => {
    // This test ensures the function doesn't throw an error when called
    expect(() => {
      capabilities()
    }).not.toThrow()
  })
})