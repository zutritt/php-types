/**
 * PHPDoc type parser using @rightcapital/phpdoc-parser
 * Wraps the parser library and provides type token extraction
 */

import {
  Lexer,
  TokenIterator,
  ConstExprParser,
  TypeParser,
} from '@rightcapital/phpdoc-parser';
import { TypeToken, SemanticTokenType, PHPDOC_KEYWORDS } from './types';

/**
 * Parses PHPDoc type strings and extracts semantic tokens
 */
export class PhpDocTypeParser {
  private readonly lexer: Lexer;
  private readonly constExprParser: ConstExprParser;
  private readonly typeParser: TypeParser;

  constructor() {
    this.lexer = new Lexer();
    this.constExprParser = new ConstExprParser();
    this.typeParser = new TypeParser(this.constExprParser);
  }

  /**
   * Parse a type string and extract tokens
   * @param typeString The type string to parse (e.g., "array<string, int>")
   * @param baseOffset The starting offset in the document
   * @returns Array of type tokens with positions
   */
  public parseType(typeString: string, baseOffset: number): TypeToken[] {
    const tokens: TypeToken[] = [];

    try {
      // Tokenize the type string
      const lexerTokens = this.lexer.tokenize(typeString);
      const tokenIterator = new TokenIterator(lexerTokens);

      // Parse into AST
      const typeNode = this.typeParser.parse(tokenIterator);

      // Walk the AST and extract tokens
      this.walkTypeNode(typeNode, typeString, baseOffset, tokens);
    } catch (error) {
      // If parsing fails, fall back to simple keyword extraction
      this.extractKeywords(typeString, baseOffset, tokens);
    }

    return tokens;
  }

  /**
   * Walk the type AST and extract semantic tokens
   */
  private walkTypeNode(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    if (!node) {
      return;
    }

    const nodeType = node.constructor.name;

    switch (nodeType) {
      case 'IdentifierTypeNode':
        this.handleIdentifierType(node, sourceText, baseOffset, tokens);
        break;

      case 'GenericTypeNode':
        this.handleGenericType(node, sourceText, baseOffset, tokens);
        break;

      case 'UnionTypeNode':
      case 'IntersectionTypeNode':
        this.handleCompositeType(node, sourceText, baseOffset, tokens);
        break;

      case 'ArrayTypeNode':
        this.handleArrayType(node, sourceText, baseOffset, tokens);
        break;

      case 'ArrayShapeNode':
        this.handleArrayShape(node, sourceText, baseOffset, tokens);
        break;

      case 'ObjectShapeNode':
        this.handleObjectShape(node, sourceText, baseOffset, tokens);
        break;

      case 'CallableTypeNode':
        this.handleCallableType(node, sourceText, baseOffset, tokens);
        break;

      case 'NullableTypeNode':
        this.handleNullableType(node, sourceText, baseOffset, tokens);
        break;

      case 'ThisTypeNode':
        this.addToken('$this', SemanticTokenType.Keyword, baseOffset, tokens);
        break;

      default:
        // Handle other node types generically
        this.handleGenericNode(node, sourceText, baseOffset, tokens);
        break;
    }
  }

  /**
   * Handle identifier type nodes (e.g., "int", "string", "MyClass")
   */
  private handleIdentifierType(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    const typeName = node.name;

    // Determine token type based on the identifier
    let tokenType: SemanticTokenType;

    if (PHPDOC_KEYWORDS.has(typeName.toLowerCase())) {
      tokenType = SemanticTokenType.Keyword;
    } else if (typeName[0] === typeName[0].toUpperCase()) {
      // Capitalized = likely a class name
      tokenType = SemanticTokenType.Class;
    } else {
      tokenType = SemanticTokenType.Type;
    }

    // Find position in source text
    const position = this.findTypePosition(typeName, sourceText);
    if (position >= 0) {
      this.addToken(typeName, tokenType, baseOffset + position, tokens);
    }
  }

  /**
   * Handle generic type nodes (e.g., "Collection<T>")
   */
  private handleGenericType(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    // Handle the base type
    if (node.type) {
      this.walkTypeNode(node.type, sourceText, baseOffset, tokens);
    }

    // Handle generic parameters
    if (node.genericTypes && Array.isArray(node.genericTypes)) {
      for (const genericType of node.genericTypes) {
        this.walkTypeNode(genericType, sourceText, baseOffset, tokens);
      }
    }

    // Add angle brackets as operators
    this.addOperatorTokens(sourceText, baseOffset, tokens, ['<', '>']);
  }

  /**
   * Handle composite type nodes (union and intersection)
   */
  private handleCompositeType(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    const isUnion = node.constructor.name === 'UnionTypeNode';
    const operator = isUnion ? '|' : '&';

    if (node.types && Array.isArray(node.types)) {
      for (const type of node.types) {
        this.walkTypeNode(type, sourceText, baseOffset, tokens);
      }
    }

    // Add operators
    this.addOperatorTokens(sourceText, baseOffset, tokens, [operator]);
  }

