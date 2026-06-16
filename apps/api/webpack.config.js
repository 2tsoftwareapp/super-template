const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({
      // Bundle workspace packages; keep npm deps external.
      allowlist: [/^@repo\//],
    }),
  ],
  resolve: {
    ...options.resolve,
    plugins: [
      ...(options.resolve.plugins ?? []),
      new TsconfigPathsPlugin({
        configFile: 'tsconfig.json',
      }),
    ],
  },
});
