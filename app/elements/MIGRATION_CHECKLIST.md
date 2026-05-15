# Elements Module Migration Checklist

## Pre-Migration Assessment

- [ ] Review current code for hard dependencies on monolithic approach
- [ ] Identify integration points with the rest of codebase
- [ ] Check for any monkey-patching or dynamic modifications to modules
- [ ] Document any custom extensions to existing modules
- [ ] Run full test suite to establish baseline

## Phase 1: Preparation (No Code Changes)

### Understanding

- [ ] Read REFACTORING_GUIDE.md
- [ ] Read QUICK_REFERENCE.md
- [ ] Understand module dependencies
- [ ] Review differences between old and new APIs

### Planning

- [ ] Identify which utilities will be reused
- [ ] Plan gradual migration path
- [ ] Create branch for refactoring work
- [ ] Document any custom element types or spatial relationships

### Testing

- [ ] Set up test suite for new modules
- [ ] Create test fixtures/mock data
- [ ] Establish performance baseline

## Phase 2: Parallel Implementation (Both Old & New)

### Step 1: Add Refactored Modules Alongside Original

- [ ] Copy new refactored files to elements folder:
  - [ ] xpath-builder.js
  - [ ] element-types-refactored.js
  - [ ] shadow-dom-scanner.js
  - [ ] element-qualifier.js
  - [ ] spatial-filters.js
  - [ ] frame-context.js
  - [ ] locator-strategy-refactored.js
  - [ ] selector-stack-builder-refactored.js
- [ ] Keep original files in place (no deletion)
- [ ] Update package.json dependencies if needed

### Step 2: Unit Test New Modules

- [ ] Test xpath-builder.js utilities
  - [ ] escapeXPathString() with various inputs
  - [ ] xpathConstraintToJS() conversions
  - [ ] splitOutsideBrackets() edge cases
- [ ] Test element-types-refactored.js
  - [ ] generateXPathSelectors() outputs
  - [ ] buildTextAttributeMatcher() patterns
  - [ ] Element type validation
- [ ] Test spatial-filters.js
  - [ ] createSpatialFilter() functions
  - [ ] calculateDistance() with penalties
  - [ ] sortByDistance() ordering
- [ ] Test element-qualifier.js
  - [ ] addBoundingBoxMetadata() results
  - [ ] filterByVisibility() filtering
  - [ ] requalifyElement() refresh

### Step 3: Integration Test

- [ ] Test LocatorStrategy with sample elements
- [ ] Test shadow DOM scanning
- [ ] Test frame context switching
- [ ] Test spatial filtering with real elements
- [ ] Test configuration options

## Phase 3: Migration (Selective Adoption)

### Step 1: Create Adapter Layer (Optional)

```javascript
// Option 1: Use adapter to expose old interface
export { LocatorStrategy as LocatorStrategyRefactored } from './locator-strategy-refactored.js'

// For gradual migration, create wrapper:
export class LocatorStrategy extends LocatorStrategyRefactored {
  // Backward compatibility layer
}
```

### Step 2: Migrate by Module

- [ ] **Module 1: Unit Tests for Utilities**
  - [ ] Replace internal utility usage with new modules
  - [ ] Update test imports
  - [ ] Verify tests pass
- [ ] **Module 2: Integration Points**
  - [ ] Find all usages of old modules
  - [ ] Create compatibility layer if needed
  - [ ] Update imports gradually
- [ ] **Module 3: Application Code**
  - [ ] Update element finding code
  - [ ] Update spatial filtering code
  - [ ] Update stack building code

### Step 3: Incremental Testing

- [ ] Run unit tests for migrated modules
- [ ] Run integration tests
- [ ] Run end-to-end tests
- [ ] Performance testing
- [ ] Visual regression testing

## Phase 4: Full Migration

### Step 1: Replace All Imports

- [ ] Find all imports of old modules
  ```bash
  grep -r "from.*element-types.js" src/
  grep -r "from.*locator-strategy.js" src/
  grep -r "from.*selector-stack-builder.js" src/
  grep -r "from.*spatial-selection.js" src/
  ```
- [ ] Update to use refactored versions (or keep as-is if still functional)
- [ ] Verify no broken imports

### Step 2: Update Configuration

