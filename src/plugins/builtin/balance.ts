
import { IPlugin, PluginMetadata, PluginFunction, PluginContext, PluginResult } from "../types";
import { getBalance, readContract } from "@wagmi/core";
import { erc20Abi, checksumAddress, isAddress, formatEther } from "viem";
import { findToken } from "@/lib/utils";

const metadata: PluginMetadata = {
  name: "balance",
  version: "1.0.0",
  description: "Check token balance for an address",
  author: "Rootstock AI Agent",
};

const functions: PluginFunction[] = [
  {
    name: "balance",
    description: "Check token balance for an address",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Wallet address to check (defaults to user's wallet if empty)",
        },
        token1: {
          type: "string",
          description: "Token symbol to check balance for (e.g., TRBTC, DOC, RIF)",
        },
      },
      required: ["token1"],
    },
  },
];

export const balancePlugin: IPlugin = {
  metadata,
  functions,

  async execute(functionName: string, args: Record<string, unknown>, context: PluginContext): Promise<PluginResult> {
    if (functionName !== "balance") {
      return {
        success: false,
        error: `Unknown function: ${functionName}`,
      };
    }

    try {
      const token1 = typeof args.token1 === "string" ? args.token1 : undefined;
      const address = typeof args.address === "string" ? args.address : undefined;

      if (!token1) {
        return {
          success: false,
          error: "Missing required parameter: token1",
        };
      }

      const tokenAdd =
        token1.toLowerCase() === "trbtc"
          ? "trbtc"
          : await findToken(token1);

      if (!tokenAdd && token1.toLowerCase() !== "trbtc") {
        return {
          success: false,
          error: "Token not found",
        };
      }

      const acc = address && isAddress(address) ? address : context.address;

      if (!acc) {
        return {
          success: false,
          error: "No wallet address available",
        };
      }

      let balance;

      if (tokenAdd === "trbtc") {
        const queryBalance = await getBalance(context.config, {
          address: acc as `0x${string}`,
        });

        balance = {
          displayValue: Number(formatEther(queryBalance.value)),
          symbol: "tRBTC",
        };
      } else {
        const queryBalance = await readContract(context.config, {
          abi: erc20Abi,
          address: checksumAddress(tokenAdd as `0x${string}`) as `0x${string}`,
          functionName: "balanceOf",
          args: [acc as `0x${string}`],
        });

        balance = {
          displayValue: Number(formatEther(queryBalance as bigint)),
          symbol: token1 as string,
        };
      }

      return {
        success: true,
        data: balance,
      };
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch balance";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

