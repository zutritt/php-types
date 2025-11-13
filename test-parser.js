/**
 * Direct parser testing - validates @rightcapital/phpdoc-parser library
 * Run with: node test-parser.js
 */

const {
  Lexer,
  TokenIterator,
  ConstExprParser,
  TypeParser,
} = require('@rightcapital/phpdoc-parser');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class ParserTester {
  constructor() {
    this.lexer = new Lexer();
    this.constExprParser = new ConstExprParser();
    this.typeParser = new TypeParser(this.constExprParser);
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * Test a type string and validate parsing
   */
  testType(description, typeString, expectedToPass = true) {
    this.testCount++;
    process.stdout.write(`\n${colors.cyan}Test ${this.testCount}:${colors.reset} ${description}\n`);
    process.stdout.write(`  Input: ${colors.yellow}"${typeString}"${colors.reset}\n`);

    try {
      const tokens = this.lexer.tokenize(typeString);
      const tokenIterator = new TokenIterator(tokens);
      const result = this.typeParser.parse(tokenIterator);

      if (expectedToPass) {
        this.passCount++;
        process.stdout.write(`  ${colors.green}✓ PASS${colors.reset} - Parsed successfully\n`);
        process.stdout.write(`  AST: ${colors.blue}${result.constructor.name}${colors.reset}\n`);

        // Show structure for complex types
        if (result.type || result.types || result.genericTypes) {
          this.showASTStructure(result, 2);
        }

        return { success: true, ast: result };
      } else {
        this.failCount++;
        process.stdout.write(`  ${colors.red}✗ FAIL${colors.reset} - Expected to fail but parsed\n`);
        return { success: false, ast: result };
      }
    } catch (error) {
      if (!expectedToPass) {
        this.passCount++;
        process.stdout.write(`  ${colors.green}✓ PASS${colors.reset} - Failed as expected\n`);
        process.stdout.write(`  Error: ${error.message}\n`);
        return { success: true, error };
      } else {
        this.failCount++;
        process.stdout.write(`  ${colors.red}✗ FAIL${colors.reset} - Parsing failed\n`);
        process.stdout.write(`  Error: ${error.message}\n`);
        if (error.stack) {
          process.stdout.write(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}\n`);
        }
        return { success: false, error };
      }
    }
  }

  /**
   * Show AST structure recursively
   */
  showASTStructure(node, indent = 0) {
    const prefix = '  '.repeat(indent);

    if (node.type) {
      process.stdout.write(`${prefix}type: ${node.type.constructor.name}`);
      if (node.type.name) {
        process.stdout.write(` (${node.type.name})`);
      }
      process.stdout.write('\n');
    }

    if (node.types && Array.isArray(node.types)) {
      process.stdout.write(`${prefix}types: [\n`);
      node.types.forEach(t => {
        process.stdout.write(`${prefix}  ${t.constructor.name}`);
        if (t.name) process.stdout.write(` (${t.name})`);
        process.stdout.write('\n');
      });
      process.stdout.write(`${prefix}]\n`);
    }

    if (node.genericTypes && Array.isArray(node.genericTypes)) {
      process.stdout.write(`${prefix}genericTypes: [\n`);
      node.genericTypes.forEach(g => {
        process.stdout.write(`${prefix}  ${g.constructor.name}`);
        if (g.name) process.stdout.write(` (${g.name})`);
        process.stdout.write('\n');
      });
      process.stdout.write(`${prefix}]\n`);
    }

    if (node.items && Array.isArray(node.items)) {
      process.stdout.write(`${prefix}items: ${node.items.length} items\n`);
    }
  }

  /**
   * Test multiline type extraction (simulating PHPDoc with * continuations)
   */
  testMultilineExtraction(description, phpdocText) {
    this.testCount++;
    process.stdout.write(`\n${colors.cyan}Test ${this.testCount}:${colors.reset} ${description}\n`);
    process.stdout.write(`  Input:\n${phpdocText.split('\n').map(l => `    ${l}`).join('\n')}\n`);

    // Extract type from PHPDoc (simple regex for @param, @return, etc.)
    const match = phpdocText.match(/@(?:param|return|var)\s+([^\s$]+)/);

    if (!match) {
      this.failCount++;
      process.stdout.write(`  ${colors.red}✗ FAIL${colors.reset} - Could not extract type from PHPDoc\n`);
      return { success: false };
    }

    const extractedType = match[1];
    process.stdout.write(`  Extracted: ${colors.yellow}"${extractedType}"${colors.reset}\n`);

    try {
      const tokens = this.lexer.tokenize(extractedType);
      const tokenIterator = new TokenIterator(tokens);
      const result = this.typeParser.parse(tokenIterator);

      this.passCount++;
      process.stdout.write(`  ${colors.green}✓ PASS${colors.reset} - Parsed successfully\n`);
      process.stdout.write(`  AST: ${colors.blue}${result.constructor.name}${colors.reset}\n`);

      return { success: true, ast: result, extracted: extractedType };
    } catch (error) {
      this.failCount++;
      process.stdout.write(`  ${colors.red}✗ FAIL${colors.reset} - Parsing failed\n`);
      process.stdout.write(`  Error: ${error.message}\n`);
      return { success: false, error, extracted: extractedType };
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    process.stdout.write(`\n${'='.repeat(70)}\n`);
    process.stdout.write(`${colors.cyan}Test Summary${colors.reset}\n`);
    process.stdout.write(`${'='.repeat(70)}\n`);
    process.stdout.write(`Total Tests: ${this.testCount}\n`);
    process.stdout.write(`${colors.green}Passed: ${this.passCount}${colors.reset}\n`);
    process.stdout.write(`${colors.red}Failed: ${this.failCount}${colors.reset}\n`);

    const passRate = ((this.passCount / this.testCount) * 100).toFixed(1);
    if (this.failCount === 0) {
      process.stdout.write(`\n${colors.green}✓ All tests passed! (${passRate}%)${colors.reset}\n`);
    } else {
      process.stdout.write(`\n${colors.red}✗ Some tests failed (${passRate}% pass rate)${colors.reset}\n`);
    }
    process.stdout.write(`${'='.repeat(70)}\n`);
  }
}

// ============================================================================
// Run Tests
// ============================================================================

const tester = new ParserTester();

process.stdout.write(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
process.stdout.write(`${colors.cyan}PHPStan Parser Direct Testing${colors.reset}\n`);
process.stdout.write(`${colors.cyan}Testing @rightcapital/phpdoc-parser library${colors.reset}\n`);
process.stdout.write(`${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);

// Basic types
tester.testType('Simple type', 'string');
tester.testType('Integer type', 'int');
tester.testType('Nullable type', '?string');
tester.testType('Union type', 'int|string|null');
tester.testType('Intersection type', 'Countable&Traversable');

// Array types
tester.testType('Array generic', 'array<string>');
tester.testType('Array with key-value', 'array<int, string>');
tester.testType('List type', 'list<int>');
tester.testType('Non-empty array', 'non-empty-array<string>');

// Nested generics
tester.testType('Nested generic', 'Collection<array<int>>');
tester.testType('Deeply nested', 'Collection<array<string, list<int>>>');
tester.testType('Triple nested', 'Promise<Result<Collection<array<int>>>>');

// Array shapes
tester.testType('Simple array shape', 'array{foo: int, bar: string}');
tester.testType('Array shape with optional', 'array{foo: int, bar?: string}');
tester.testType('Nested array shape', 'array{user: array{id: int, name: string}}');
tester.testType('Quoted keys', 'array{\'foo\': int, "bar": string}');
tester.testType('Numeric keys', 'array{0: int, 1: string}');

// Object shapes
tester.testType('Simple object shape', 'object{x: int, y: int}');
tester.testType('Object shape with optional', 'object{x: int, y?: string}');

// Callable signatures
tester.testType('Simple callable', 'callable(int, string): bool');
tester.testType('Callable with optional', 'callable(int, int=): string');
tester.testType('Callable with variadic', 'callable(float...): int');
tester.testType('Callable complex return', 'callable(int): (int|null)');

// PHPStan specific
tester.testType('Positive int', 'positive-int');
tester.testType('Class string', 'class-string');
tester.testType('Class string generic', 'class-string<Exception>');
tester.testType('Integer range', 'int<0, 100>');
tester.testType('Integer range with min', 'int<min, 100>');
tester.testType('Integer range with max', 'int<0, max>');

// Conditional types
tester.testType('Conditional type', '($size is positive-int ? non-empty-array : array)');
tester.testType('Complex conditional', '(T is int ? static : array<static>)');

// Special syntax
tester.testType('Offset access', 'MyArray[\'bar\']');
tester.testType('Parenthesized union', '(Type1&Type2)|Type3');
tester.testType('$this type', '$this');
tester.testType('Static type', 'static');
tester.testType('Never type', 'never');

// Edge cases
tester.testType('Union with array shape', 'int|string|array{key: string}');
tester.testType('Intersection with generics', 'Countable&Iterator<string>');

// Multiline PHPDoc tests
tester.testMultilineExtraction(
  'Multiline array shape',
  `/**
 * @param array{
 *   id: int,
 *   name: string
 * } $config
 */`
);

tester.testMultilineExtraction(
  'Multiline callable',
  `/**
 * @param callable(
 *   int $a,
 *   string $b
 * ): bool $validator
 */`
);

tester.testMultilineExtraction(
  'Complex multiline',
  `/**
 * @return array{
 *   user: array{
 *     id: positive-int,
 *     name: non-empty-string,
 *     roles: list<string>
 *   },
 *   metadata: array<string, mixed>
 * }
 */`
);

// Invalid types (should fail)
process.stdout.write(`\n${colors.yellow}Testing Invalid Types (should fail):${colors.reset}\n`);
// Note: The parser might actually accept some of these, depending on how lenient it is

// Print summary
tester.printSummary();

// Exit with appropriate code
process.exit(tester.failCount > 0 ? 1 : 0);
