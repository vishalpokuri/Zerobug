import type { ParsedEndpoint, RequestDataState } from "../hooks/useRequestData";

export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  error?: string;
}

export async function sendRequest(
  endpointData: ParsedEndpoint,
  requestData: RequestDataState
): Promise<RequestResponse> {
  try {
    // Build URL with params and query params
    let requestUrl = endpointData.url;

    // Replace URL params with actual values
    requestData.params
      .filter((p) => p.enabled && p.key && p.value)
      .forEach((p) => {
        requestUrl = requestUrl.replace(`:${p.key}`, p.value);
      });

    // Add query parameters
    const enabledQueryParams = requestData.queryParams.filter(
      (p) => p.enabled && p.key && p.value
    );
    if (enabledQueryParams.length > 0) {
      const searchParams = new URLSearchParams();
      enabledQueryParams.forEach((p) => searchParams.append(p.key, p.value));
      requestUrl += `?${searchParams.toString()}`;
    }

    // Build headers
    const requestHeaders: Record<string, string> = {};
    requestData.headers
      .filter((h) => h.enabled && h.key && h.value)
      .forEach((h) => (requestHeaders[h.key] = h.value));

    // Prepare request options
    const options: RequestInit = {
      method: endpointData.method,
      headers: requestHeaders,
    };

    // Add body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(endpointData.method)) {
      if (
        endpointData.requestDataType === "body" &&
        requestData.bodyParams.length > 0
      ) {
        const bodyData: Record<string, string> = {};
        requestData.bodyParams
          .filter((p) => p.enabled && p.key && p.value)
          .forEach((p) => (bodyData[p.key] = p.value));
        options.body = JSON.stringify(bodyData);
        requestHeaders["Content-Type"] = "application/json";
      } else if (requestData.body) {
        options.body = requestData.body;
        if (!requestHeaders["Content-Type"]) {
          requestHeaders["Content-Type"] = "application/json";
        }
      }
      options.headers = requestHeaders;
    }

    const response = await fetch(requestUrl, options);
    const responseData = await response.text();

    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: parsedData,
    };
  } catch (error) {
    return {
      status: 0,
      statusText: "Network Error",
      headers: {},
      data: null,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}
