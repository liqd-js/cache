import sizeof from "./size";
import CacheHeap from "./cache-heap";
import Queue from "@liqd-js/queue";

type WatchedValue = { id: string, size: number, seeks: Uint16Array };
type CachedValue<T> = WatchedValue & { data: T, stale?: Date };

export default class Cache<T>
{
    private index = 0;
    private readonly cached: CacheHeap<CachedValue<T>, string> = new CacheHeap<CachedValue<T>, string>( ( a, b ) => this.score(a) - this.score(b), i => i.id );
    private readonly watched: CacheHeap<WatchedValue, string> = new CacheHeap<WatchedValue, string>( (a, b ) => this.score(a) - this.score(b), i => i.id);
    private readonly stale?: Queue<CachedValue<T>> = undefined;

    constructor(
        public readonly cacheSize: number,
        public readonly watchSize: number,
        /** Number of seconds for which seek history is tracked */
        public readonly cacheTime: number = 300,
        /** Number of buckets */
        public readonly precision: number = 10,
        /** Expiration time of a record in seconds */
        public readonly staleTime?: number,
    )
    {
        if ( this.staleTime )
        {
            this.stale = new Queue();
        }

        setInterval(() =>
        {
            this.index = ( this.index + 1 ) % this.precision;
            for( let item of [...this.cached.values(), ...this.watched.values()] )
            {
                item.seeks[this.index] = 0;
            }
        }, this.cacheTime );
    }

    public get( key: string ): T | void
    {
        this.removeStale();

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
        this.removeStale();

        const cached = this.cached.get( key );
        if ( cached )
        {
            this.updateCached( cached, value, true );
            return;
        }

        const watched = this.watched.get( key );
        if ( watched )
        {
            const cached: CachedValue<T> = this.initCached( watched, value, true );
            if ( this.loadToCache( cached ) )
            {
                this.watched.delete( watched );
            }
        }

        const newElem: CachedValue<T> = this.createCached(key, value, true);
        if ( !this.loadToCache( newElem ) )
        {
            const { data, ...watched } = newElem;
            this.addToWatched(watched);
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

        // TODO: delete from stale
    }

    private createCached( key: string, data: T, incrementSeek: boolean = false ): CachedValue<T>
    {
        const elem = {
            id: key,
            size: sizeof( data ),
            seeks: this.initSeek(),
            stale: this.calculateStale(),
            data
        };

        incrementSeek && this.incrementSeek( elem.seeks );

        return elem;
    }

    private initCached( watched: WatchedValue, element: T, incrementSeek: boolean = false)
    {
        const cached: CachedValue<T> = { ...watched, stale: this.calculateStale(), data: element };
        incrementSeek && this.incrementSeek( cached.seeks );
        return cached;
    }

    private updateCached( cached: CachedValue<T>, element: T, incrementSeek: boolean = false)
    {
        cached.data = element;
        cached.size = sizeof( element );
        cached.stale = this.calculateStale();
        incrementSeek && this.incrementSeek( cached.seeks );

        if ( this.stale )
        {
            this.stale.delete( cached );
            this.stale.push( cached );
        }
    }

    private calculateStale()
    {
        return this.staleTime
            ? new Date( Date.now() + (this.staleTime || 10 * 365 * 24 * 60 * 60) * 1000 )
            : undefined;
    }

    private loadToCache( element: CachedValue<T> )
    {
        if ( this.cached.size < this.cacheSize )
        {
            this.cached.push( element );
            this.stale && this.stale.push( element );
            return true;
        }

        const worst = this.cached.top();
        if ( worst && this.score( worst ) < this.score( element ) )
        {
            this.cached.delete( worst );
            this.cached.push( element );
            this.stale && this.stale.delete( worst );
            this.stale && this.stale.push( element );
            return true;
        }

        return false;
    }

    private addToWatched( element: T | WatchedValue )
    {
        if ( this.watched.size < this.watchSize )
        {
            this.watched.push( element as WatchedValue );
            return true;
        }

        const worst = this.watched.randomTailItem();
        if ( worst && this.score( worst ) < this.score( element as WatchedValue ) )
        {
            this.watched.delete( worst );
            this.watched.push( element as WatchedValue );
            return true;
        }

        return false;
    }

    private removeStale()
    {
        if ( !this.stale )
        {
            return;
        }

        let stale = this.stale.top();
        while( stale && stale.stale! < new Date() )
        {
            this.stale.pop();

            this.cached.delete( stale );

            this.addToWatched({ id: stale.id, size: stale.size, seeks: this.initSeek() });

            stale = this.stale.top();
        }
    }

    private initSeek()
    {
        const seek = new Uint16Array( this.precision );

        for ( let i = 0; i < this.precision; i++ )
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

    private score( value: WatchedValue | CachedValue<any> ): number
    {
        let score = 0;
        for ( let i = 0; i < this.precision; i++ )
        {
            score += value.seeks[(this.precision + this.index - i) % this.precision] * (1 << i);
        }
        return score;
    }
}