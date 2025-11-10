# Testing Guide for PHP Doc Extended

This guide helps you verify that semantic tokens are working correctly in the extension.

## The Issue

The extension includes **both**:
1. **TextMate grammar** (`syntaxes/php.tmLanguage.json`) - regex-based, limited capabilities
2. **Semantic Token Provider** (TypeScript) - AST-based, full PHPStan support

Since both systems can provide highlighting, it's hard to tell which one is actually working! You might see highlighting but not know if it's from the old TextMate grammar or the new semantic tokens.

## Quick Verification Steps

### 1. Check Output Panel (Most Important!)

```
1. Press F5 to launch Extension Development Host
2. Open a PHP file with PHPDoc comments
3. View → Output (Ctrl+Shift+U / Cmd+Shift+U)
4. Select "PHP Doc Extended" from the dropdown
```

**✅ Semantic tokens working:** You'll see logs like:
```
================================================================================
PHP Doc Extended: Extension activating...
Activation Time: 2025-11-10T18:30:00.000Z
================================================================================
✅ Semantic token provider registered successfully
   Token Types: type, class, interface, parameter, property, keyword, operator, variable

[Call #1] provideDocumentSemanticTokens()
  File: /path/to/test.php
  Lines: 50
  ✅ Success
  PHPDoc Comments: 8
  Estimated Tags: ~12
  Duration: 5ms
```

**❌ Only TextMate working:** Output panel will be empty or show only activation, no "provideDocumentSemanticTokens()" calls.

### 2. Inspect Editor Tokens

```
1. Open test-verification.php
2. Click inside a PHPDoc type (e.g., the word "array" in @param array{...})
3. Right-click → "Developer: Inspect Editor Tokens and Scopes"
```

**✅ Semantic tokens working:**
```
semantic token type: keyword
semantic token type: type
```

**❌ Only TextMate working:**
```
textmate scopes:
  keyword.other.type.php
  (no semantic token type section, or it says "No semantic tokens")
```

### 3. Visual Test: Complex Types

Open `test-verification.php` and look at this line:

```php
/** @param array{foo: int, bar: array{nested: string}} $data */
```

**✅ Semantic tokens:** All parts highlighted correctly, including nested `array{nested: string}`

**❌ Only TextMate:** May break or stop highlighting at certain points (TextMate regex can't handle deep nesting)

## Test Files

We've created two test files:

### test.php
- 15 edge cases from v2.0.1 fix
- Tests single-line PHPDoc, array shapes, callables, etc.

### test-verification.php
- Comprehensive semantic token verification
- Includes inspection instructions
- Tests types that TextMate grammar can't handle

## Common Issues & Solutions

### Issue: No logs in Output panel

**Problem:** Semantic token provider is not being called

**Possible causes:**
1. Extension didn't activate
   - Solution: Check Extensions view, ensure it's enabled
2. Wrong language mode
   - Solution: Ensure file is detected as PHP (bottom-right corner of VSCode)
3. Provider registration failed
   - Solution: Check for error messages in Output panel

### Issue: Logs show but types not highlighted

**Problem:** Semantic tokens are being generated but not applied

**Possible causes:**
1. VSCode semantic token feature disabled
   - Solution: Check settings for "editor.semanticHighlighting.enabled"
2. Theme doesn't support semantic tokens
   - Solution: Try a different theme (e.g., Dark+ or Light+)

### Issue: Can't tell if it's working

**Problem:** Highlighting looks the same with or without semantic tokens

**Solution:** Temporarily disable TextMate grammar to isolate semantic tokens:

1. Comment out the TextMate grammar in `package.json`:
```json
"contributes": {
  // "grammars": [
  //   {
  //     "language": "phpdoc",
  //     "scopeName": "text.phpdoc",
  //     "injectTo": ["text.html.php"],
  //     "path": "./syntaxes/php.tmLanguage.json"
  //   }
  // ]
}
```

2. Reload window (F5 in Extension Development Host)
3. Now you'll ONLY see semantic token highlighting
4. If types disappear, semantic tokens aren't working

## Debugging Commands

Run these from Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

### Developer: Inspect Editor Tokens and Scopes
- Shows detailed token information at cursor position
- Reveals whether semantic tokens or TextMate is providing highlighting

### Developer: Force Retokenize
- Forces VSCode to request new tokens
- Should trigger new logs in Output panel if semantic tokens are working

### Developer: Toggle Developer Tools
- Opens Chrome DevTools for VSCode
- Check Console for any JavaScript errors
- Errors like "Cannot read property 'parse' of undefined" indicate issues with phpdoc-parser

### Developer: Show Running Extensions
- Shows all active extensions
- "PHP Doc Extended" should appear in the list
- Click to see activation status and errors

## Expected Performance

With semantic tokens working:
- **Activation**: <100ms
- **Tokenization**: 1-10ms per file depending on size
- **Memory**: Negligible (parser is lightweight)

If you see much slower performance (>100ms per file), there may be an issue with the parser or token generation logic.

## Reporting Issues

When reporting issues, please include:

1. **Output panel logs** (View → Output → PHP Doc Extended)
2. **Token inspection** (right-click type → Inspect Editor Tokens)
3. **VSCode version** (Help → About)
4. **Test case** (specific PHPDoc that doesn't work)

Example issue report:
```
**Issue:** Nested array shapes not highlighting

**Output logs:**
[Call #1] provideDocumentSemanticTokens()
✅ Success
Duration: 3ms

**Token inspection:**
semantic token type: keyword (for "array")
No tokens for content inside braces

**Test case:**
/** @param array{foo: array{bar: int}} $x */

**VSCode version:** 1.85.0
```

## Advanced Testing: Disable/Enable Features

### Test A: Semantic Tokens Only
Edit `package.json` - comment out `grammars` section
- Tests: Pure semantic token highlighting
- Expected: Types should still highlight (if semantic tokens work)

### Test B: TextMate Grammar Only
Edit `src/extension.ts` - comment out `registerDocumentSemanticTokensProvider`
- Tests: Fallback to regex-based highlighting
- Expected: Simple types work, complex types may break

### Test C: Neither (Baseline)
Disable both features
- Tests: VSCode default PHP highlighting
- Expected: No PHPDoc type highlighting at all

## Success Criteria

✅ **All systems working** when:
1. Output panel shows "provideDocumentSemanticTokens()" logs
2. Token inspection shows "semantic token type: ..."
3. Complex nested types highlight correctly
4. Single-line PHPDoc with spaces works
5. All 15 test cases in test.php highlight properly
6. Performance is <10ms per file

---

Need more help? Check:
- Main documentation: README.md
- Implementation details: INVESTIGATION_AND_SOLUTION.md
- Changelog: CHANGELOG.md
