declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Buffer | Uint8Array;
    format: 'PNG' | 'JPEG';
    /** Solo para JPEG, 0-1 */
    quality?: number;
  }

  function convert(options: ConvertOptions): Promise<Uint8Array>;

  namespace convert {
    function all(options: ConvertOptions): Promise<Array<{ convert(): Promise<Uint8Array> }>>;
  }

  export = convert;
}
