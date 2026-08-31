import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { configureGlobalMiddleware, globalPipelineProviders } from "./composition/global-pipeline";
import { RuntimeModule } from "./composition/runtime.module";

@Module({
  imports: [DiscoveryModule, RuntimeModule],
  providers: [...globalPipelineProviders],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    configureGlobalMiddleware(consumer);
  }
}
