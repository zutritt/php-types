<?php

// Edge Case Tests for PHPDoc Type Parsing

/**
 * Multi-line PHPDoc block (baseline - should work)
 * @param array<string, int> $data
 * @return Collection<array<int>>
 */
function multiLine($data) {}

// EDGE CASE 1: Single-line with complex array shape
/** @param array{foo: int, bar: string} $data */
function singleLineArrayShape($data) {}

// EDGE CASE 2: Single-line with nested array shape
/** @param array{user: array{id: int, name: string}} $data */
function singleLineNestedArrayShape($data) {}

// EDGE CASE 3: Single-line with callable signature
/** @param callable(int, string): bool $callback */
function singleLineCallable($callback) {}

// EDGE CASE 4: Single-line with callable with optional params
/** @param callable(int, int=): void $fn */
function singleLineCallableOptional($fn) {}

// EDGE CASE 5: Single-line object shape
/** @return object{x: int, y: int, label?: string} */
function singleLineObjectShape() {}

// EDGE CASE 6: Single-line with description after type
/** @return array{foo: int, bar: string} Returns the data structure */
function singleLineWithDescription() {}

// EDGE CASE 7: Single-line with complex generics
/** @var Collection<array<string, list<int>>> */
$complexGenerics = null;

// EDGE CASE 8: Single-line with union containing spaces
/** @param int|string|array{key: string} $mixed */
function singleLineUnion($mixed) {}

// EDGE CASE 9: Single-line with intersection
/** @param Countable&Traversable $collection */
function singleLineIntersection($collection) {}

// EDGE CASE 10: Single-line ending with */  (no description)
/** @return array{id: int, data: array<string>} */
function singleLineNoDescription() {}

// EDGE CASE 11: Quoted keys in array shape
/** @var array{'foo': int, "bar"?: string} */
$quotedKeys = [];

// EDGE CASE 12: PHPStan-specific types
/** @var non-empty-array<positive-int> */
$phpstanTypes = [];

// EDGE CASE 13: Class string generic
/** @param class-string<\Exception> $exceptionClass */
function singleLineClassString($exceptionClass) {}

// EDGE CASE 14: Conditional type (complex!)
/** @return ($size is positive-int ? non-empty-array : array) */
function conditionalType($size) {}

// EDGE CASE 15: Integer range
/** @param int<0, 100> $percentage */
function integerRange($percentage) {}

// Multi-line edge cases

/**
 * @param array{
 *   id: int,
 *   name: string,
 *   data: array<string, mixed>
 * } $config
 */
function multiLineArrayShape($config) {}

/**
 * @param callable(
 *   int $a,
 *   string $b
 * ): bool $validator
 */
function multiLineCallable($validator) {}

class TestClass {
    /** @var array{id: int, name: string} */
    private $property;

    /** @return object{x: int, y: int} */
    public function getPoint() {}

    /**
     * @template T of \DateTime
     * @param class-string<T> $class
     * @return T
     */
    public function createDate($class) {}
}
