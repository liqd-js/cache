import Heap from "@liqd-js/heap";

export default class CacheHeap<T,I=T> extends Heap<T,I>
{
    public randomTailItem(): T | void
    {
        if( this.data.length )
        {
            if( !this.sorted ){ this.sort_updated() }

            const tail_length = Math.ceil( Math.log2( this.data.length ));

            return this.data[this.data.length - 1 - Math.floor( Math.random() * tail_length )];
        }
    }
}