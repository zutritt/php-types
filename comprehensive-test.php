<?php

/**
 * COMPREHENSIVE PHPSTAN TAG TEST
 * Based on user's complete list of supported PHPDoc syntax
 */

/**
 * @template T
 * @template K of \My\Namespace\ArrayLike
 * @template U of int|array<int>
 *
 * @implements \My\Namespace\Interface
 * @require-implements \My\Namespace\Interface
 *
 * @extends \My\Namespace\BaseClass
 * @require-extends \My\Namespace\BaseClass
 *
 * @throws \My\Namespace\Exception<U>
 *
 * @return (U is int ? static : array<static>)
 * @return $this
 * @return template-type<T, ModelInterface, 'TChild'>
 * @return new<M[T]>
 * @return MyArray['bar']
 * @return never
 * @return never-return
 * @return never-returns
 * @return no-return
 *
 * @phpstan-type UserAddress array{street: string, city: string, zip: string}
 * @phpstan-import-type UserAddress from User
 * @phpstan-import-type UserAddress from User as DeliveryAddress
 *
 * @phpstan-assert BarService $object
 * @phpstan-assert !string $arg
 *
 * @phpstan-assert-if-true \stdClass $arg
 * @phpstan-assert-if-true T $object
 * @phpstan-assert-if-true !null $this->getName()
 *
 * @phpstan-self-out self<TValue|TItemValue>
 * @phpstan-this-out self<TValue|TItemValue>
 *
 * @deprecated
 * @not-deprecated
 * @phpstan-impure
 * @phpstan-pure
 * @immutable
 * @readonly
 *
 * @use AttributeTrait<array{foo?: string, bar?: 5|6|7, baz?: bool}>
 * @mixin \My\Namespace\BaseClass
 *
 * @method ReturnType instanceMethodName(ArgumentType $argumentName = 5)
 * @method static ReturnType staticMethodName(Argument1Type $argument1Name, Argument2Type $argument2Name)
 * @method static \Some\Return\Type|mixed test(\Closure|mixed|null $value = null, callable|null $callback = null, callable|null $default = null)
 * @method static \Some\Return\Type|mixed test2(\Closure|mixed|null $value = null, callable|null $callback = null, callable|null $default = null)
 * @method static \Some\Return\Type test3(string|array $param1, string|resource $param2 = '', string|null $param3 = null, array $param4 = [])
 * @see \Some\Namespace\Class::methodName()
 *
 * @phpstan-ignore variable.undefined
 * @phpstan-ignore variable.undefined, variable.undefined
 * @phpstan-ignore variable.undefined (Because we are lazy)
 *
 * @phpstan-ignore-next-line
 * @phpstan-ignore-line
 *
 * @param int $p
 * @param integer $p
 * @param positive-int $p
 * @param negative-int $p
 * @param non-positive-int $p
 * @param non-negative-int $p
 * @param non-zero-int $p
 * @param int<0, 100> $p
 * @param int<min, 100> $p
 * @param int<50, max> $p
 * @param int-mask<1, 2, 4> $p
 * @param int-mask-of<1|2|4> $p
 * @param int-mask-of<Foo::INT_*> $p
 * @param string $p
 * @param class-string $p
 * @param class-string<Foo> $p
 * @param callable-string $p
 * @param numeric-string $p
 * @param non-empty-string $p
 * @param non-falsy-string $p
 * @param truthy-string $p
 * @param literal-string $p
 * @param array-key $p
 * @param bool $p
 * @param boolean $p
 * @param true $p
 * @param false $p
 * @param null $p
 * @param float $p
 * @param double $p
 * @param scalar $p
 * @param array $p
 * @param array{'foo': int, "bar": string} $p
 * @param array{'foo': int, "bar"?: string} $p
 * @param array{int, int} $p
 * @param array{0: int, 1?: int} $p
 * @param array{foo: int, bar: string} $p
 * @param Type[] $p
 * @param array<Type> $p
 * @param array<int, Type> $p
 * @param non-empty-array<Type> $p
 * @param non-empty-array<int, Type> $p
 * @param list<Type> $p
 * @param non-empty-list<Type> $p
 * @param key-of<Type::ARRAY_CONST> $p
 * @param value-of<Type::ARRAY_CONST> $p
 * @param value-of<BackedEnum> $p
 * @param iterable $p
 * @param iterable<Type> $p
 * @param Collection<Type> $p
 * @param Collection<int, Type> $p
 * @param Collection|Type[] $p
 * @param callable $p
 * @param callable(int, int): string $p
 * @param callable(int, int=): string $p
 * @param callable(int $foo, string $bar): void $p
 * @param callable(string &$bar): mixed $p
 * @param callable(float ...$floats): (int|null) $p
 * @param callable(float...): (int|null) $p
 * @param Closure(int, int): string $p
 * @param pure-closure(int, int): string $p
 * @param pure-callable $p
 * @param pure-callable(int, int): string $p
 * @param-later-invoked-callable $p
 * @param-immediately-invoked-callable $p
 * @param-closure-this Bar $p
 * @param resource $p
 * @param closed-resource $p
 * @param open-resource $p
 * @param void $p
 * @param object $p
 * @param object{'foo': int, "bar": string} $p
 * @param object{'foo': int, "bar"?: string} $p
 * @param object{foo: int, bar?: string} $p
 * @param mixed $p
 * @param (Type1&Type2)|Type3 $p
 * @param self::SOME_* $p
 * @param-out int $p
 */
function everything()
{
    /**
     * @var string $xd
     */
    return 42;
}
