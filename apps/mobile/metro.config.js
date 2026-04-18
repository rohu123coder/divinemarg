const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const monorepoRoot = path.resolve(__dirname, "../..");

config.watchFolders = [monorepoRoot];

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(__dirname, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
  ],
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === "react" || moduleName === "react-native") {
      return {
        filePath: require.resolve(moduleName, {
          paths: [path.resolve(monorepoRoot, "node_modules")],
        }),
        type: "sourceFile",
      };
    }
    if (upstreamResolveRequest) {
      return upstreamResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
