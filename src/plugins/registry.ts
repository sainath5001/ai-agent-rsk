import { IPlugin, PluginRegistration, PluginContext } from "./types";
import { logger } from "@/lib/logger";

class PluginRegistry {
  private plugins: Map<string, PluginRegistration> = new Map();
  private context: PluginContext | null = null;

  register(plugin: IPlugin): void {
    if (this.plugins.has(plugin.metadata.name)) {
      logger.warn(
        `Plugin ${plugin.metadata.name} is already registered. Overwriting...`
      );
    }

    const registration: PluginRegistration = {
      plugin,
      enabled: true,
      loadedAt: new Date(),
    };

    this.plugins.set(plugin.metadata.name, registration);

    if (this.context && plugin.init) {
      const initResult = plugin.init(this.context);
      if (initResult instanceof Promise) {
        initResult.catch((error) => {
          logger.error(`Failed to initialize plugin ${plugin.metadata.name}:`, error);
        });
      }
    }

    logger.info(`Plugin registered: ${plugin.metadata.name} v${plugin.metadata.version}`);
  }

  unregister(pluginName: string): void {
    const registration = this.plugins.get(pluginName);
    if (registration) {
      if (registration.plugin.cleanup) {
        const cleanupResult = registration.plugin.cleanup();
        if (cleanupResult instanceof Promise) {
          cleanupResult.catch((error: unknown) => {
            logger.error(`Failed to cleanup plugin ${pluginName}:`, error);
          });
        }
      }
      this.plugins.delete(pluginName);
      logger.info(`Plugin unregistered: ${pluginName}`);
    }
  }

  get(pluginName: string): IPlugin | undefined {
    const registration = this.plugins.get(pluginName);
    return registration?.enabled ? registration.plugin : undefined;
  }

  getPluginByFunction(functionName: string): { plugin: IPlugin; functionName: string } | null {
    for (const registration of this.plugins.values()) {
      if (!registration.enabled) continue;

      const hasFunction = registration.plugin.functions.some(
        (fn) => fn.name === functionName
      );
      if (hasFunction) {
        return { plugin: registration.plugin, functionName };
      }
    }
    return null;
  }

  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values())
      .filter((reg) => reg.enabled)
      .map((reg) => reg.plugin);
  }

  getAllFunctions(): Array<{ plugin: string; function: unknown }> {
    const functions: Array<{ plugin: string; function: unknown }> = [];

    for (const registration of this.plugins.values()) {
      if (!registration.enabled) continue;

      for (const fn of registration.plugin.functions) {
        functions.push({
          plugin: registration.plugin.metadata.name,
          function: {
            type: "function",
            function: {
              name: fn.name,
              description: fn.description,
              parameters: fn.parameters,
            },
          },
        });
      }
    }

    return functions;
  }

  setContext(context: PluginContext): void {
    this.context = context;

    for (const registration of this.plugins.values()) {
      if (registration.plugin.init) {
        const initResult = registration.plugin.init(context);
        if (initResult instanceof Promise) {
          initResult.catch((error) => {
            logger.error(
              `Failed to initialize plugin ${registration.plugin.metadata.name}:`,
              error
            );
          });
        }
      }
    }
  }

  getContext(): PluginContext | null {
    return this.context;
  }

  setEnabled(pluginName: string, enabled: boolean): void {
    const registration = this.plugins.get(pluginName);
    if (registration) {
      registration.enabled = enabled;
      logger.info(`Plugin ${pluginName} ${enabled ? "enabled" : "disabled"}`);
    }
  }

  has(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  count(): number {
    return this.plugins.size;
  }
}

export const pluginRegistry = new PluginRegistry();

