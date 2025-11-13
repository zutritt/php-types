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
    // Tags with "Type $variable" pattern
    this.processTag(comment, commentOffset, /@param\s+/g, '$', document, builder, this.highlightVariable.bind(this));
    this.processTag(comment, commentOffset, /@param-out\s+/g, '$', document, builder, this.highlightVariable.bind(this));
    this.processTag(comment, commentOffset, /@var\s+/g, '$', document, builder, this.highlightVariable.bind(this));
    this.processTag(comment, commentOffset, /@property(?:-read|-write)?\s+/g, '$', document, builder, this.highlightProperty.bind(this));

    // Tags with just "Type" pattern (no variable)
    this.processTag(comment, commentOffset, /@return\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@throws\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@extends\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@implements\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@require-extends\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@require-implements\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@mixin\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@use\s+/g, null, document, builder);

    // PHPStan-specific tags
    this.processTag(comment, commentOffset, /@phpstan-self-out\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@phpstan-this-out\s+/g, null, document, builder);

    // @param with special modifiers
    this.processTag(comment, commentOffset, /@param-later-invoked-callable\s+/g, '$', document, builder, this.highlightVariable.bind(this));
    this.processTag(comment, commentOffset, /@param-immediately-invoked-callable\s+/g, '$', document, builder, this.highlightVariable.bind(this));
    this.processTag(comment, commentOffset, /@param-closure-this\s+/g, null, document, builder);

    // @phpstan-assert tags (Type $variable pattern)
    this.processTag(comment, commentOffset, /@phpstan-assert\s+/g, '$', document, builder);
    this.processTag(comment, commentOffset, /@phpstan-assert-if-true\s+/g, null, document, builder);
    this.processTag(comment, commentOffset, /@phpstan-assert-if-false\s+/g, null, document, builder);

    // @template with optional bounds: @template T, @template T of Type
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

    // @phpstan-type AliasName Type
    const phpstanTypeRegex = /@phpstan-type\s+(\w+)\s+/g;
    let phpstanTypeMatch;
    while ((phpstanTypeMatch = phpstanTypeRegex.exec(comment)) !== null) {
      const typeStartOffset = phpstanTypeMatch.index + phpstanTypeMatch[0].length;
      const typeString = this.extractTypeString(comment.substring(typeStartOffset), null);
      if (typeString) {
        this.parseAndEmitTokens(typeString, commentOffset + typeStartOffset, document, builder);
      }
    }

    // @phpstan-import-type AliasName from Class
    // @phpstan-import-type AliasName from Class as NewName
    // Just highlight the "from Class" part
    const importTypeRegex = /@phpstan-import-type\s+\w+\s+from\s+/g;
    let importTypeMatch;
    while ((importTypeMatch = importTypeRegex.exec(comment)) !== null) {
      const typeStartOffset = importTypeMatch.index + importTypeMatch[0].length;
      const remaining = comment.substring(typeStartOffset);
      // Extract class name (stop at "as" or whitespace)
      const classMatch = remaining.match(/^(\\?[\w\\]+)/);
      if (classMatch) {
        this.parseAndEmitTokens(classMatch[1], commentOffset + typeStartOffset, document, builder);
      }
    }

    // @psalm-type AliasName = Type
    const psalmTypeRegex = /@psalm-type\s+(\w+)\s*=\s*/g;
    let psalmTypeMatch;
    while ((psalmTypeMatch = psalmTypeRegex.exec(comment)) !== null) {
      const typeStartOffset = psalmTypeMatch.index + psalmTypeMatch[0].length;
      const typeString = this.extractTypeString(comment.substring(typeStartOffset), null);
      if (typeString) {
        this.parseAndEmitTokens(typeString, commentOffset + typeStartOffset, document, builder);
      }
    }

    // @method [static] ReturnType methodName(ArgumentType $arg, ...)
    this.processMethodTags(comment, commentOffset, document, builder);
  }

  /**
   * Highlight variable name callback
   */
  private highlightVariable(match: RegExpExecArray, typeStr: string, offset: number, comment: string, commentOffset: number, document: vscode.TextDocument, builder: vscode.SemanticTokensBuilder): void {
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
  }

  /**
   * Highlight property name callback
   */
  private highlightProperty(match: RegExpExecArray, typeStr: string, offset: number, comment: string, commentOffset: number, document: vscode.TextDocument, builder: vscode.SemanticTokensBuilder): void {
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
  }

  /**
   * Process @method tags which have complex syntax
   * @method [static] ReturnType methodName(ArgType $arg = default)
   */
  private processMethodTags(comment: string, commentOffset: number, document: vscode.TextDocument, builder: vscode.SemanticTokensBuilder): void {
    // Match @method, optional "static", then return type, then method name, then parameters
    const methodRegex = /@method\s+(?:static\s+)?/g;
    let methodMatch;

    while ((methodMatch = methodRegex.exec(comment)) !== null) {
      const afterTag = comment.substring(methodMatch.index + methodMatch[0].length);

      // Extract return type (everything before method name with parenthesis)
      // Return type ends when we hit: methodName(
      const returnTypeMatch = afterTag.match(/^([^(]+?)\s+(\w+)\s*\(/);
      if (returnTypeMatch) {
        const returnType = returnTypeMatch[1].trim();
        const returnTypeOffset = methodMatch.index + methodMatch[0].length;

        // Parse return type
        if (this.isTypeString(returnType)) {
          this.parseAndEmitTokens(returnType, commentOffset + returnTypeOffset, document, builder);
        }

        // Extract and parse parameter types from the method signature
        const paramStart = returnTypeMatch.index! + returnTypeMatch[0].length - 1; // -1 for the (
        const remaining = afterTag.substring(paramStart);

        // Find the matching closing paren
        let parenDepth = 0;
        let paramEnd = 0;
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i] === '(') parenDepth++;
          else if (remaining[i] === ')') {
            parenDepth--;
            if (parenDepth === 0) {
              paramEnd = i;
              break;
            }
          }
        }

        if (paramEnd > 0) {
          const params = remaining.substring(1, paramEnd); // Inside parentheses
          // Parse each parameter: Type $name
          const paramMatches = params.matchAll(/([^,\s$]+)\s+\$\w+/g);
          for (const paramMatch of paramMatches) {
            const paramType = paramMatch[1].trim();
            const paramTypeOffset = methodMatch.index + methodMatch[0].length + paramStart + paramMatch.index!;
            if (this.isTypeString(paramType)) {
              this.parseAndEmitTokens(paramType, commentOffset + paramTypeOffset, document, builder);
            }
          }
        }
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
    callback?: (match: RegExpExecArray, typeString: string, offset: number, comment: string, commentOffset: number, document: vscode.TextDocument, builder: vscode.SemanticTokensBuilder) => void
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
          callback(match, typeString, typeStartOffset, comment, commentOffset, document, builder);
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
