import Constants from "expo-constants";

const NAME = "EXPO_PUBLIC_API_BASE_URL";

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
export const getBaseUrl =
  process.env.NODE_ENV === "production"
    ? () => {
        if (!process.env[NAME]) {
          throw new Error(
            `Failed to get API base url from \`${NAME}\` env var, which is required to be set manually in production.`,
          );
        }
        return process.env[NAME];
      }
    : () => {
        /**
         * If the environment variable is set, use it.
         */
        if (process.env[NAME]) {
          return process.env[NAME];
        }

        /**
         * Gets the IP address of your host-machine. If it cannot automatically find it,
         * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
         * you don't have anything else running on it, or you'd have to change it.
         *
         * **NOTE**: This is only for development. In production, you'll want to set the
         * baseUrl to your production API URL.
         */
        const debuggerHost = Constants.expoConfig?.hostUri;
        const localhost = debuggerHost?.split(":")[0];

        if (!localhost) {
          throw new Error(
            `Failed to get local API base url. Please point to your local server using \`${NAME}\` env var.`,
          );
        }
        return `http://${localhost}:3000`;
      };
