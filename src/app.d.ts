// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	var process: {
		cwd(): string;
		env: Record<string, string | undefined>;
	};

	interface Buffer extends Uint8Array {
		readUInt32LE(offset: number): number;
		readUInt16LE(offset: number): number;
		toString(encoding?: string, start?: number, end?: number): string;
		subarray(start?: number, end?: number): Buffer;
	}

	var Buffer: {
		from(str: string, encoding?: string): Buffer;
	};
}

declare module 'node:fs' {
	export function existsSync(path: string): boolean;
	export function readFileSync(path: string): Buffer;
	export function readdirSync(path: string): string[];
	export function statSync(path: string): { mtimeMs: number; size: number };
}

declare module 'node:path' {
	export function resolve(...paths: string[]): string;
	export function join(...paths: string[]): string;
}

declare module 'node:zlib' {
	export function inflateRawSync(buf: Uint8Array): Buffer;
	export function gzipSync(buf: Uint8Array): Buffer;
}

export {};
