type ParameterPrimitives = unknown;

interface ParameterType {
  [key: string]: ParameterPrimitives | ParameterType;
}

// Port definition
type PortType = {
  ref: string;
  label: string;
  namespace: string;
  mapping?: {
    module: string;
    port: string;
  };
};

// User accessible configuration, including parameters
type ModuleUserConfigType = {
  ports: PortType[];
  namespace: string | null;
  params?: ParameterType | null;
};

// Module configuration, as appears in the config.yaml file
type ModuleConfigType = {
  snakefile: string | Record<string, string>;
  docstring?: string | null;
  config: ModuleUserConfigType;
};

// Module definition
export type ModuleType = {
  name: string;
  type: string;
  config: ModuleConfigType;
};
