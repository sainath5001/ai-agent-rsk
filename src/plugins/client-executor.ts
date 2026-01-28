import { IPlugin, PluginContext, PluginResult } from "./types";
import { pluginRegistry } from "./registry";

export function registerClientPlugin(plugin: IPlugin): void {
  pluginRegistry.register(plugin);
}

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
    console.error(`Plugin execution error for ${functionName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Plugin execution failed";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

