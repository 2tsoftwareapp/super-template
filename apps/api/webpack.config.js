const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const MAIL_TEMPLATES_SRC = path.resolve(
  __dirname,
  "../../packages/feature-mail/src/infrastructure/templates",
);

module.exports = (options) => ({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    new CopyPlugin({
      patterns: [
        {
          from: MAIL_TEMPLATES_SRC,
          to: path.resolve(__dirname, "dist/templates/mail"),
          globOptions: { ignore: ["**/.gitkeep"] },
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
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
