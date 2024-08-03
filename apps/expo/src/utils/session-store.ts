import { useStorageState } from "./hooks/useStorageState";

const key = "session_token";

export const useToken = () => {
  const [[isLoading, token], setToken] = useStorageState(key);
  const getToken = () => token;
  const deleteToken = () => setToken(null);
  return { setToken, getToken, deleteToken, isLoading };
};
