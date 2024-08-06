const key = "token";

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(key);
}

export function setToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(key, token);
}

export function deleteToken() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(key);
}
