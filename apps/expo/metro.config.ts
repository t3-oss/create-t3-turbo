// Learn more: https://docs.expo.dev/guides/monorepos/
import path from "node:path";
import type { MetroConfig } from "expo/metro-config";
import { getDefaultConfig } from "expo/metro-config";
import { FileStore } from "@expo/metro/metro-cache";
import { withUniwindConfig } from "uniwind/metro";

const defaultConfig: MetroConfig = getDefaultConfig(__dirname);

const config: MetroConfig = {
  ...defaultConfig,
  cacheStores: [
    new FileStore({
      root: path.join(__dirname, "node_modules", ".cache", "metro"),
    }),
  ],
};

export default withUniwindConfig(config, {
  cssEntryFile: "./src/styles.css",
});
