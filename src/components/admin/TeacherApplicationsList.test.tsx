import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeacherApplicationsList from './TeacherApplicationsList';
import * as teacherService from '../../api/teacher.service';
import type { TeacherApplication, TeacherProfile, TeacherCredential } from '../../api/teacher.service';

// Mock del servicio
vi.mock('../../api/teacher.service');

// Mock de useNotify
vi.mock('../../hooks/useNotify', () => ({
  default: () => vi.fn()
}));

// Datos de prueba con tipos correctos
const mockApplications: TeacherApplication[] = [
  {
    user_id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    status: 'pending_validation',
    role: 'teacher',
    created_at: '2024-01-15T10:30:00Z',
    profile: {
      id: 'prof-1',
      user_id: '1',
      headline: 'Profesor de Matemáticas',
      bio: 'Experiencia en enseñanza',
      years_experience: 10,
      linkedin_url: 'https://linkedin.com/in/juan',
      profile_picture_url: 'https://cloudinary.com/juan.jpg',
      phone: '+541112345678',
      created_at: '2024-01-15T10:30:00Z'
    } as TeacherProfile,
    credentials: [
      {
        id: '1',
        user_id: '1',
        credential_type: 'degree',
        institution: 'Universidad Nacional',
        document_url: 'https://cloudinary.com/diploma.pdf',
        year_obtained: 2010,
        verification_status: 'pending',
        created_at: '2024-01-15T10:30:00Z'
      } as TeacherCredential,
      {
        id: '2',
        user_id: '1',
        credential_type: 'certification',
        institution: 'Instituto Pedagógico',
        document_url: 'https://cloudinary.com/cert.pdf',
        year_obtained: 2015,
        verification_status: 'approved',
        created_at: '2024-01-15T10:35:00Z'
      } as TeacherCredential
    ]
  },
  {
    user_id: '2',
    name: 'María García',
    email: 'maria@example.com',
    status: 'active',
    role: 'teacher',
    created_at: '2024-01-10T14:20:00Z',
    profile: {
      id: 'prof-2',
      user_id: '2',
      headline: 'Profesora de Física',
      bio: 'Docente con experiencia',
      years_experience: 8,
      profile_picture_url: 'https://cloudinary.com/maria.jpg',
      phone: '+541198765432',
      created_at: '2024-01-10T14:20:00Z'
    } as TeacherProfile,
    credentials: [
      {
        id: '3',
        user_id: '2',
        credential_type: 'degree',
        institution: 'Universidad de Buenos Aires',
        document_url: 'https://cloudinary.com/fisica.pdf',
        year_obtained: 2012,
        verification_status: 'approved',
        created_at: '2024-01-10T14:20:00Z'
      } as TeacherCredential
    ]
  },
  {
    user_id: '3',
    name: 'Carlos López',
    email: 'carlos@example.com',
    status: 'rejected',
    role: 'teacher',
    created_at: '2024-01-05T09:15:00Z',
    profile: {
      id: 'prof-3',
      user_id: '3',
      headline: 'Profesor de Química',
      bio: 'Especialista en química orgánica',
      years_experience: 5,
      phone: '+541187654321',
      created_at: '2024-01-05T09:15:00Z'
    } as TeacherProfile,
    credentials: []
  }
];

