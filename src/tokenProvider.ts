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
  private readonly outputChannel?: vscode.OutputChannel;
  private callCount = 0;

  constructor(outputChannel?: vscode.OutputChannel) {
    this.parser = new PhpDocTypeParser();
    this.outputChannel = outputChannel;
  }

  /**
   * Provide semantic tokens for the entire document
   */
  public provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    this.callCount++;
    const startTime = Date.now();

    if (this.outputChannel) {
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(`[Call #${this.callCount}] provideDocumentSemanticTokens()`);
      this.outputChannel.appendLine(`  File: ${document.fileName}`);
      this.outputChannel.appendLine(`  Lines: ${document.lineCount}`);
    }

    const builder = new vscode.SemanticTokensBuilder(this.getLegend());

    try {
      const text = document.getText();

      // Find all PHPDoc comments
      const phpdocRegex = /\/\*\*[\s\S]*?\*\//g;
      let match: RegExpExecArray | null;
      let commentCount = 0;
      let tokenCount = 0;

      while ((match = phpdocRegex.exec(text)) !== null) {
        if (token.isCancellationRequested) {
          if (this.outputChannel) {
            this.outputChannel.appendLine(`  ⚠️  Cancelled by VSCode`);
          }
          return null;
        }

        commentCount++;
        const comment = match[0];
        const commentOffset = match.index;

        // Extract and process PHPDoc tags
        const tokensBeforeCount = tokenCount;
        this.processPhpDocComment(comment, commentOffset, document, builder);

        // Note: We can't easily track token count from builder, so we'll estimate
        tokenCount += comment.split(/@(?:param|return|var|throws|property|extends|implements|template)/).length - 1;
      }

      const result = builder.build();
      const duration = Date.now() - startTime;

      if (this.outputChannel) {
        this.outputChannel.appendLine(`  ✅ Success`);
        this.outputChannel.appendLine(`  PHPDoc Comments: ${commentCount}`);
        this.outputChannel.appendLine(`  Estimated Tags: ~${tokenCount}`);
        this.outputChannel.appendLine(`  Duration: ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (this.outputChannel) {
        this.outputChannel.appendLine(`  ❌ Error: ${errorMsg}`);
        this.outputChannel.appendLine(`  Duration: ${duration}ms`);
        if (error instanceof Error && error.stack) {
          this.outputChannel.appendLine(`  Stack: ${error.stack}`);
        }
      }

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
    // Process different PHPDoc tags
    this.processTag(comment, commentOffset, /@param\s+/g, '$', document, builder, (match, typeStr, offset) => {
      // Also highlight parameter name
      const paramMatch = comment.substring(offset + typeStr.length).match(/^\s*\$(\w+)/);
      if (paramMatch) {
        const paramOffset = offset + typeStr.length + paramMatch.index! + paramMatch[0].indexOf('$');
        const position = document.positionAt(commentOffset + paramOffset);
        builder.push(
          position.line,
          position.character,
          paramMatch[1].length + 1,
          this.encodeTokenType(SemanticTokenType.Variable),
          0
        );
      }
    });

    this.processTag(comment, commentOffset, /@return\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@var\s+/g, '$', document, builder);
    this.processTag(comment, commentOffset, /@throws\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@extends\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@implements\s+/g, null, document, builder);

    this.processTag(comment, commentOffset, /@property(?:-read|-write)?\s+/g, '$', document, builder, (match, typeStr, offset) => {
      // Also highlight property name
      const propMatch = comment.substring(offset + typeStr.length).match(/^\s*\$(\w+)/);
      if (propMatch) {
        const propOffset = offset + typeStr.length + propMatch.index! + propMatch[0].indexOf('$');
        const position = document.positionAt(commentOffset + propOffset);
        builder.push(
          position.line,
          position.character,
          propMatch[1].length + 1,
          this.encodeTokenType(SemanticTokenType.Property),
          0
        );
      }
    });

    // Handle @template with optional bounds
    const templateRegex = /@template\s+(\w+)(?:\s+of\s+)?/g;
    let templateMatch;
    while ((templateMatch = templateRegex.exec(comment)) !== null) {
      if (templateMatch[0].includes(' of ')) {
        const typeStartOffset = templateMatch.index + templateMatch[0].length;
        const typeString = this.extractTypeString(comment.substring(typeStartOffset), null);
        if (typeString) {
          this.parseAndEmitTokens(typeString, commentOffset + typeStartOffset, document, builder);
        }
      }
    }

    // Handle @phpstan-type and @psalm-type
    const typeAliasRegex = /@(?:phpstan-type|psalm-type)\s+\w+\s*=?\s*/g;
    let typeAliasMatch;
    while ((typeAliasMatch = typeAliasRegex.exec(comment)) !== null) {
      const typeStartOffset = typeAliasMatch.index + typeAliasMatch[0].length;
      const typeString = this.extractTypeString(comment.substring(typeStartOffset), null);
      if (typeString) {
        this.parseAndEmitTokens(typeString, commentOffset + typeStartOffset, document, builder);
      }
    }
  }

  /**
   * Process a specific PHPDoc tag and extract type information
   */
  private processTag(
    comment: string,
    commentOffset: number,
    tagRegex: RegExp,
    stopChar: string | null,
    document: vscode.TextDocument,
    builder: vscode.SemanticTokensBuilder,
    callback?: (match: RegExpExecArray, typeString: string, offset: number) => void
  ): void {
    let match: RegExpExecArray | null;
    tagRegex.lastIndex = 0;

    while ((match = tagRegex.exec(comment)) !== null) {
      const typeStartOffset = match.index + match[0].length;
      const remainingText = comment.substring(typeStartOffset);

      const typeString = this.extractTypeString(remainingText, stopChar);

      if (typeString && this.isTypeString(typeString)) {
        this.parseAndEmitTokens(typeString, commentOffset + typeStartOffset, document, builder);

        if (callback) {
          callback(match, typeString, typeStartOffset);
        }
      }
    }
  }

  /**
   * Extract a type string from text, handling balanced brackets/braces/parens
   */
  private extractTypeString(text: string, stopChar: string | null): string {
    let depth = 0;
    let inAngleBrackets = 0;
    let inBraces = 0;
    let inParens = 0;
    let i = 0;

    // Skip leading whitespace
    while (i < text.length && /\s/.test(text[i])) {
      i++;
    }

    const start = i;

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
        // Stop at stop character (e.g., '$' for @param)
        if (stopChar && char === stopChar) {
          break;
        }

        // Stop at newline followed by asterisk (next line in multi-line comment)
        if (char === '\n' && i + 1 < text.length && text[i + 1] === '*') {
          break;
        }

        // Stop at comment end marker
        if (char === '*' && i + 1 < text.length && text[i + 1] === '/') {
          break;
        }

        // Stop at double space or tab (likely start of description)
        if (i > start && char === ' ' && i + 1 < text.length) {
          const nextChar = text[i + 1];
          // If next is space, tab, newline, or certain punctuation, stop
          if (nextChar === ' ' || nextChar === '\t' || nextChar === '\n' || nextChar === '*') {
            break;
          }
          // If followed by common description words, stop
          const remaining = text.substring(i + 1);
          if (/^(the|a|an|this|that|returns|whether|if|when|for|to|description|desc)/i.test(remaining)) {
            break;
          }
        }

        // Stop at @tag (next tag)
        if (char === '@' && i > start) {
          break;
        }
      }

      i++;
    }

    return text.substring(start, i).trim();
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
