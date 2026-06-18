import type { RoleRecord } from './access-control.repository.port';
import type { RoleView } from './access-control.types';

export class AccessControlMapper {
  toRoleView(role: RoleRecord): RoleView {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
    };
  }
}
