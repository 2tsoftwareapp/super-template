import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";

import {
  configureGlobalMiddleware,
  globalPipelineProviders,
} from "./composition/global-pipeline";
import { RuntimeModule } from "./composition/runtime.module";

@Module({
  imports: [RuntimeModule],
  providers: [...globalPipelineProviders],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    configureGlobalMiddleware(consumer);
  }
}
