
import { loadPlugins } from "./loader";
import { transferPlugin } from "./builtin/transfer";
import { balancePlugin } from "./builtin/balance";
import { pluginRegistry } from "./registry";

export async function initializePlugins() {
  await loadPlugins([transferPlugin, balancePlugin]);
  
  const clientExecutor = await import("./client-executor");
  clientExecutor.registerClientPlugin(transferPlugin);
  clientExecutor.registerClientPlugin(balancePlugin);
}
export { pluginRegistry } from "./registry";
export { loadPlugins, loadPlugin, unloadPlugin, reloadPlugin } from "./loader";
export type {
  IPlugin,
  PluginMetadata,
  PluginFunction,
  PluginContext,
  PluginResult,
  PluginRegistration,
} from "./types";

