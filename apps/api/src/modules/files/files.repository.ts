import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { files, type FileRow } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";

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
}
