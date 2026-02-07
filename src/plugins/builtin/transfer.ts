
import { IPlugin, PluginMetadata, PluginFunction, PluginContext, PluginResult } from "../types";
import { sendTransaction, writeContract, readContract } from "@wagmi/core";
import { erc20Abi, parseEther, parseUnits, isAddress } from "viem";
import { findToken, isValidWalletAddress } from "@/lib/utils";
import { BLOCK_EXPLORER_URL } from "@/lib/constants";
import { logger } from "@/lib/logger";

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

      if (!isValidWalletAddress(address) || !isAddress(address)) {
        return {
          success: false,
          error: "Invalid wallet address",
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

      if (tokenAddress !== "trbtc") {
        try {
          const tokenContract = tokenAddress as `0x${string}`;
          await Promise.all([
            readContract(context.config, {
              abi: erc20Abi,
              address: tokenContract,
              functionName: "name",
            }),
            readContract(context.config, {
              abi: erc20Abi,
              address: tokenContract,
              functionName: "symbol",
            }),
            readContract(context.config, {
              abi: erc20Abi,
              address: tokenContract,
              functionName: "decimals",
            }),
          ]);
        } catch (error) {
          return {
            success: false,
            error: "Invalid ERC20 contract address",
          };
        }
      }

      let transactionHash: string;

      if (tokenAddress === "trbtc") {
        transactionHash = await sendTransaction(context.config, {
          to: address as `0x${string}`,
          value: parseEther(amount.toString()),
        });
      } else {
        const decimals = await readContract(context.config, {
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "decimals",
        });
        
        const tokenAmount = parseUnits(amount.toString(), Number(decimals));
        transactionHash = await writeContract(context.config, {
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "transfer",
          args: [address as `0x${string}`, tokenAmount],
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
      logger.error("Transfer failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transfer failed";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

