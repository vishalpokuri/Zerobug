import type { KeyValuePair } from "../hooks/useRequestData";

export interface RequestDataActions {
  params: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyParams: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: string;
  setBody: (value: string) => void;
  setBodyType: (value: string) => void;
  addKeyValuePair: (type: "params" | "query" | "body" | "headers") => void;
  updateKeyValuePair: (
    type: "params" | "query" | "body" | "headers",
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => void;
  removeKeyValuePair: (
    type: "params" | "query" | "body" | "headers",
    index: number
  ) => void;
}
