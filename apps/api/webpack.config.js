const CopyPlugin = require("copy-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const externalizeTerminus = ({ request }, callback) => {
  if (request === "@nestjs/terminus") {
    callback(null, `commonjs ${request}`);
    return;
  }

  callback();
};

module.exports = (options) => ({
  ...options,
  externals: [
    externalizeTerminus,
    nodeExternals({
      // Bundle workspace packages; keep npm deps external.
      allowlist: [/^@repo\//],
    }),
  ],
  plugins: [
    ...(options.plugins ?? []),
    // Mail templates are read from disk at runtime (dynamic dir listing is
    // incompatible with bundling), so copy them next to the bundle mirroring
    // the src layout the renderer resolves against.
    new CopyPlugin({
      patterns: [
        {
          from: "../../packages/features/platform/src/modules/mail/infrastructure/templates",
          to: "platform/modules/mail/infrastructure/templates",
        },
      ],
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
