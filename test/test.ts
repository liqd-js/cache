// import sizeof from "../src/size";
import Cache from "../src/cache";

// function test_size()
// {
//     assert(sizeof({ a: 1 }) === 14)
//     assert(sizeof(123123) === 8);
//     assert(sizeof("1") === 6);
//     assert(sizeof([1, 2, 3]) === 24);
//     assert(sizeof([undefined, { a: 1 }, 1, "a"]) === 30);
// }

function test_cache()
{
    const cache = new Cache<number>(2, 2, 1000, 10, 10);
    cache.set("a", 1);
    cache.print();
    cache.get("a")
    cache.get("a")
    cache.set("b", 2);
    cache.get("b")
    cache.get("b")
    cache.print();
    cache.set("c", 3);
    cache.print();
    cache.set("d", 4);
    cache.print();
    cache.set("e", 5);
    cache.print();
    cache.set("f", 6);
    cache.print();
    cache.set("g", 7);
    cache.print();
}

test_cache();