import type { Config } from "wagmi";
import type { ReactNode } from "react";

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  repository?: string;
}

export interface PluginFunctionParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface PluginFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, PluginFunctionParameter>;
    required: string[];
  };
}

export interface PluginContext {
  address?: string;
  isConnected: boolean;
  config: Config;
}

export interface PluginResult {
  success: boolean;
  data?: unknown;
  error?: string;
  displayContent?: ReactNode;
}

export interface IPlugin {
  metadata: PluginMetadata;
  functions: PluginFunction[];
  init?(context: PluginContext): Promise<void> | void;
  execute(
    functionName: string,
    args: Record<string, unknown>,
    context: PluginContext
  ): Promise<PluginResult>;
  cleanup?(): Promise<void> | void;
}

export interface PluginRegistration {
  plugin: IPlugin;
  enabled: boolean;
  loadedAt: Date;
}