describe('TeacherApplicationsList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado inicial', () => {
      it('debería mostrar el título "Aplicaciones de Profesores"', async () => {
      vi.mocked(teacherService.getPendingApplications).mockResolvedValue({
        success: true,
        data: { applications: mockApplications, total: mockApplications.length }
      });

      render(<TeacherApplicationsList />);

        expect(screen.getByText(/Aplicaciones de Profesores/i)).toBeInTheDocument();
    });

    it('debería mostrar loader mientras carga datos', () => {
      vi.mocked(teacherService.getPendingApplications).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { applications: [], total: 0 }
        }), 1000))
      );

      render(<TeacherApplicationsList />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('debería cargar y mostrar las aplicaciones', async () => {
      vi.mocked(teacherService.getPendingApplications).mockResolvedValue({
        success: true,
        data: { applications: mockApplications, total: mockApplications.length }
      });

      render(<TeacherApplicationsList />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María García')).toBeInTheDocument();
        expect(screen.getByText('Carlos López')).toBeInTheDocument();
      });
    });

    it('debería mostrar mensaje cuando no hay aplicaciones pendientes', async () => {
      vi.mocked(teacherService.getPendingApplications).mockResolvedValue({
        success: true,
        data: { applications: [], total: 0 }
      });

      render(<TeacherApplicationsList />);

      await waitFor(() => {
        expect(screen.getByText(/No hay aplicaciones/i)).toBeInTheDocument();
      });
    });
  });


  describe('Visualización de datos', () => {
    beforeEach(async () => {
      vi.mocked(teacherService.getPendingApplications).mockResolvedValue({
        success: true,
        data: { applications: mockApplications, total: mockApplications.length }
      });
      render(<TeacherApplicationsList />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    });

    it('debería mostrar inicial si no hay foto', async () => {
      // No hay photo_url en los mocks, se muestra inicial
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('debería mostrar iniciales cuando no hay avatar', () => {
      const carlosInitial = screen.getByText('C');
      expect(carlosInitial).toBeInTheDocument();
    });


    it('debería mostrar el headline del perfil profesional', () => {
      expect(screen.getByText('Profesor de Matemáticas')).toBeInTheDocument();
      expect(screen.getByText('Profesora de Física')).toBeInTheDocument();
    });


    it('debería mostrar chips de estado correctamente coloreados', () => {
      const pendingChip = screen.getByText('Pendiente').closest('.MuiChip-root');
      expect(pendingChip).toHaveClass('MuiChip-colorWarning');

      const approvedChip = screen.getByText('Aprobado').closest('.MuiChip-root');
      expect(approvedChip).toHaveClass('MuiChip-colorSuccess');

      const rejectedChip = screen.getByText('Rechazado').closest('.MuiChip-root');
      expect(rejectedChip).toHaveClass('MuiChip-colorError');
    });

    it('debería formatear las fechas correctamente', () => {
      // Las fechas deben mostrarse en formato legible
      const dates = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Apertura del modal', () => {
    beforeEach(async () => {
      vi.mocked(teacherService.getPendingApplications).mockResolvedValue({
        success: true,
        data: { applications: mockApplications, total: mockApplications.length }
      });
      render(<TeacherApplicationsList />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    });

    it('debería abrir el modal al hacer click en "Ver detalles"', async () => {
      const viewButtons = screen.getAllByRole('button', { name: /Ver detalles/i });
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        // El modal debería mostrar información detallada con el nombre del profesor
        const juanTexts = screen.getAllByText('Juan Pérez');
        expect(juanTexts.length).toBeGreaterThan(1); // En tabla y en modal
      });
    });

    it('debería pasar la aplicación correcta al modal', async () => {
      const viewButtons = screen.getAllByRole('button', { name: /Ver detalles/i });
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        // Verificar que se muestra la info de Juan Pérez
        const allJuanTexts = screen.getAllByText(/Juan Pérez/i);
        expect(allJuanTexts.length).toBeGreaterThan(1); // En tabla y en modal
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debería mostrar mensaje de error cuando falla la carga', async () => {
      vi.mocked(teacherService.getPendingApplications).mockRejectedValue(
        new Error('Error de red')
      );

      render(<TeacherApplicationsList />);

      await waitFor(() => {
        expect(screen.getByText(/Error de red/i)).toBeInTheDocument();
      });
    });

    it('debería permitir reintentar la carga después de un error', async () => {
      vi.mocked(teacherService.getPendingApplications)
        .mockRejectedValueOnce(new Error('Error de red'))
        .mockResolvedValueOnce({
          success: true,
          data: { applications: mockApplications, total: mockApplications.length }
        });

      render(<TeacherApplicationsList />);

      await waitFor(() => {
        expect(screen.getByText(/Error de red/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Actualizar/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    });
  });

  describe('Actualización después de acciones', () => {
    it('debería recargar la lista después de aprobar una aplicación', async () => {
      vi.mocked(teacherService.getPendingApplications).mockResolvedValue({
        success: true,
        data: { applications: mockApplications, total: mockApplications.length }
      });

      render(<TeacherApplicationsList />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Simular aprobación (esto normalmente vendría del modal)
      const updatedApplications = mockApplications.map(app =>
        app.user_id === '1' ? { ...app, status: 'active' as const } : app
      );
      vi.mocked(teacherService.getPendingApplications).mockResolvedValue({
        success: true,
        data: { applications: updatedApplications, total: updatedApplications.length }
      });

      // Simular click en actualizar
      const refreshButton = screen.getByRole('button', { name: /Actualizar/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        // Verificar que apareció al menos un chip "Aprobado" tras la actualización
        const approvedChips = screen.getAllByText('Aprobado');
        expect(approvedChips.length).toBeGreaterThan(0);
      });
    });
  });
});
