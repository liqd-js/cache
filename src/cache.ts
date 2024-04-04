/*export default */class Cache<T>
{
    private data: Map<string,T>;

    constructor()
    {
        this.data = new Map();
    }

    public get( key: string ): T | undefined
    {
        return this.data.get( key );
    }

    public set( key: string, value: T )
    {
        this.data.set( key, value );
    }

    public delete( key: string )
    {
        this.data.delete( key );
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