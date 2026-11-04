import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { HomePage } from './home.page';
import { SupabaseService } from '../services/supabase.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  const supabaseMock = {
    isAdmin: signal(false),
    userRole: signal<'admin' | 'user' | null>('user'),
    currentUser: signal(null),
    getClients: vi.fn().mockResolvedValue([]),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carga los clientes al inicializar', async () => {
    await fixture.whenStable();
    expect(supabaseMock.getClients).toHaveBeenCalled();
  });
});
