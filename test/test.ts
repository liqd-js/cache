import sizeof from "../src/size";
import Cache from "../src/cache";
import assert = require("node:assert");

const timeout = ( timeout: number ) => new Promise( resolve => setTimeout( resolve, timeout ));

function test_size()
{
    assert(sizeof({ a: 1 }) === 14)
    assert(sizeof(123123) === 8);
    assert(sizeof("1") === 6);
    assert(sizeof([1, 2, 3]) === 24);
    assert(sizeof([undefined, { a: 1 }, 1, "a"]) === 30);
}

function test_basic_cache()
{
    const cache = new Cache<number>( { maxItems: 3, /*maxSize: 1000000000,*/ staleTime: 3 } );
    cache.set("a", 1);
    console.log({ memory: cache.memory(), utilization: cache.utilization() });
    cache.get("a");
    cache.get("a");
    cache.set("b", 2);
    console.log({ memory: cache.memory(), utilization: cache.utilization() });
    cache.set("c", 3);
    console.log({ memory: cache.memory(), utilization: cache.utilization() });
    cache.set("d", 4);
    console.log({ memory: cache.memory(), utilization: cache.utilization() });
    assert.equal(cache.get("d"), undefined);
    cache.set("d", 5);
    assert.equal(cache.get("d"), 5);
}

async function test_stale()
{
    const cache = new Cache<number>( { maxItems: 3, staleTime: 3 } );
    cache.set("a", 1);
    await timeout(1000);
    cache.set("b", 2);
    await timeout(1000);
    cache.set("c", 3);

    assert.equal(cache.get("a"), 1);
    assert.equal(cache.get("b"), 2);
    assert.equal(cache.get("c"), 3);

    await timeout(1000);
    assert.equal(cache.get("a"), undefined);
    assert.equal(cache.get("b"), 2);
    assert.equal(cache.get("c"), 3);

    cache.set("a", 1);

    await timeout(1000);
    assert.equal(cache.get("a"), 1);
    assert.equal(cache.get("b"), undefined);
    assert.equal(cache.get("c"), 3);

    await timeout(1000);
    assert.equal(cache.get("a"), 1);
    assert.equal(cache.get("b"), undefined);
    assert.equal(cache.get("c"), undefined);
}

test_size();
test_basic_cache();
test_stale().then(() => process.exit(0));