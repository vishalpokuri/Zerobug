import { useState } from 'react';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export function PostmanInterface() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('params');
  const [params, setParams] = useState<KeyValuePair[]>([{ key: '', value: '', enabled: true }]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([{ key: '', value: '', enabled: true }]);
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState('raw');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const addKeyValuePair = (type: 'params' | 'headers') => {
    if (type === 'params') {
      setParams([...params, { key: '', value: '', enabled: true }]);
    } else {
      setHeaders([...headers, { key: '', value: '', enabled: true }]);
    }
  };

  const updateKeyValuePair = (type: 'params' | 'headers', index: number, field: keyof KeyValuePair, value: any) => {
    if (type === 'params') {
      const newParams = [...params];
      newParams[index] = { ...newParams[index], [field]: value };
      setParams(newParams);
    } else {
      const newHeaders = [...headers];
      newHeaders[index] = { ...newHeaders[index], [field]: value };
      setHeaders(newHeaders);
    }
  };

  const removeKeyValuePair = (type: 'params' | 'headers', index: number) => {
    if (type === 'params') {
      setParams(params.filter((_, i) => i !== index));
    } else {
      setHeaders(headers.filter((_, i) => i !== index));
    }
  };

  const sendRequest = async () => {
    setLoading(true);
    try {
      // Build URL with params
      let requestUrl = url;
      const enabledParams = params.filter(p => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach(p => searchParams.append(p.key, p.value));
        requestUrl += `?${searchParams.toString()}`;
      }

      // Build headers
      const requestHeaders: Record<string, string> = {};
      headers
        .filter(h => h.enabled && h.key)
        .forEach(h => requestHeaders[h.key] = h.value);

      // Prepare request options
      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body;
        if (!requestHeaders['Content-Type']) {
          options.headers = { ...requestHeaders, 'Content-Type': 'application/json' };
        }
      }

      const response = await fetch(requestUrl, options);
      const responseData = await response.text();
      
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: parsedData,
      });
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Request failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderKeyValueTable = (type: 'params' | 'headers') => {
    const data = type === 'params' ? params : headers;
    const updateFn = updateKeyValuePair;
    const addFn = () => addKeyValuePair(type);
    const removeFn = (index: number) => removeKeyValuePair(type, index);

    return (
      <div className="h-full">
        <div className="grid grid-cols-12 gap-0 text-xs font-medium text-[#a0a0a0] bg-[#2b2b2b] px-3 py-2 border-b border-[#404040]">
          <div className="col-span-1"></div>
          <div className="col-span-5 uppercase tracking-wide">Key</div>
          <div className="col-span-5 uppercase tracking-wide">Value</div>
          <div className="col-span-1"></div>
        </div>
        <div className="overflow-auto">
          {data.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-0 items-center border-b border-[#2b2b2b] hover:bg-[#2b2b2b] transition-colors">
              <div className="col-span-1 px-3 py-2">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => updateFn(type, index, 'enabled', e.target.checked)}
                  className="w-3 h-3 accent-[#ff6b35] bg-transparent border border-[#555] rounded-sm"
                />
              </div>
              <div className="col-span-5 px-2 py-1">
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => updateFn(type, index, 'key', e.target.value)}
                  placeholder="Key"
                  className="w-full px-2 py-1.5 bg-transparent border-0 text-[#e8e8e8] text-sm placeholder-[#777] focus:outline-none focus:bg-[#2b2b2b] rounded"
                />
              </div>
              <div className="col-span-5 px-2 py-1">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => updateFn(type, index, 'value', e.target.value)}
                  placeholder="Value"
                  className="w-full px-2 py-1.5 bg-transparent border-0 text-[#e8e8e8] text-sm placeholder-[#777] focus:outline-none focus:bg-[#2b2b2b] rounded"
                />
              </div>
              <div className="col-span-1 px-3 py-2">
                <button
                  onClick={() => removeFn(index)}
                  className="text-[#999] hover:text-[#ff6b35] w-4 h-4 flex items-center justify-center text-lg transition-colors"
                  disabled={data.length === 1}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-[#2b2b2b]">
          <button
            onClick={addFn}
            className="text-[#ff6b35] hover:text-[#ff8c5a] text-xs font-medium transition-colors"
          >
            + Add {type === 'params' ? 'Parameter' : 'Header'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#1e1e1e] text-white flex flex-col">
      {/* Header */}
      <div className="bg-[#252525] border-b border-[#404040] px-4 py-3">
        {/* Request Line */}
        <div className="flex gap-1 items-center">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded border-0 focus:outline-none focus:ring-1 focus:ring-[#ff6b35] ${
              method === 'GET' ? 'bg-[#4caf50] text-white' :
              method === 'POST' ? 'bg-[#ff6b35] text-white' :
              method === 'PUT' ? 'bg-[#2196f3] text-white' :
              method === 'DELETE' ? 'bg-[#f44336] text-white' :
              method === 'PATCH' ? 'bg-[#9c27b0] text-white' :
              'bg-[#607d8b] text-white'
            }`}
          >
            {httpMethods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 px-3 py-1.5 bg-[#1e1e1e] border border-[#404040] text-[#e8e8e8] text-sm placeholder-[#777] focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35]"
          />
          <button
            onClick={sendRequest}
            disabled={!url || loading}
            className="px-4 py-1.5 bg-[#ff6b35] hover:bg-[#ff8c5a] disabled:bg-[#555] disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Request Configuration */}
      <div className="flex-1 flex">
        {/* Left Panel - Request */}
        <div className="w-1/2 border-r border-[#404040] flex flex-col">
          {/* Tabs */}
          <div className="bg-[#252525] border-b border-[#404040] flex">
            {['params', 'headers', 'body'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wide border-r border-[#404040] last:border-r-0 transition-colors ${
                  activeTab === tab
                    ? 'text-[#ff6b35] bg-[#1e1e1e] border-b-2 border-[#ff6b35]'
                    : 'text-[#a0a0a0] hover:text-[#e8e8e8] hover:bg-[#2b2b2b]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'params' && renderKeyValueTable('params')}
            
            {activeTab === 'headers' && renderKeyValueTable('headers')}
            
            {activeTab === 'body' && (
              <div className="h-full flex flex-col">
                <div className="bg-[#2b2b2b] px-3 py-2 border-b border-[#404040] flex gap-4">
                  {['raw', 'form-data', 'x-www-form-urlencoded'].map(type => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value={type}
                        checked={bodyType === type}
                        onChange={(e) => setBodyType(e.target.value)}
                        className="w-3 h-3 accent-[#ff6b35]"
                      />
                      <span className="text-xs text-[#a0a0a0] uppercase tracking-wide">{type.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
                
                {bodyType === 'raw' && (
                  <div className="flex-1 p-0">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Enter raw body content"
                      className="w-full h-full px-3 py-3 bg-[#1e1e1e] border-0 text-[#e8e8e8] text-sm placeholder-[#777] focus:outline-none font-mono resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Response */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-[#252525] border-b border-[#404040] px-4 py-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[#a0a0a0]">Response</h3>
          </div>
          <div className="flex-1 overflow-auto bg-[#1e1e1e]">
            {response ? (
              <div className="h-full">
                {response.error ? (
                  <div className="p-4">
                    <div className="text-[#f44336] text-sm">
                      <span className="font-medium">Error:</span> {response.error}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="bg-[#2b2b2b] px-4 py-2 border-b border-[#404040] flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        response.status >= 200 && response.status < 300
                          ? 'bg-[#4caf50] text-white'
                          : response.status >= 400
                          ? 'bg-[#f44336] text-white'
                          : 'bg-[#ff9800] text-white'
                      }`}>
                        {response.status} {response.statusText}
                      </span>
                    </div>
                    <div className="flex-1 p-0">
                      <pre className="w-full h-full p-4 bg-[#1e1e1e] text-[#e8e8e8] text-xs font-mono overflow-auto whitespace-pre-wrap">
                        {typeof response.data === 'string' 
                          ? response.data 
                          : JSON.stringify(response.data, null, 2)
                        }
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-[#777] text-sm text-center">
                  <div className="mb-2 text-2xl">📡</div>
                  <div>Send a request to see the response</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}