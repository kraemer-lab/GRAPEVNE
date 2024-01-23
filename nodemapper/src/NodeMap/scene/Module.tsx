type ParameterPrimitives = unknown;

interface ParameterType {
  [key: string]: ParameterPrimitives | ParameterType;
}

// User accessible configuration, including parameters
type ModuleUserConfigType = {
  input_namespace: string | Record<string, string> | null;
  output_namespace: string | null;
  params?: ParameterType | null;
};

// Module configuration, as appears in the config.yaml file
type ModuleConfigType = {
  snakefile: string;
  docstring?: string | null;
  config: ModuleUserConfigType;
};

// Module definition
export type ModuleType = {
  name: string;
  type: string;
  config: ModuleConfigType;
};
