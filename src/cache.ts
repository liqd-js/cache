import sizeof from "./size";
import CacheHeap from "./cache-heap";

type NonCachedValue = { id: string, size: number, seeks: Uint16Array };
type CachedValue<T> = NonCachedValue & { data: T };

export default class Cache<T>
{
    private index = 0;
    private readonly cached: CacheHeap<CachedValue<T>, string> = new CacheHeap<CachedValue<T>, string>( ( a, b ) => this.score(a) - this.score(b) );
    private readonly watched: CacheHeap<NonCachedValue, string> = new CacheHeap<NonCachedValue, string>( ( a, b ) => this.score(a) - this.score(b) );

    constructor(
        private readonly cacheSize: number,
        private readonly watchSize: number,
        private readonly length: number = 10,
        interval: number = 100_000
    )
    {
        setInterval(() =>
        {
            this.index = ( this.index + 1 ) % length;
            for( let item of [...this.cached.values(), ...this.watched.values()] )
            {
                item.seeks[this.index] = 0;
            }
        }, interval );
    }

    public print()
    {
        console.log( 'Cached:' )
        for( let item of this.cached.values() )
        {
            console.log( item.data );
        }

        console.log( 'Watched:' )
        for( let item of this.watched.values() )
        {
            console.log( item );
        }
    }

    public get( key: string ): T | void
    {
        const cached = this.cached.get( key );
        if( cached )
        {
            this.incrementSeek( cached.seeks );
            return cached.data;
        }

        const watched = this.watched.get( key );
        if ( watched )
        {
            this.incrementSeek( watched.seeks );
        }
    }

    public set( key: string, value: T )
    {
        const cached = this.cached.get( key );
        if ( cached )
        {
            this.incrementSeek( cached.seeks );
            cached.data = value;
            cached.size = sizeof( value );
        }

        if ( this.cached.size < this.cacheSize )
        {
            this.cached.push({ id: key, size: sizeof( value ), seeks: this.initSeek(), data: value });
        }

        let watched = this.watched.get( key );
        if ( watched || this.watched.size < this.watchSize )
        {
            watched = { id: key, size: sizeof( value ), seeks: this.initSeek() };
            this.incrementSeek( watched.seeks );

            const worst = this.cached.top();
            if ( worst && this.score(worst) < this.score(watched) )
            {
                this.watched.push( this.cached.pop()! );
                this.watched.delete( watched );
                this.cached.push({ ...watched, data: value });
            }
            return;
        }

        // TODO: ak je watched plna, vyhod random z poslednej vrstvy a pridaj novy
        const newElem = { id: key, size: sizeof( value ), seeks: this.initSeek() };
        const worst = this.watched.randomTailItem();
        if ( worst && this.score(worst) < this.score(newElem) )
        {
            this.watched.delete( worst );
            this.watched.push( newElem );
            this.incrementSeek( newElem.seeks );
        }
    }

    public delete( key: string )
    {
        const cached = this.cached.get( key );
        if ( cached )
        {
            this.cached.delete( cached );
        }

        const watched = this.watched.get( key );
        if ( watched )
        {
            this.watched.delete( watched );
        }
    }

    private initSeek()
    {
        const seek = new Uint16Array( this.length );

        for ( let i = 0; i < this.length; i++ )
        {
            seek[i] = 0;
        }

        return seek;
    }

    private incrementSeek( seek: Uint16Array )
    {
        if( seek[this.index] === 0xFFFF )
        {
            return;
        }

        seek[this.index]++;
    }

    private score( value: NonCachedValue | CachedValue<any> ): number
    {
        let score = 0;
        for ( let i = 0; i < this.length; i++ )
        {
            score += value.seeks[(this.length + this.index - i) % this.length];
        }
        return score;
    }
}

function bytesToSize( bytes: number )
{
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    if( bytes === 0 ){ return '0 Byte'; }

    const i = Math.floor( Math.log( bytes ) / Math.log( 1024 ) );

    return Math.round( bytes / Math.pow( 1024, i ) ) + ' ' + sizes[i];
}

setInterval(() => console.log( bytesToSize( process.memoryUsage.rss() )), 1000 );