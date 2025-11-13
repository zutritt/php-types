/**
 * Unit tests for type extraction from PHPDoc comments
 * Tests the extractTypeString logic that handles multiline types
 */

const assert = require('assert');

/**
 * Extract type string from PHPDoc text, handling balanced brackets and multiline
 * This mimics the extractTypeString method from tokenProvider.ts
 */
function extractTypeFromPhpDoc(phpdocText, tagName = '@param') {
  // Remove PHPDoc comment markers (/** and */)
  let cleaned = phpdocText
    .replace(/^\/\*\*/, '')  // Remove opening
    .replace(/\*\/$/, '')     // Remove closing
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, ''))  // Remove * continuation
    .join(' ')                // Join into single line
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();

  // Find the tag
  const tagRegex = new RegExp(`${tagName}\\s+`, 'g');
  const match = tagRegex.exec(cleaned);

  if (!match) {
    return null;
  }

  const start = match.index + match[0].length;
  const text = cleaned.substring(start);

  // Extract type using balanced bracket parsing
  let depth = 0;
  let inAngleBrackets = 0;
  let inBraces = 0;
  let inParens = 0;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Track bracket depth
    if (char === '<') {
      inAngleBrackets++;
    } else if (char === '>') {
      inAngleBrackets--;
    } else if (char === '{') {
      inBraces++;
    } else if (char === '}') {
      inBraces--;
    } else if (char === '(') {
      inParens++;
    } else if (char === ')') {
      inParens--;
    }

    depth = inAngleBrackets + inBraces + inParens;

    // Stop conditions when at depth 0
    if (depth === 0) {
      // Stop at $ (parameter name)
      if (char === '$') {
        break;
      }

      // Stop at double space or common description words
      if (i > 0 && char === ' ') {
        const remaining = text.substring(i + 1);
        if (remaining.startsWith(' ') ||
            /^(the|a|an|this|that|returns|whether)/i.test(remaining)) {
          break;
        }
      }
    }

    i++;
  }

  return text.substring(0, i).trim();
}

// ============================================================================
// Test Suite
// ============================================================================

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(description, phpdocText, expectedType, tagName = '@param') {
    try {
      const extracted = extractTypeFromPhpDoc(phpdocText, tagName);
      assert.strictEqual(extracted, expectedType, `Expected "${expectedType}", got "${extracted}"`);
      console.log(`✓ ${description}`);
      passed++;
    } catch (error) {
      console.error(`✗ ${description}`);
      console.error(`  ${error.message}`);
      failed++;
    }
  }

  console.log('='.repeat(70));
  console.log('Type Extraction Unit Tests');
  console.log('='.repeat(70));

  // Single-line tests
  test(
    'Simple type',
    '/** @param string $var */',
    'string'
  );

  test(
    'Generic type',
    '/** @param array<int> $var */',
    'array<int>'
  );

  test(
    'Nested generic',
    '/** @param Collection<array<int>> $var */',
    'Collection<array<int>>'
  );

  test(
    'Array shape',
    '/** @param array{foo: int, bar: string} $var */',
    'array{foo: int, bar: string}'
  );

  test(
    'Union type',
    '/** @param int|string|null $var */',
    'int|string|null'
  );

  test(
    'Callable',
    '/** @param callable(int, string): bool $var */',
    'callable(int, string): bool'
  );

  // Multiline tests
  test(
    'Multiline array shape',
    `/**
     * @param array{
     *   id: int,
     *   name: string
     * } $config
     */`,
    'array{ id: int, name: string }'
  );

  test(
    'Multiline nested array shape',
    `/**
     * @param array{
     *   user: array{
     *     id: int,
     *     name: string
     *   },
     *   settings: array<string, mixed>
     * } $data
     */`,
    'array{ user: array{ id: int, name: string }, settings: array<string, mixed> }'
  );

  test(
    'Multiline callable',
    `/**
     * @param callable(
     *   int $a,
     *   string $b
     * ): bool $validator
     */`,
    'callable( int $a, string $b ): bool'
  );

  test(
    'Multiline object shape',
    `/**
     * @param object{
     *   x: int,
     *   y: int,
     *   label?: string
     * } $point
     */`,
    'object{ x: int, y: int, label?: string }'
  );

  // @return tests
  test(
    'Return type simple',
    '/** @return string */',
    'string',
    '@return'
  );

  test(
    'Return type with description',
    '/** @return array{id: int} Returns the data */',
    'array{id: int}',
    '@return'
  );

  test(
    'Return multiline',
    `/**
     * @return array{
     *   success: bool,
     *   data?: array<mixed>
     * }
     */`,
    'array{ success: bool, data?: array<mixed> }',
    '@return'
  );

  // @var tests
  test(
    'Var type',
    '/** @var non-empty-array<int> */',
    'non-empty-array<int>',
    '@var'
  );

  test(
    'Var with variable',
    '/** @var Collection<string> $items */',
    'Collection<string>',
    '@var'
  );

  // Complex cases
  test(
    'Conditional type',
    '/** @return (T is int ? static : array<static>) */',
    '(T is int ? static : array<static>)',
    '@return'
  );

  test(
    'Offset access',
    '/** @return MyArray[\'key\'] */',
    'MyArray[\'key\']',
    '@return'
  );

  test(
    'Integer range',
    '/** @param int<0, 100> $percentage */',
    'int<0, 100>'
  );

  // Print summary
  console.log('='.repeat(70));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log(`\n✗ ${failed} test(s) failed`);
    process.exit(1);
  }
}

runTests();
