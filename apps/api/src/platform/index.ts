import { Module } from "@nestjs/common";

export { ImportExportModule } from "./import-export/import-export.module";
export { DELIVERIES_REPOSITORY } from "./modules/notifications/application/ports/deliveries.repository.port";
export { PUSH_NOTIFIER } from "./modules/notifications/application/ports/push.interface";
export { NotificationDeliveryProcessor } from "./modules/notifications/application/services/notification-delivery.processor";
export { NotificationDeliveryUseCase } from "./modules/notifications/application/use-cases/notification-delivery.use-case";
export { PlatformPortsModule } from "./platform-ports.module";
export { ImportExportAdapterRegistry } from "@repo/api-core";

import { ExportsModule } from "./modules/exports/exports.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { StorageModule } from "./modules/storage";
import { PlatformPortsModule } from "./platform-ports.module";

@Module({
  // PlatformPortsModule (@Global) is the single owner of the eight globally
  // exported feature modules. PlatformModule adds only the three modules that
  // are intentionally non-global (storage, imports, exports).
  imports: [PlatformPortsModule, StorageModule, ImportsModule, ExportsModule],
  exports: [PlatformPortsModule, StorageModule, ImportsModule, ExportsModule],
})
export class PlatformModule {}
