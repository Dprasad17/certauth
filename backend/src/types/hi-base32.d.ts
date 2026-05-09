declare module 'hi-base32' {
    export function encode(input: string | Buffer | ArrayBuffer | Uint8Array, padding?: boolean): string;
    export function decode(input: string, padding?: boolean): string;
}
