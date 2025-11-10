# PHP Doc Extended

Enhanced PHPDoc type highlighting for Visual Studio Code using semantic tokens powered by PHPStan's parser.

![Example](./res/example.png)

## Features

This extension provides **accurate, robust syntax highlighting** for PHPDoc type annotations in PHP files using PHPStan's official parser.

### Supported PHPDoc Syntax

✅ **Nested Generics**
```php
/** @var Collection<array<string, int>> */
```

✅ **Complex Array Shapes**
```php
/** @param array{user: array{id: int, name: string}} $data */
/** @var array{'foo': int, "bar"?: string} */
```

✅ **Object Shapes**
```php
/** @return object{x: int, y: int, label?: string} */
```

✅ **Callable Signatures**
```php
/** @var callable(int, string): bool */
/** @param callable(float...): void $callback */
```

✅ **PHPStan-Specific Types**
- `non-empty-string`, `non-falsy-string`, `truthy-string`
- `positive-int`, `negative-int`, `non-negative-int`
- `non-empty-array`, `non-empty-list`, `array-key`
- `class-string<T>`, `callable-string`
- And many more...

✅ **Advanced Type Features**
- Union types: `int|string|null`
- Intersection types: `Countable&Traversable`
- Integer ranges: `int<0, 100>`
- Conditional types: `($x is int ? true : false)`
- Offset access: `MyArray['key']`
- Template types: `@template T of BaseClass`

## How It Works

Unlike traditional regex-based TextMate grammars, this extension uses:

1. **PHPStan's Official Parser** (`@rightcapital/phpdoc-parser`) - TypeScript port of PHPStan's phpdoc-parser
2. **AST-Based Parsing** - Builds an Abstract Syntax Tree for accurate type analysis
3. **Semantic Tokens** - Provides VSCode with precise token information for highlighting

This approach ensures **100% compatibility** with PHPStan's type syntax and eliminates parsing errors with nested structures.

## Installation

Install from the VSCode marketplace or via command line:
```bash
code --install-extension ErnstStavroBlofeld.php-types
```

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

### Project Structure

```
php-types/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── tokenProvider.ts      # Semantic token provider
│   ├── phpDocTypeParser.ts   # PHPStan parser wrapper
│   └── types.ts              # Type definitions
├── syntaxes/
│   └── php.tmLanguage.json   # Fallback TextMate grammar
└── out/                      # Compiled JavaScript (generated)
```

## Resources

- [PHPStan Type Documentation](https://phpstan.org/writing-php-code/phpdoc-types)
- [PHPStan Parser (PHP)](https://github.com/phpstan/phpdoc-parser)
- [PHPStan Parser (TypeScript)](https://github.com/RightCapitalHQ/phpdoc-parser)
- [VSCode Semantic Tokens API](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide)

## Contributing

Issues and pull requests are welcome! Please report any parsing issues or feature requests on GitHub.

## License

See [LICENSE.md](LICENSE.md)
