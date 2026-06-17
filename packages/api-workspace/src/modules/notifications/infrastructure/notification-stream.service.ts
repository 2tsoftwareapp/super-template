import { Injectable, type MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface NotificationStreamEvent {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

@Injectable()
export class NotificationStreamService {
  private readonly subjects = new Map<
    string,
    Subject<NotificationStreamEvent>
  >();

  emit(userId: string, event: NotificationStreamEvent): void {
    this.getSubject(userId).next(event);
  }

  stream(userId: string): Observable<MessageEvent> {
    return this.getSubject(userId).pipe(
      map((event) => ({
        data: event,
      })),
    );
  }

  private getSubject(userId: string): Subject<NotificationStreamEvent> {
    const existing = this.subjects.get(userId);

    if (existing) {
      return existing;
    }

    const subject = new Subject<NotificationStreamEvent>();
    this.subjects.set(userId, subject);
    return subject;
  }
}