- [ ] Review all LocatorStrategy instantiations
- [ ] Update configuration options
- [ ] Enable debug logging in test environments

### Step 3: Comprehensive Testing

- [ ] Full test suite execution
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] User acceptance testing

### Step 4: Documentation

- [ ] Update README files
- [ ] Update code comments
- [ ] Update integration guides
- [ ] Create migration guide for team
- [ ] Document any workarounds

## Phase 5: Cleanup & Optimization

### Step 1: Remove Old Modules (Optional)

- [ ] Verify no code still depends on old modules
- [ ] Archive old files for reference
- [ ] Remove old modules from version control
- [ ] Update .gitignore if needed

### Step 2: Performance Tuning

- [ ] Profile shadow DOM queries
- [ ] Optimize cache strategies
- [ ] Tune alignment buffer values
- [ ] Test with large DOM trees

### Step 3: Final Testing

- [ ] Full regression test suite
- [ ] Load testing
- [ ] Stress testing with large page sizes
- [ ] Cross-browser testing

## Rollback Plan

### If Issues Arise

- [ ] Keep original modules in version control
- [ ] Tag refactoring commit for easy rollback
- [ ] Create rollback branch
- [ ] Document issues encountered
- [ ] Fix issues in refactored code
- [ ] Re-test before proceeding

### Rollback Steps

```bash
# If needed, revert to original
git checkout <rollback-commit> -- app/elements/

# Or selectively:
git checkout original-branch -- app/elements/element-types.js
```

## Validation Checklist

### Code Quality

- [ ] All tests pass
- [ ] No console errors/warnings
- [ ] Code style consistent
- [ ] No duplicate code
- [ ] Comments are up-to-date

### Performance

- [ ] No performance regression
- [ ] Shadow DOM queries cached
- [ ] Batch queries working
- [ ] Frame switching optimized

### Functionality

- [ ] Element finding works
- [ ] Spatial filtering works
- [ ] Shadow DOM scanning works
- [ ] Frame navigation works
- [ ] Stack resolution works

### Compatibility

- [ ] All existing tests pass
- [ ] API remains backward compatible
- [ ] No breaking changes
- [ ] Documentation updated

## Post-Migration Tasks

- [ ] Create team training materials
- [ ] Schedule knowledge transfer session
- [ ] Document best practices
- [ ] Update internal wiki/docs
- [ ] Collect feedback from team
- [ ] Plan future improvements
- [ ] Set up monitoring/alerting

## Common Issues & Solutions

### Issue: Tests Fail After Migration

**Solution:**

1. Check imports are correct
2. Verify mock objects match new interface
3. Look for breaking changes in error messages
4. Debug with `debug: true` flag

### Issue: Performance Degradation

**Solution:**

1. Clear caches more frequently
2. Reduce maxShadowDepth if not needed
3. Profile with DevTools
4. Check for N+1 query problems

### Issue: Frame or Shadow DOM Not Found

**Solution:**

1. Enable debug logging
2. Check element.frame property
3. Verify shadow roots exist
4. Use correct scope in scanner

### Issue: Spatial Filters Incorrect

**Solution:**

1. Verify alignment buffer setting
2. Check element.rect metadata
3. Debug with highlightElements()
4. Review spatial filter logic

## Success Criteria

✅ All tests passing
✅ No performance degradation
✅ Backward API compatibility maintained
✅ Code quality improved
✅ Documentation complete
✅ Team trained on new approach
✅ Monitoring in place for issues

## Timeline Estimate

- **Phase 1 (Preparation)**: 1-2 days
- **Phase 2 (Implementation)**: 2-3 days
- **Phase 3 (Migration)**: 2-4 days (depends on codebase size)
- **Phase 4 (Full Migration)**: 1-2 days
- **Phase 5 (Cleanup)**: 1 day

**Total: 7-12 days** (varies by team size and codebase complexity)

## Contact & Support

- **Refactoring Documentation**: See REFACTORING_GUIDE.md
- **Quick Reference**: See QUICK_REFERENCE.md
- **Issues**: Create issue with `[elements-refactoring]` tag
- **Questions**: Ask on team Slack channel

---

**Note**: This is a living document. Update as needed during migration process.
Last Updated: 2026-05-16
