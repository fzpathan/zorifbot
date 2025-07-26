import { QueryClient } from "@tanstack/react-query";

const getQueryFn = ({ on401 = "throw" }) => async ({ queryKey }) => {
  const [url] = queryKey;
  const response = await fetch(url, {
    credentials: "include",
  });

  if (response.status === 401) {
    if (on401 === "throw") {
      throw new Error("Unauthorized");
    }
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
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