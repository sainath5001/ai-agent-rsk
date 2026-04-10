import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidWalletAddress(address: string): boolean {
	const regex = /^(0x)?[0-9a-fA-F]{40}$/;

	return regex.test(address);
}

type TokenSearchCacheEntry = { address: string | null; expiresAtMs: number };
const tokenSearchCache = new Map<string, TokenSearchCacheEntry>();

export async function findToken(query: string): Promise<string | null> {
	try {
		const tokenLowerCase = query.toLowerCase();
		const cacheKey = tokenLowerCase;
		const now = Date.now();
		const cached = tokenSearchCache.get(cacheKey);
		if (cached && cached.expiresAtMs > now) {
			return cached.address;
		}

		const baseUrl =
			process.env.NEXT_PUBLIC_BLOCKSCOUT_API_BASE_URL?.trim() ||
			"https://rootstock-testnet.blockscout.com";

		const response = await fetch(
			`${baseUrl}/api/v2/tokens?q=${encodeURIComponent(tokenLowerCase)}&type=ERC-20`,
			{ headers: { accept: "application/json" } }
		);

		if (!response.ok) {
			throw new Error(`API call failed with status: ${response.status}`);
		}

		const data = await response.json();

		if (data.items && data.items.length > 0) {
			const address = typeof data.items[0]?.address === "string" ? data.items[0].address : null;
			const normalized = address && isValidWalletAddress(address) ? address : null;
			tokenSearchCache.set(cacheKey, { address: normalized, expiresAtMs: now + 5 * 60_000 });
			return normalized;
		}

		tokenSearchCache.set(cacheKey, { address: null, expiresAtMs: now + 60_000 });
		return null;
	} catch {
		return null;
	}
}