  /**
   * Handle array type nodes
   */
  private handleArrayType(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    // Handle the element type
    if (node.type) {
      this.walkTypeNode(node.type, sourceText, baseOffset, tokens);
    }

    // Add array keyword if present
    const arrayPos = sourceText.indexOf('array');
    if (arrayPos >= 0) {
      this.addToken('array', SemanticTokenType.Keyword, baseOffset + arrayPos, tokens);
    }

    this.addOperatorTokens(sourceText, baseOffset, tokens, ['[', ']']);
  }

  /**
   * Handle array shape nodes
   */
  private handleArrayShape(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    // Add 'array' keyword
    const arrayPos = sourceText.indexOf('array');
    if (arrayPos >= 0) {
      this.addToken('array', SemanticTokenType.Keyword, baseOffset + arrayPos, tokens);
    }

    // Handle items
    if (node.items && Array.isArray(node.items)) {
      for (const item of node.items) {
        if (item.keyName) {
          this.addToken(item.keyName.toString(), SemanticTokenType.Property, baseOffset, tokens);
        }
        if (item.valueType) {
          this.walkTypeNode(item.valueType, sourceText, baseOffset, tokens);
        }
      }
    }

    this.addOperatorTokens(sourceText, baseOffset, tokens, ['{', '}', ':', ',', '?']);
  }

  /**
   * Handle object shape nodes
   */
  private handleObjectShape(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    // Add 'object' keyword
    const objectPos = sourceText.indexOf('object');
    if (objectPos >= 0) {
      this.addToken('object', SemanticTokenType.Keyword, baseOffset + objectPos, tokens);
    }

    // Handle items similar to array shapes
    if (node.items && Array.isArray(node.items)) {
      for (const item of node.items) {
        if (item.keyName) {
          this.addToken(item.keyName.toString(), SemanticTokenType.Property, baseOffset, tokens);
        }
        if (item.valueType) {
          this.walkTypeNode(item.valueType, sourceText, baseOffset, tokens);
        }
      }
    }

    this.addOperatorTokens(sourceText, baseOffset, tokens, ['{', '}', ':', ',', '?']);
  }

  /**
   * Handle callable type nodes
   */
  private handleCallableType(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    // Add 'callable' keyword
    const callablePos = sourceText.indexOf('callable');
    if (callablePos >= 0) {
      this.addToken('callable', SemanticTokenType.Keyword, baseOffset + callablePos, tokens);
    }

    // Handle parameters
    if (node.parameters && Array.isArray(node.parameters)) {
      for (const param of node.parameters) {
        if (param.type) {
          this.walkTypeNode(param.type, sourceText, baseOffset, tokens);
        }
      }
    }

    // Handle return type
    if (node.returnType) {
      this.walkTypeNode(node.returnType, sourceText, baseOffset, tokens);
    }

    this.addOperatorTokens(sourceText, baseOffset, tokens, ['(', ')', ':', ',', '=', '...', '&']);
  }

  /**
   * Handle nullable type nodes
   */
  private handleNullableType(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    if (node.type) {
      this.walkTypeNode(node.type, sourceText, baseOffset, tokens);
    }

    this.addOperatorTokens(sourceText, baseOffset, tokens, ['?', '|', 'null']);
  }

  /**
   * Generic handler for unknown node types
   */
  private handleGenericNode(node: any, sourceText: string, baseOffset: number, tokens: TypeToken[]): void {
    // Try to extract any child types
    for (const key in node) {
      const value = node[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object') {
              this.walkTypeNode(item, sourceText, baseOffset, tokens);
            }
          }
        } else {
          this.walkTypeNode(value, sourceText, baseOffset, tokens);
        }
      }
    }
  }

  /**
   * Extract keywords from type string as fallback when parsing fails
   */
  private extractKeywords(typeString: string, baseOffset: number, tokens: TypeToken[]): void {
    const words = typeString.split(/[\s<>|&\[\]\(\)\{\},:\?]+/);

    for (const word of words) {
      if (word && PHPDOC_KEYWORDS.has(word.toLowerCase())) {
        const position = typeString.indexOf(word);
        if (position >= 0) {
          this.addToken(word, SemanticTokenType.Keyword, baseOffset + position, tokens);
        }
      }
    }
  }

  /**
   * Find the position of a type name in the source text
   */
  private findTypePosition(typeName: string, sourceText: string): number {
    // Simple indexOf - could be improved with more context-aware search
    return sourceText.indexOf(typeName);
  }

  /**
   * Add operator tokens for common operators
   */
  private addOperatorTokens(sourceText: string, baseOffset: number, tokens: TypeToken[], operators: string[]): void {
    for (const operator of operators) {
      let pos = 0;
      while ((pos = sourceText.indexOf(operator, pos)) >= 0) {
        // Check if we already have a token at this position
        const existingToken = tokens.find(t => t.startOffset === baseOffset + pos);
        if (!existingToken) {
          this.addToken(operator, SemanticTokenType.Operator, baseOffset + pos, tokens);
        }
        pos += operator.length;
      }
    }
  }

  /**
   * Add a token to the tokens array
   */
  private addToken(text: string, tokenType: SemanticTokenType, offset: number, tokens: TypeToken[]): void {
    tokens.push({
      text,
      tokenType,
      tokenModifiers: [],
      startOffset: offset,
      endOffset: offset + text.length,
    });
  }
}
