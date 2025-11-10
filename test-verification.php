<?php

/**
 * SEMANTIC TOKEN VERIFICATION TEST FILE
 *
 * This file helps verify that semantic tokens are working correctly.
 *
 * HOW TO TEST:
 * 1. Press F5 to run the extension in debug mode
 * 2. Open this file in the Extension Development Host
 * 3. Open "Output" panel and select "PHP Doc Extended" channel
 * 4. Check that you see log messages like "provideDocumentSemanticTokens()"
 * 5. Use "Developer: Inspect Editor Tokens and Scopes" on types below
 *    - Semantic tokens will show scope: "type" or "class" or "keyword"
 *    - TextMate tokens will show scope: "keyword.other.type.php"
 *
 * WHAT TO LOOK FOR:
 * - If semantic tokens work: Scope should be just "type", "class", "keyword"
 * - If only TextMate works: Scope will be "keyword.other.type.php"
 */

// =============================================================================
// TEST 1: Simple types (both TextMate and semantic tokens can handle)
// =============================================================================

/** @param string $str */
function test1($str) {}

/** @return int */
function test2() {}

// =============================================================================
// TEST 2: Complex nested types (semantic tokens should handle better)
// =============================================================================

/** @param array{foo: int, bar: array{nested: string, deep: array{x: int}}} $complex */
function test3($complex) {}

/** @var Collection<array<string, list<array{id: int, name: string}>>> */
$deeplyNested = null;

// =============================================================================
// TEST 3: Types that TextMate grammar DEFINITELY can't handle properly
// These will look broken/partial with TextMate, but perfect with semantic tokens
// =============================================================================

/** @param callable(int, string): array{result: bool, data: array<string>} $callback */
function test4($callback) {}

/** @return ($size is positive-int ? non-empty-array<array{id: int}> : array) */
function test5($size) {}

/** @var array{user: object{id: int, meta: array{key: string, val: mixed}}} */
$superComplex = [];

// =============================================================================
// TEST 4: Visual markers - Look at these with "Inspect Editor Tokens"
// =============================================================================

/**
 * @param array<string> $simple        ← RIGHT-CLICK HERE, SELECT "Inspect Editor Tokens and Scopes"
 */
function inspectMe1($simple) {}

/**
 * @return array{foo: int}             ← RIGHT-CLICK HERE to inspect
 */
function inspectMe2() {}

// =============================================================================
// TEST 5: Single-line edge cases (our v2.0.1 fix)
// =============================================================================

/** @param array{a: int, b: string, c: array{x: int, y: int}} $data */
function singleLineFix($data) {}

/** @var callable(int, int=): array{success: bool, error?: string} */
$callableFix = null;

// =============================================================================
// DEBUGGING COMMANDS
// =============================================================================
// Run these in Command Palette (Ctrl+Shift+P / Cmd+Shift+P):
//
// 1. "Developer: Inspect Editor Tokens and Scopes"
//    - Click on a type in PHPDoc
//    - Look at the "semantic token type" section
//    - If semantic tokens work: You'll see entries like:
//      • semantic token type: type
//      • semantic token type: keyword
//      • semantic token type: class
//
// 2. "Developer: Force Retokenize"
//    - Forces VSCode to re-request tokens
//    - Check Output panel for new log messages
//
// 3. Output Panel: Select "PHP Doc Extended"
//    - Should show logs like:
//      [Call #1] provideDocumentSemanticTokens()
//      File: /path/to/test-verification.php
//      PHPDoc Comments: 10
//      Duration: 5ms
//
// 4. If you see NO logs in Output panel:
//    - Semantic tokens are NOT being called
//    - You're only seeing TextMate grammar highlighting
// =============================================================================

class VerificationClass {
    /** @var array{id: int, name: non-empty-string, tags: list<string>} */
    private $property;

    /**
     * @template T of \DateTimeInterface
     * @param class-string<T> $class
     * @return T
     */
    public function createDate($class) {
        return new $class();
    }

    /**
     * @param array{
     *   id: positive-int,
     *   name: non-empty-string,
     *   metadata: array<string, mixed>,
     *   settings: object{
     *     enabled: bool,
     *     options: array<string, scalar>
     *   }
     * } $config
     * @return array{success: bool, data?: array<mixed>}
     */
    public function complexMethod($config) {
        return ['success' => true];
    }
}

// =============================================================================
// EXPECTED RESULTS
// =============================================================================
//
// ✅ SEMANTIC TOKENS WORKING:
//    - Output panel shows "provideDocumentSemanticTokens()" logs
//    - "Inspect Editor Tokens" shows "semantic token type: ..."
//    - All nested types are highlighted correctly
//    - Complex types like callable signatures work perfectly
//
// ❌ ONLY TEXTMATE GRAMMAR:
//    - Output panel shows NOTHING (or only activation message)
//    - "Inspect Editor Tokens" shows only "keyword.other.type.php"
//    - Complex nested types may look broken or partially highlighted
//    - Some types stop highlighting at spaces
//
// =============================================================================
