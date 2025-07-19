export interface ParamType {
  name: string;
  type: string;
  required?: boolean;
}

export interface EndpointData {
  method: string;
  url: string;
  headers: string[];
  requestDataType: "params" | "query" | "body" | "none";
  paramTypes: ParamType[];
  queryParamTypes: ParamType[];
  bodyParamTypes: ParamType[];
}
