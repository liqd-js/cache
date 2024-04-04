import sizeof from "../src/size";
import assert = require("node:assert");

function test()
{
    assert(sizeof({ a: 1 }) === 14)
    assert(sizeof(123123) === 8);
    assert(sizeof("1") === 6);
    assert(sizeof([1, 2, 3]) === 24);
    assert(sizeof([undefined, { a: 1 }, 1, "a"]) === 30);
}

test();