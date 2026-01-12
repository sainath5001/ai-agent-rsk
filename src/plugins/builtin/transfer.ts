/**
 * Built-in Transfer Plugin
 * 
 * Handles token transfers on Rootstock testnet.
 */

import { IPlugin, PluginMetadata, PluginFunction, PluginContext, PluginResult } from "../types";
import { sendTransaction, writeContract } from "@wagmi/core";
import { erc20Abi, parseEther } from "viem";
import { findToken } from "@/lib/utils";
import { BLOCK_EXPLORER_URL } from "@/lib/contants";

const metadata: PluginMetadata = {
  name: "transfer",
  version: "1.0.0",
  description: "Transfer tokens from the user's wallet to another address",
  author: "Rootstock AI Agent",
};

const functions: PluginFunction[] = [
  {
    name: "transfer",
    description: "Transfer tokens from the user's wallet to another address",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Recipient wallet address",
        },
        token1: {
          type: "string",
          description: "Token symbol to transfer (e.g., TRBTC, DOC, RIF)",
        },
        amount: {
          type: "number",
          description: "Amount of tokens to transfer",
        },
      },
      required: ["address", "token1", "amount"],
    },
  },
];

export const transferPlugin: IPlugin = {
  metadata,
  functions,

  async execute(functionName: string, args: Record<string, unknown>, context: PluginContext): Promise<PluginResult> {
    if (functionName !== "transfer") {
      return {
        success: false,
        error: `Unknown function: ${functionName}`,
      };
    }

    try {
      const address = typeof args.address === "string" ? args.address : undefined;
      const token1 = typeof args.token1 === "string" ? args.token1 : undefined;
      const amount = typeof args.amount === "number" ? args.amount : undefined;

      if (!address || !token1 || amount === undefined) {
        return {
          success: false,
          error: "Missing required parameters: address, token1, amount",
        };
      }

      const tokenAddress =
        token1.toLowerCase() === "trbtc"
          ? "trbtc"
          : await findToken(token1);

      if (!tokenAddress) {
        return {
          success: false,
          error: "Token not found",
        };
      }

      let transactionHash: string;

      if (tokenAddress === "trbtc") {
        transactionHash = await sendTransaction(context.config as any, {
          to: address as `0x${string}`,
          value: parseEther(amount.toString()),
        });
      } else {
        transactionHash = await writeContract(context.config as any, {
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "transfer",
          args: [address as `0x${string}`, BigInt(Math.floor(amount))],
        });
      }

      return {
        success: true,
        data: {
          transactionHash,
          explorerUrl: `${BLOCK_EXPLORER_URL}${transactionHash}`,
        },
      };
    } catch (error) {
      console.error("Transfer failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transfer failed";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

