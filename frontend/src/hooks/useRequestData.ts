import { useState } from "react";

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ParameterWithType {
  name: string;
  type: string;
  required?: boolean;
}

export interface ParsedEndpoint {
  method: string;
  url: string;
  headers: string[];
  requestDataType: "params" | "query" | "body" | "none";
  paramTypes: ParameterWithType[];
  queryParamTypes: ParameterWithType[];
  bodyParamTypes: ParameterWithType[];
}

export interface RequestDataState {
  params: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyParams: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: string;
}

export function useRequestData(endpointData: ParsedEndpoint) {
  const [params, setParams] = useState<KeyValuePair[]>(
    endpointData.paramTypes.length > 0
      ? endpointData.paramTypes.map((param) => ({
          key: param.name,
          value: "",
          enabled: true,
        }))
      : [{ key: "", value: "", enabled: true }]
  );

  const [queryParams, setQueryParams] = useState<KeyValuePair[]>(
    endpointData.queryParamTypes.length > 0
      ? endpointData.queryParamTypes.map((param) => ({
          key: param.name,
          value: "",
          enabled: true,
        }))
      : [{ key: "", value: "", enabled: true }]
  );

  const [bodyParams, setBodyParams] = useState<KeyValuePair[]>(
    endpointData.bodyParamTypes.length > 0
      ? endpointData.bodyParamTypes.map((param) => ({
          key: param.name,
          value: "",
          enabled: true,
        }))
      : [{ key: "", value: "", enabled: true }]
  );

  const [headers, setHeaders] = useState<KeyValuePair[]>(
    endpointData.headers.length > 0
      ? endpointData.headers.map((key) => ({ key, value: "", enabled: true }))
      : [{ key: "", value: "", enabled: true }]
  );

  const [body, setBody] = useState("");
  const [bodyType, setBodyType] = useState("raw");

  const addKeyValuePair = (type: "params" | "query" | "body" | "headers") => {
    const newPair = { key: "", value: "", enabled: true };
    switch (type) {
      case "params":
        setParams([...params, newPair]);
        break;
      case "query":
        setQueryParams([...queryParams, newPair]);
        break;
      case "body":
        setBodyParams([...bodyParams, newPair]);
        break;
      case "headers":
        setHeaders([...headers, newPair]);
        break;
    }
  };

  const updateKeyValuePair = (
    type: "params" | "query" | "body" | "headers",
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    switch (type) {
      case "params": {
        const newParams = [...params];
        newParams[index] = { ...newParams[index], [field]: value };
        setParams(newParams);
        break;
      }
      case "query": {
        const newQueryParams = [...queryParams];
        newQueryParams[index] = { ...newQueryParams[index], [field]: value };
        setQueryParams(newQueryParams);
        break;
      }
      case "body": {
        const newBodyParams = [...bodyParams];
        newBodyParams[index] = { ...newBodyParams[index], [field]: value };
        setBodyParams(newBodyParams);
        break;
      }
      case "headers": {
        const newHeaders = [...headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value };
        setHeaders(newHeaders);
        break;
      }
    }
  };

  const removeKeyValuePair = (
    type: "params" | "query" | "body" | "headers",
    index: number
  ) => {
    switch (type) {
      case "params":
        setParams(params.filter((_, i) => i !== index));
        break;
      case "query":
        setQueryParams(queryParams.filter((_, i) => i !== index));
        break;
      case "body":
        setBodyParams(bodyParams.filter((_, i) => i !== index));
        break;
      case "headers":
        setHeaders(headers.filter((_, i) => i !== index));
        break;
    }
  };

  return {
    // State
    params,
    queryParams,
    bodyParams,
    headers,
    body,
    bodyType,
    setBody,
    setBodyType,
    // Actions
    addKeyValuePair,
    updateKeyValuePair,
    removeKeyValuePair,
  };
}
