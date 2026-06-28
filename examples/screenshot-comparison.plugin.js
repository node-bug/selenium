/**
 * Example External Plugin: Screenshot Comparison
 * This demonstrates how an external npm package would extend WebBrowser
 * 
 * Usage in external package:
 * npm install pixelmatch pngjs
 * 
 * Then in tests:
 * import WebBrowser from '@nodebug/selenium';
 * import screenshotComparison from 'webbrowser-screenshot-comparison';
 * 
 * const browser = new WebBrowser();
 * browser.use(screenshotComparison, { threshold: 0.01 });
 */

// This is how an external npm package would be structured
export default function screenshotComparisonPlugin(browser, options = {}) {
  const { threshold = 0.1, updateBaselines = false } = options;

  // Lazy-load optional dependencies
  let pixelmatch = null;
  let PNG = null;

  async function loadDependencies() {
    if (!pixelmatch) {
      try {
        pixelmatch = (await import('pixelmatch')).default;
        PNG = (await import('pngjs')).PNG;
      } catch (err) {
        throw new Error('pixelmatch and pngjs are required. Install them with: npm install pixelmatch pngjs', { cause: err });
      }
    }
  }

  return {
    name: 'screenshot-comparison',
    wrap: 'screenshot',  // Auto-wrap the screenshot method

    hooks: {
      afterScreenshot: async ({ dataUrl, width, height, options }) => {
        if (!options.baseline) return { dataUrl, width, height };

        await loadDependencies();

        // Read baseline image
        const fs = await import('fs');
        const path = await import('path');
        
        const baselineBuffer = await fs.promises.readFile(options.baseline);
        const actualBuffer = Buffer.from(dataUrl, 'base64');

        const img1 = PNG.sync.read(baselineBuffer);
        const img2 = PNG.sync.read(actualBuffer);

        // Check dimensions
        if (img1.width !== img2.width || img1.height !== img2.height) {
          return {
            dataUrl,
            width,
            height,
            comparison: {
              match: false,
              reason: 'dimensions-mismatch',
              baseline: { width: img1.width, height: img1.height },
              actual: { width: img2.width, height: img2.height }
            }
          };
        }

        // Compare pixels
        const diff = new PNG({ width: img1.width, height: img1.height });
        const mismatches = pixelmatch(
          img1.data, img2.data, diff.data,
          img1.width, img1.height,
          { threshold: threshold / 255 }
        );

        const result = {
          dataUrl,
          width,
          height,
          comparison: {
            match: mismatches === 0,
            mismatchedPixels: mismatches,
            threshold: mismatches / (img1.width * img1.height)
          }
        };

        // Save diff image if requested
        if (!result.comparison.match && options.saveDiff) {
          const diffPath = options.diffPath || path.join(process.cwd(), 'screenshot-diff.png');
          await fs.promises.writeFile(diffPath, PNG.sync.write(diff));
          result.comparison.diffPath = diffPath;
        }

        // Update baseline if requested
        if (updateBaselines && !result.comparison.match) {
          await fs.promises.writeFile(options.baseline, actualBuffer);
          result.comparison.baselineUpdated = true;
        }

        return result;
      }
    },

    extend: () => ({
      /**
       * Assert screenshot matches baseline
       * @param {string} baselinePath - Path to baseline image
       * @param {Object} options - Comparison options
       */
      assertVisual: async (baselinePath, options = {}) => {
        const { dataUrl } = await browser.get.screenshot();
        const result = await browser.visual.compare(dataUrl, {
          ...options,
          baseline: baselinePath
        });

        if (!result.match) {
          throw new Error(
            `Visual assertion failed: ${result.mismatchedPixels} pixels differ`
          );
        }

        return result;
      },

      /**
       * Create visual baseline
       * @param {string} baselinePath - Path to save baseline
       */
      createBaseline: async (baselinePath) => {
        const { dataUrl } = await browser.get.screenshot();
        const fs = await import('fs');
        const path = await import('path');
        
        const dir = path.dirname(baselinePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        await fs.promises.writeFile(baselinePath, Buffer.from(dataUrl, 'base64'));
        return baselinePath;
      }
    })
  };
}