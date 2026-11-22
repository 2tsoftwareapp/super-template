import { Inject, Injectable } from "@nestjs/common";
import { asc, count, desc, eq } from "drizzle-orm";
import { files, type FileRow } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";

export interface ListFilesInput {
  page: number;
  limit: number;
  /** Only this uploader's files; `undefined` lists every file (admins). */
  uploaderId?: string;
}

export interface CreateFileInput {
  uploaderId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class FilesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async create(input: CreateFileInput): Promise<FileRow> {
    const [row] = await this.database.db.insert(files).values(input).returning();

    if (!row) {
      throw new Error("File insert returned no row");
    }

    return row;
  }

  async findById(fileId: string): Promise<FileRow | null> {
    const [row] = await this.database.db.select().from(files).where(eq(files.id, fileId)).limit(1);

    return row ?? null;
  }

  async list(input: ListFilesInput): Promise<{ rows: FileRow[]; total: number }> {
    const where = input.uploaderId ? eq(files.uploaderId, input.uploaderId) : undefined;
    const [rows, [totalRow]] = await Promise.all([
      this.database.db
        .select()
        .from(files)
        .where(where)
        .orderBy(desc(files.createdAt), asc(files.id))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit),
      this.database.db.select({ value: count() }).from(files).where(where),
    ]);

    return { rows, total: Number(totalRow?.value ?? 0) };
  }

  async delete(fileId: string): Promise<void> {
    await this.database.db.delete(files).where(eq(files.id, fileId));
  }
}
