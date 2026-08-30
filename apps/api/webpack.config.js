const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

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
    alias: {
      ...(options.resolve.alias ?? {}),
      "@mikro-orm/core": false,
      "@mikro-orm/nestjs": false,
      "@nestjs/axios": false,
      "@nestjs/mongoose": false,
      "@nestjs/sequelize": false,
      "@nestjs/typeorm": false,
      "@prisma/client": false,
      mongoose: false,
      sequelize: false,
      typeorm: false,
    },
    plugins: [
      ...(options.resolve.plugins ?? []),
      new TsconfigPathsPlugin({
        configFile: "tsconfig.json",
      }),
    ],
  },
});
