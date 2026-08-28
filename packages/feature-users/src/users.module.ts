import { Global, Module } from "@nestjs/common";

import { USERS_REPOSITORY } from "./application/ports/users.repository.port";
import { UsersMapper } from "./application/users.mapper";
import { UsersRepository } from "./infrastructure/users.repository";
import { USER_LOOKUP } from "./public/user-lookup.port";

/** Core Users persistence and stable lookup contract. */
@Global()
@Module({
  providers: [
    UsersRepository,
    UsersMapper,
    { provide: USERS_REPOSITORY, useExisting: UsersRepository },
    { provide: USER_LOOKUP, useExisting: UsersRepository },
  ],
  exports: [USER_LOOKUP, USERS_REPOSITORY, UsersMapper],
})
export class UsersModule {}
export { UsersRepository } from "./infrastructure/users.repository";
