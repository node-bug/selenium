import { LocatorStrategy } from '../../../app/elements/locator-strategy.js';
import { ElementTypes } from '../../../app/elements/element-types.js';

describe('ElementTypes', () => {
  let elementTypes;

  beforeEach(() => {
    elementTypes = new ElementTypes();
  });

  test('should create a new ElementTypes instance', () => {
    expect(elementTypes).toBeInstanceOf(ElementTypes);
  });

  test('should have getSelectors method', () => {
    expect(typeof elementTypes.getSelectors).toBe('function');
  });

  test('should have getSelector method', () => {
    expect(typeof elementTypes.getSelector).toBe('function');
  });

  test('should have addQualifiers method', () => {
    expect(typeof elementTypes.addQualifiers).toBe('function');
  });

  test('should have getAttribute method', () => {
    expect(typeof elementTypes.getAttribute).toBe('function');
  });
});

describe('LocatorStrategy', () => {
  let locatorStrategy;

  beforeEach(() => {
    locatorStrategy = new LocatorStrategy();
  });

  test('should create a new LocatorStrategy instance', () => {
    expect(locatorStrategy).toBeInstanceOf(LocatorStrategy);
  });

  test('should have driver setter and getter', () => {
    expect(typeof locatorStrategy.driver).toBe('function');
    expect(typeof locatorStrategy.driver).toBe('function');
  });

  test('should have findChildElements method', () => {
    expect(typeof locatorStrategy.findChildElements).toBe('function');
  });

  test('should have relativeSearch method', () => {
    expect(typeof locatorStrategy.relativeSearch).toBe('function');
  });

  test('should have spatialSearch method', () => {
    expect(typeof locatorStrategy.spatialSearch).toBe('function');
  });

  test('should have find method', () => {
    expect(typeof locatorStrategy.find).toBe('function');
  });

  test('should have findElement method', () => {
    expect(typeof locatorStrategy.findElement).toBe('function');
  });

  test('should have findElements method', () => {
    expect(typeof locatorStrategy.findElements).toBe('function');
  });
});
