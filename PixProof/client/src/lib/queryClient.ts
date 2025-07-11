import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`HTTP Error ${res.status} for ${res.url}:`, text);
    throw new Error(`${res.status}: ${text}`);
  }
}

// Overloaded function signatures
export async function apiRequest(url: string): Promise<any>;
export async function apiRequest(method: string, url: string, data?: any): Promise<any>;
export async function apiRequest(url: string, options: RequestInit): Promise<any>;
export async function apiRequest(urlOrMethod: string, urlOrOptions?: string | RequestInit, data?: any): Promise<any> {
  try {
    let url: string;
    let options: RequestInit = {};

    // Handle different overload patterns
    if (typeof urlOrOptions === "string") {
      // Method, URL, data pattern: apiRequest("POST", "/api/endpoint", data)
      const method = urlOrMethod;
      url = urlOrOptions;
      options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(data && { body: JSON.stringify(data) }),
      };
    } else if (urlOrOptions && typeof urlOrOptions === "object") {
      // URL, options pattern: apiRequest("/api/endpoint", { method: "POST" })
      url = urlOrMethod;
      options = urlOrOptions;
    } else {
      // Simple URL pattern: apiRequest("/api/endpoint")
      url = urlOrMethod;
    }

    const res = await fetch(url, {
      credentials: "include",
      ...options,
    });

    await throwIfResNotOk(res);
    
    // Check if response is HTML before parsing JSON
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      const responseText = await res.text();
      console.error(`Expected JSON but received HTML for ${url}`);
      console.error(`Response:`, responseText.substring(0, 300));
      throw new Error(`Erro: Servidor retornou página HTML`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`API Request Error for ${urlOrMethod}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      const contentType = res.headers.get('content-type');
      
      // Check if response is HTML before reading text
      if (contentType?.includes('text/html')) {
        const responseText = await res.text();
        console.error(`Expected JSON but received HTML for ${url}`);
        console.error(`Content-Type: ${contentType}`);
        console.error(`Response:`, responseText.substring(0, 300));
        throw new Error(`Erro: Servidor retornou página HTML para ${url.replace('/api/', '')}`);
      }
      
      const responseText = await res.text();
      
      if (responseText.includes('<!DOCTYPE')) {
        console.error(`HTML detected in response for ${url}`);
        console.error(`Response:`, responseText.substring(0, 300));
        throw new Error(`Erro: Resposta HTML recebida para ${url.replace('/api/', '')}`);
      }
      
      if (!responseText.trim()) {
        console.error(`Empty response for ${url}`);
        throw new Error(`Erro: Resposta vazia do servidor para ${url.replace('/api/', '')}`);
      }
      
      try {
        return JSON.parse(responseText);
      } catch (parseError: unknown) {
        console.error(`JSON Parse Error for ${url}:`, parseError);
        console.error(`Response text:`, responseText.substring(0, 200));
        const errorMessage = parseError instanceof Error ? parseError.message : 'JSON parse error';
        throw new Error(`Erro: Resposta inválida do servidor - ${errorMessage}`);
      }
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
