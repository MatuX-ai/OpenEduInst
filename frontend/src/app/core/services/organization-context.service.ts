import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type OrganizationType = 'training_institution' | 'k12_school' | 'vocational_school' | 'education_bureau';

export interface OrganizationContext {
  id: number;
  name: string;
  type: OrganizationType;
  features?: Record<string, boolean>;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationContextService {
  private contextSubject = new BehaviorSubject<OrganizationContext | null>(null);
  public context$ = this.contextSubject.asObservable();

  get currentContext(): OrganizationContext | null {
    return this.contextSubject.getValue();
  }

  setContext(context: OrganizationContext): void {
    this.contextSubject.next(context);
  }

  clearContext(): void {
    this.contextSubject.next(null);
  }

  isType(type: OrganizationType): boolean {
    return this.currentContext?.type === type;
  }
}
