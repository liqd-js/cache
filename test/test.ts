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
    const cache = new Cache<number>( 3, 3, 10000000, 5, 10000000000 );
    // console.assert(!cache.get( "a" ));
    cache.set("a", 1);
    // cache.print();
    console.log(cache.get("a"));
    // cache.get("a");
    // cache.print();
}

test_cache();