import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { BaseDelegate } from './base-delegate.js';

/**
 * Drag and Drop delegate for handling HTML5 drag-and-drop operations
 *
 * This class encapsulates drag-and-drop functionality including:
 * - HTML5 drag event simulation (dragstart, dragover, drop, dragend)
 * - Detection of HTML5 drag compatibility
 * - Fallback to Selenium native dragAndDrop for simple cases
 *
 * @class DragDropDelegate
 */
export class DragDropDelegate extends BaseDelegate {
    constructor(browser) {
        super(browser);
    }

    /**
     * Checks if an element has HTML5 drag-and-drop support.
     *
     * @param {WebElement} element - The element to check
     * @returns {Promise<boolean>} True if the element supports HTML5 drag
     */
    async #hasHtml5DragSupport(element) {
        const browser = this.browser;
        return await browser.driver.executeScript(`
            const el = arguments[0];
            // Check for draggable attribute
            if (el.hasAttribute('draggable') && el.getAttribute('draggable') !== 'false') {
                return true;
            }
            // Check for inline event handlers
            if (el.getAttribute('ondragstart') || el.getAttribute('ondragover') || el.getAttribute('ondrop')) {
                return true;
            }
            // Check for common drag-related CSS classes
            const dragClasses = ['draggable', 'sortable-item', 'drag-handle'];
            for (const cls of dragClasses) {
                if (el.classList.contains(cls)) {
                    return true;
                }
            }
            return false;
        `, element);
    }

    /**
     * Performs HTML5 drag-and-drop simulation.
     *
     * Dispatches proper DragEvent objects to trigger JavaScript drag handlers.
     *
     * @param {WebElement} source - The source element to drag
     * @param {WebElement} target - The target element to drop on
     * @param {WebElement} [container] - Optional container element for event delegation
     * @returns {Promise<boolean>} True if successful
     */
    async #performHtml5Drag(source, target, container = null) {
        const browser = this.browser;
        const eventContainer = container || target;

        await browser.driver.executeScript(`
            const source = arguments[0];
            const target = arguments[1];
            const container = arguments[2];

            // Create a shared DataTransfer object
            const dataTransfer = new DataTransfer();

            // Try to get data-value or data-id from source for dataTransfer
            const value = source.dataset.value || source.dataset.id || source.textContent.trim();
            if (value) {
                dataTransfer.setData('text/plain', value);
            }

            // Get target's position for dragover event
            const rect = target.getBoundingClientRect();
            const clientY = rect.top + rect.height / 2;

            // Trigger dragstart on source
            const dragStartEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(dragStartEvent, 'dataTransfer', {
                value: dataTransfer,
                enumerable: true
            });
            source.dispatchEvent(dragStartEvent);

            // Trigger dragover on container with proper coordinates
            const dragOverEvent = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                clientY: clientY
            });
            Object.defineProperty(dragOverEvent, 'dataTransfer', {
                value: dataTransfer,
                enumerable: true
            });
            container.dispatchEvent(dragOverEvent);

            // Trigger drop on container
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: dataTransfer,
                enumerable: true
            });
            container.dispatchEvent(dropEvent);

            // Trigger dragend on source
            const dragEndEvent = new DragEvent('dragend', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(dragEndEvent, 'dataTransfer', {
                value: dataTransfer,
                enumerable: true
            });
            source.dispatchEvent(dragEndEvent);
        `, source, target, eventContainer);

        // Allow time for DOM updates
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }

    /**
     * Performs a drag-and-drop operation.
     *
     * Automatically detects HTML5 drag support and uses appropriate method.
     *
     * @param {WebElement} source - The source element to drag
     * @param {WebElement} target - The target element to drop on
     * @returns {Promise<boolean>} True if successful
     */
    async perform(source, target) {
        const browser = this.browser;
        browser.message = messenger({ stack: browser.stack, action: 'drag-and-drop' });

        try {
            // Check if source has HTML5 drag support
            const hasHtml5Drag = await this.#hasHtml5DragSupport(source);

            if (hasHtml5Drag) {
                // Try to find a parent container with dragover handlers
                const container = await browser.driver.executeScript(`
                    const el = arguments[0];
                    let parent = el.parentElement;
                    while (parent) {
                        // Check if parent has dragover handlers (common for sortable lists)
                        if (parent.id && (parent.id.includes('sortable') || parent.id.includes('drag'))) {
                            return parent;
                        }
                        parent = parent.parentElement;
                    }
                    return null;
                `, source);

                await this.#performHtml5Drag(source, target, container);
            } else {
                // Use Selenium's native dragAndDrop for simple cases
                const actions = browser.driver.actions({ async: true });
                await actions.dragAndDrop(source, target).perform();
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            log.info('Drag and drop completed successfully');
        } catch (err) {
            browser.handleError(err, 'performing drag and drop');
        } finally {
            browser.stack = [];
        }
        return true;
    }
}