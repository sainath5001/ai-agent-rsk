import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidWalletAddress(address: string): boolean {
	const regex = /^(0x)?[0-9a-fA-F]{40}$/;

	return regex.test(address);
}

export async function findToken(query: string): Promise<string | null> {
	try {
		const tokenLowerCase = query.toLowerCase();

		const response = await fetch(
			`https://rootstock-testnet.blockscout.com/api/v2/tokens?q=${encodeURIComponent(tokenLowerCase)}&type=ERC-20`
		);

		if (!response.ok) {
			throw new Error(`API call failed with status: ${response.status}`);
		}

		const data = await response.json();

		if (data.items && data.items.length > 0) {
			return data.items[0].address;
		}

		return null;
	} catch {
		return null;
	}
}