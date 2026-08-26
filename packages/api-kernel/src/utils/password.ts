import * as argon2 from "argon2";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$EnMqZqWbztDZjMH5GrNZJQ$jEXMP23MqS+/Dp20m83Kwq7wktQ3jyT+BEfr7UqSFZo";

export const hashPassword = (value: string): Promise<string> =>
  argon2.hash(value, {
    type: argon2.argon2id,
  });

export const verifyPassword = (hash: string, value: string): Promise<boolean> =>
  argon2.verify(hash, value);

export const verifyPasswordWithTimingPadding = async (
  hash: string | null | undefined,
  value: string,
): Promise<boolean> => {
  const targetHash = hash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(targetHash, value);

  if (!hash) {
    return false;
  }

  return passwordMatches;
};

export const hashRefreshToken = hashPassword;
export const verifyRefreshTokenHash = verifyPassword;
