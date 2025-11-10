/**
 * Type definitions for PHPDoc type parsing and semantic token generation
 */

import * as vscode from 'vscode';

/**
 * Represents a parsed type token with its position in the document
 */
export interface TypeToken {
  /** The text content of the token */
  text: string;
  /** The semantic token type */
  tokenType: SemanticTokenType;
  /** The semantic token modifiers */
  tokenModifiers: SemanticTokenModifier[];
  /** Start offset in the document */
  startOffset: number;
  /** End offset in the document */
  endOffset: number;
}

/**
 * Semantic token types supported by the extension
 */
export enum SemanticTokenType {
  Type = 'type',
  Class = 'class',
  Interface = 'interface',
  Parameter = 'parameter',
  Property = 'property',
  Keyword = 'keyword',
  Operator = 'operator',
  Variable = 'variable',
}

/**
 * Semantic token modifiers
 */
export enum SemanticTokenModifier {
  Declaration = 'declaration',
  Readonly = 'readonly',
  Static = 'static',
  Abstract = 'abstract',
}

/**
 * Token type legend for VSCode semantic highlighting
 */
export const TOKEN_TYPES: string[] = [
  SemanticTokenType.Type,
  SemanticTokenType.Class,
  SemanticTokenType.Interface,
  SemanticTokenType.Parameter,
  SemanticTokenType.Property,
  SemanticTokenType.Keyword,
  SemanticTokenType.Operator,
  SemanticTokenType.Variable,
];

/**
 * Token modifier legend for VSCode semantic highlighting
 */
export const TOKEN_MODIFIERS: string[] = [
  SemanticTokenModifier.Declaration,
  SemanticTokenModifier.Readonly,
  SemanticTokenModifier.Static,
  SemanticTokenModifier.Abstract,
];

/**
 * PHPStan/PHPDoc keyword types
 */
export const PHPDOC_KEYWORDS = new Set([
  // Basic types
  'int', 'integer', 'string', 'bool', 'boolean', 'float', 'double',
  'array', 'object', 'resource', 'null', 'void', 'never',
  'mixed', 'scalar', 'numeric', 'callable', 'iterable',

  // PHPStan specific types
  'non-empty-string', 'non-falsy-string', 'truthy-string',
  'literal-string', 'numeric-string', 'callable-string',
  'class-string', 'trait-string', 'interface-string', 'enum-string',

  // Integer types
  'positive-int', 'negative-int', 'non-positive-int', 'non-negative-int',
  'int-mask', 'int-mask-of',

  // Array types
  'non-empty-array', 'non-empty-list', 'array-key', 'list',
  'key-of', 'value-of',

  // Callable types
  'pure-callable', 'closure',

  // Special types
  'true', 'false', 'self', 'static', 'parent', '$this',

  // Type modifiers
  'non-empty', 'empty',
]);
