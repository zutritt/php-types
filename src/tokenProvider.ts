/**
 * Semantic token provider for PHPDoc type highlighting
 * Provides enhanced syntax highlighting for PHPDoc comments in PHP files
 */

import * as vscode from 'vscode';
import { PhpDocTypeParser } from './phpDocTypeParser';
import { TOKEN_TYPES, TOKEN_MODIFIERS, SemanticTokenType, SemanticTokenModifier } from './types';

/**
 * Provides semantic tokens for PHPDoc comments in PHP files
 */
export class PhpDocSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  private readonly parser: PhpDocTypeParser;

  constructor() {
    this.parser = new PhpDocTypeParser();
  }

  /**
   * Provide semantic tokens for the entire document
   */
  public provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    const builder = new vscode.SemanticTokensBuilder(this.getLegend());

    try {
      const text = document.getText();

      // Find all PHPDoc comments
      const phpdocRegex = /\/\*\*[\s\S]*?\*\//g;
      let match: RegExpExecArray | null;

      while ((match = phpdocRegex.exec(text)) !== null) {
        if (token.isCancellationRequested) {
          return null;
        }

        const comment = match[0];
        const commentOffset = match.index;

        // Extract and process PHPDoc tags
        this.processPhpDocComment(comment, commentOffset, document, builder);
      }

      return builder.build();
    } catch (error) {
      console.error('Error providing semantic tokens:', error);
      return builder.build();
    }
  }

  /**
   * Process a single PHPDoc comment and extract type tokens
   */
  private processPhpDocComment(
    comment: string,
    commentOffset: number,
    document: vscode.TextDocument,
    builder: vscode.SemanticTokensBuilder
  ): void {
    // PHPDoc tags that contain type information
    const typeTagPatterns = [
      // @param Type $name Description
      /@param\s+([^\s$]+)\s+\$(\w+)/g,

      // @return Type Description
      /@return\s+([^\s*]+)/g,

      // @var Type Description or @var Type $name
      /@var\s+([^\s$*]+)/g,

      // @throws Type
      /@throws\s+([^\s*]+)/g,

      // @method Type name() or @method name()
      /@method\s+(?:([^\s(]+)\s+)?(\w+)\s*\(/g,

      // @property Type $name
      /@property(?:-read|-write)?\s+([^\s$]+)\s+\$(\w+)/g,

      // @extends Type
      /@extends\s+([^\s*]+)/g,

      // @implements Type
      /@implements\s+([^\s*]+)/g,

      // @template T, @template T of Type
      /@template\s+(\w+)(?:\s+of\s+([^\s*]+))?/g,

      // @phpstan-type AliasName Type
      /@phpstan-type\s+(\w+)\s+([^\s*]+)/g,

      // @psalm-type AliasName = Type
      /@psalm-type\s+(\w+)\s*=\s*([^\s*]+)/g,
    ];

    for (const pattern of typeTagPatterns) {
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0; // Reset regex state

      while ((match = pattern.exec(comment)) !== null) {
        // Extract type string(s) from the match
        const typeStrings: Array<{ type: string; offset: number }> = [];

        // Different patterns have types at different capture groups
        if (match[1] && this.isTypeString(match[1])) {
          const offset = match.index + match[0].indexOf(match[1]);
          typeStrings.push({ type: match[1], offset });
        }
        if (match[2] && this.isTypeString(match[2]) && match[0].includes(' of ')) {
          // Template bound type
          const offset = match.index + match[0].indexOf(match[2]);
          typeStrings.push({ type: match[2], offset });
        }

        // Parse each type string
        for (const { type: typeString, offset: typeOffset } of typeStrings) {
          const absoluteOffset = commentOffset + typeOffset;
          this.parseAndEmitTokens(typeString, absoluteOffset, document, builder);
        }

        // Handle parameter names (@param)
        if (match[0].startsWith('@param') && match[2]) {
          const paramName = match[2];
          const paramOffset = match.index + match[0].indexOf('$' + paramName);
          const position = document.positionAt(commentOffset + paramOffset);
          builder.push(
            position.line,
            position.character,
            paramName.length + 1, // Include $
            this.encodeTokenType(SemanticTokenType.Variable),
            0
          );
        }

        // Handle property names (@property)
        if (match[0].startsWith('@property') && match[2]) {
          const propName = match[2];
          const propOffset = match.index + match[0].indexOf('$' + propName);
          const position = document.positionAt(commentOffset + propOffset);
          builder.push(
            position.line,
            position.character,
            propName.length + 1, // Include $
            this.encodeTokenType(SemanticTokenType.Property),
            0
          );
        }
      }
    }
  }

  /**
   * Parse a type string and emit semantic tokens
   */
  private parseAndEmitTokens(
    typeString: string,
    offset: number,
    document: vscode.TextDocument,
    builder: vscode.SemanticTokensBuilder
  ): void {
    try {
      // Parse the type string
      const tokens = this.parser.parseType(typeString, offset);

      // Sort tokens by position
      tokens.sort((a, b) => a.startOffset - b.startOffset);

      // Emit tokens, avoiding duplicates
      const emittedRanges = new Set<string>();

      for (const token of tokens) {
        const rangeKey = `${token.startOffset}-${token.endOffset}`;

        if (emittedRanges.has(rangeKey)) {
          continue; // Skip duplicate tokens
        }

        emittedRanges.add(rangeKey);

        const position = document.positionAt(token.startOffset);
        const length = token.endOffset - token.startOffset;

        builder.push(
          position.line,
          position.character,
          length,
          this.encodeTokenType(token.tokenType),
          this.encodeTokenModifiers(token.tokenModifiers)
        );
      }
    } catch (error) {
      // Parsing failed - tokens will fall back to TextMate grammar
      console.warn('Failed to parse type string:', typeString, error);
    }
  }

  /**
   * Check if a string looks like a type (not a variable name or description)
   */
  private isTypeString(str: string): boolean {
    // Exclude strings that are clearly not types
    if (!str || str.length === 0) {
      return false;
    }

    // Variable names start with $
    if (str.startsWith('$')) {
      return false;
    }

    // Descriptions usually have spaces or start with lowercase and are long
    if (str.includes(' ') && str.length > 20) {
      return false;
    }

    // Common description words
    const descriptionWords = ['the', 'a', 'an', 'this', 'that', 'returns', 'whether'];
    if (descriptionWords.includes(str.toLowerCase())) {
      return false;
    }

    return true;
  }

  /**
   * Encode token type to numeric index
   */
  private encodeTokenType(tokenType: SemanticTokenType): number {
    const index = TOKEN_TYPES.indexOf(tokenType);
    return index >= 0 ? index : 0;
  }

  /**
   * Encode token modifiers to bit flags
   */
  private encodeTokenModifiers(modifiers: SemanticTokenModifier[]): number {
    let result = 0;
    for (const modifier of modifiers) {
      const index = TOKEN_MODIFIERS.indexOf(modifier);
      if (index >= 0) {
        result |= (1 << index);
      }
    }
    return result;
  }

  /**
   * Get the semantic token legend
   */
  public getLegend(): vscode.SemanticTokensLegend {
    return new vscode.SemanticTokensLegend(TOKEN_TYPES, TOKEN_MODIFIERS);
  }
}
