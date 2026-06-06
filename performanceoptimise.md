Based on my analysis of the codebase, here are the primary opportunities to improve performance and reduce execution time.

### 1. Reduce Driver Context Switching (The "Context Bottleneck")

The most significant performance bottleneck is the frequent use of `driver.switchTo().defaultContent()` and `driver.switchTo().frame(index)`.

In `LocatorStrategy._withContext`, every single element search that involves a frame (including `findChildElements`) performs:

1. Switch to default content.
2. Switch to target frame.
3. Execute search.
4. Switch back to default content.

**Optimization Opportunity:**

- **Context Tracking:** Implement a "current context" cache in `LocatorStrategy`. If the driver is already in the required frame, skip the switches.
- **Batching:** If multiple operations are performed in the same frame, avoid switching back to default content until the entire sequence is complete.

### 2. Minimize `executeScript` Overhead

The code relies heavily on `driver.executeScript` to bridge the gap between Selenium and the `ElementFinder` library. Each call to `executeScript` involves a network round-trip between the test runner and the browser driver.

**Optimization Opportunity:**

- **Bulk Data Retrieval:** Instead of calling `executeScript` multiple times to verify injection or retrieve individual properties, combine these into a single script execution that returns a structured object.
- **Client-Side Caching:** For static elements or repeated lookups, cache the element references (WebElements) on the client side if the page hasn't mutated.

### 3. Optimize Shadow DOM Traversal

The integration tests show that Shadow DOM searches are particularly slow (some taking over 6 seconds). This is often due to the recursive nature of traversing nested shadow roots.

**Optimization Opportunity:**

- **Flattened Search:** Instead of recursive calls from the Node.js side, move the entire traversal logic into a single `executeScript` call. This allows the browser's native JS engine to traverse the DOM at full speed without the overhead of multiple Selenium API calls.
- **Parallelized Scanning:** If searching across multiple shadow hosts, these can potentially be queried in a single script execution rather than sequentially.

### 4. Refine Element Finding Logic

The `LocatorStrategy` often performs "qualified" searches where it finds elements and then filters them (e.g., filtering out zero-dimension elements).

**Optimization Opportunity:**

- **Push Filters to Browser:** Move visibility and dimension filters directly into the `ElementFinder` logic inside the browser. This reduces the amount of data transferred over the wire (sending only the final matches instead of all candidates).

### Summary of Proposed Changes

| Area           | Current Approach                   | Optimized Approach                                | Expected Impact                  |
| :------------- | :--------------------------------- | :------------------------------------------------ | :------------------------------- |
| **Context**    | Switch $\to$ Frame $\to$ Default   | Cache current frame $\to$ Skip redundant switches | High $\downarrow$ Latency        |
| **Execution**  | Multiple `executeScript` calls     | Single "Mega-Script" for complex lookups          | Medium $\downarrow$ Latency      |
| **Shadow DOM** | Recursive Node $\to$ Browser calls | Single Browser-side traversal                     | High $\downarrow$ Execution Time |
| **Filtering**  | Browser $\to$ Node $\to$ Filter    | Browser-side filtering                            | Low $\downarrow$ Data Transfer   |
