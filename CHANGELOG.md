# Change Log

## [2.0.0] - 2025-11-10

### Major Rewrite: Semantic Token Provider

This release represents a complete architectural overhaul of the extension to provide accurate, robust PHPDoc type highlighting using semantic tokens.

#### Added
- **Semantic Token Provider**: Replaced regex-based TextMate grammar with proper AST-based parsing
- **PHPStan Parser Integration**: Now uses `@rightcapital/phpdoc-parser` (TypeScript port of PHPStan's official parser)
- **Full PHPStan Syntax Support**:
  - ✅ Nested generics: `Collection<array<int>>`
  - ✅ Complex array shapes: `array{user: array{id: int, name: string}}`
  - ✅ Quoted keys: `array{'foo': int, "bar"?: string}`
  - ✅ Optional fields: `array{name?: string}`
  - ✅ Object shapes: `object{x: int, y: int}`
  - ✅ Callable signatures: `callable(int, int=): string`
  - ✅ Integer ranges: `int<0, 100>`
  - ✅ Conditional types: `($x is int ? true : false)`
  - ✅ Offset access: `MyArray['key']`
  - ✅ All PHPStan-specific types: `non-empty-string`, `positive-int`, etc.
  - ✅ Union and intersection types with proper nesting
- **TypeScript Implementation**: Extension now built with TypeScript for better maintainability
- **Comprehensive Type Coverage**: Supports all type patterns documented in PHPStan's official documentation

#### Fixed
- **Issue #4**: Array shapes now parse correctly with nested structures
- **Nested Generics**: Fixed parsing of deeply nested generic types
- **Type Accuracy**: Eliminated false positives and parsing failures with regex-based approach

#### Technical Details
- Added proper AST-based type parsing
- Implemented semantic token emission for VSCode
- Created modular, well-documented TypeScript codebase
- Added comprehensive PHPDoc tag support (@param, @return, @var, @throws, @property, @template, etc.)

#### Breaking Changes
- Extension now requires TypeScript compilation
- Minimum VSCode version remains ^1.72.0

## [1.0.0]

- First release