import { pluginRegistry } from "./registry";
import { logger } from "@/lib/logger";
import type { PluginContext, PluginResult } from "./types";

export async function executePluginFunction(
  functionName: string,
  args: Record<string, unknown>,
  context: PluginContext
): Promise<PluginResult> {
  const result = pluginRegistry.getPluginByFunction(functionName);

  if (!result) {
    return {
      success: false,
      error: `No plugin found for function: ${functionName}`,
    };
  }

  try {
    return await result.plugin.execute(functionName, args, context);
  } catch (error) {
    logger.error(`Plugin execution error for ${functionName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Plugin execution failed";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

