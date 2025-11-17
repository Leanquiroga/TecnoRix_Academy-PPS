import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeacherApplicationModal from './TeacherApplicationModal';
import * as teacherService from '../../api/teacher.service';
import type { TeacherApplication, TeacherProfile, TeacherCredential } from '../../api/teacher.service';

// Mock del servicio
vi.mock('../../api/teacher.service');

// Mock de useNotify
const mockNotify = vi.fn();
vi.mock('../../hooks/useNotify', () => ({
  default: () => mockNotify
}));

// Datos de prueba con tipos correctos
const mockApplication: TeacherApplication = {
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
    bio: 'Experiencia de más de 10 años en enseñanza de matemáticas avanzadas en instituciones educativas.',
    years_experience: 10,
    linkedin_url: 'https://linkedin.com/in/juanperez',
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
      verification_status: 'pending',
      created_at: '2024-01-15T10:35:00Z'
    } as TeacherCredential
  ]
};

describe('TeacherApplicationModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado inicial', () => {
      it('debería mostrar el modal con el nombre del profesor cuando open=true', () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

        // El título del modal es el nombre del profesor
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('no debería renderizar cuando open=false', () => {
      render(
        <TeacherApplicationModal
          open={false}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    });

    it('debería mostrar las 3 secciones principales', () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      expect(screen.getByText(/Información de Contacto/i)).toBeInTheDocument();
      expect(screen.getByText(/Perfil Profesional/i)).toBeInTheDocument();
        // "Credenciales" aparece varias veces, verificamos al menos una
        expect(screen.getAllByText(/Credenciales/i).length).toBeGreaterThan(0);
    });
  });

  describe('Información de Contacto', () => {
    beforeEach(() => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );
    });

    it('debería mostrar el nombre del profesor', () => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

     it('debería mostrar el email como texto simple', () => {
      const emailLink = screen.getByText('juan@example.com');
      expect(emailLink).toBeInTheDocument();
    });

     it('debería mostrar el teléfono como texto simple', () => {
      const phoneLink = screen.getByText('+541112345678');
      expect(phoneLink).toBeInTheDocument();
    });

    it('debería mostrar el link de LinkedIn', () => {
      const linkedinLink = screen.getByText(/Ver perfil/i);
      expect(linkedinLink.closest('a')).toHaveAttribute(
        'href',
        'https://linkedin.com/in/juanperez'
      );
      expect(linkedinLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it.skip('debería ocultar teléfono cuando no existe', () => {
      const appWithoutPhone: TeacherApplication = {
        ...mockApplication,
        profile: { 
          ...mockApplication.profile!, 
          phone: '' 
        }
      };

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={appWithoutPhone}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      // El componente no muestra teléfono si no existe
      expect(screen.queryByText('+541112345678')).not.toBeInTheDocument();
    });
  });

  describe('Perfil Profesional', () => {
    beforeEach(() => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );
    });

    it('debería mostrar el headline', () => {
      expect(screen.getByText('Profesor de Matemáticas')).toBeInTheDocument();
    });

    it('debería mostrar la biografía completa', () => {
      expect(
        screen.getByText(/Experiencia de más de 10 años en enseñanza/i)
      ).toBeInTheDocument();
    });

    it('debería mostrar los años de experiencia en un chip', () => {
      expect(screen.getByText(/10 años de experiencia/i)).toBeInTheDocument();
    });
    
    it('debería mostrar el nombre y especialidad en el título', () => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('Profesor de Matemáticas')).toBeInTheDocument();
    });
  });

  describe('Credenciales', () => {
    beforeEach(() => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );
    });

    it('debería mostrar todas las credenciales', () => {
      // Las instituciones se muestran en la tabla
      expect(screen.getByText('Universidad Nacional')).toBeInTheDocument();
      expect(screen.getByText('Instituto Pedagógico')).toBeInTheDocument();
    });

    it('debería mostrar el tipo de cada credencial', () => {
      expect(screen.getByText('Título Académico')).toBeInTheDocument();
      expect(screen.getByText('Certificación')).toBeInTheDocument();
    });

    it('debería mostrar botón de descarga para cada credencial', () => {
      // Buscamos los links por fila
      const row1 = screen.getByText('Universidad Nacional').closest('tr')!;
      const row2 = screen.getByText('Instituto Pedagógico').closest('tr')!;
      expect(row1.querySelectorAll('a').length).toBeGreaterThan(0);
      expect(row2.querySelectorAll('a').length).toBeGreaterThan(0);
    });

    it('debería mostrar botones de aprobar/rechazar para credenciales pendientes', () => {
      const approveButtons = screen.getAllByRole('button', { name: /Aprobar/i });
      const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });

      expect(approveButtons.length).toBeGreaterThan(0);
      expect(rejectButtons.length).toBeGreaterThan(0);
    });

    it('debería mostrar chip de estado correcto para cada credencial', () => {
        // Ambas credenciales están pendientes
        const pendingChips = screen.getAllByText('Pendiente');
        expect(pendingChips.length).toBe(3); // 2 en tabla + 1 en header
    });
  });

  describe('Aprobar Credencial', () => {
    it('debería llamar a reviewCredential con status approved', async () => {
      vi.mocked(teacherService.reviewCredential).mockResolvedValue({
        success: true,
        message: 'Credencial aprobada'
      });

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      // Clic al botón de aprobar en la fila de "Universidad Nacional"
      const row1 = screen.getByText('Universidad Nacional').closest('tr')!;
      const rowApprove = row1.querySelectorAll('button')[0] as HTMLButtonElement;
      fireEvent.click(rowApprove);

      await waitFor(() => {
        expect(teacherService.reviewCredential).toHaveBeenCalledWith('1', {
          verification_status: 'approved'
        });
      });
    });

    it('debería mostrar notificación de éxito al aprobar', async () => {
      vi.mocked(teacherService.reviewCredential).mockResolvedValue({
        success: true,
        message: 'Credencial aprobada'
      });

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const row1b = screen.getByText('Universidad Nacional').closest('tr')!;
      const rowApproveb = row1b.querySelectorAll('button')[0] as HTMLButtonElement;
      fireEvent.click(rowApproveb);

      await waitFor(() => {
          expect(mockOnUpdate).toHaveBeenCalledWith('Credencial aprobada exitosamente', false);
      });
    });

    it('debería llamar a onUpdate después de aprobar', async () => {
      vi.mocked(teacherService.reviewCredential).mockResolvedValue({
        success: true,
        message: 'Credencial aprobada'
      });

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const row1c = screen.getByText('Universidad Nacional').closest('tr')!;
      const rowApprovec = row1c.querySelectorAll('button')[0] as HTMLButtonElement;
      fireEvent.click(rowApprovec);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Rechazar Credencial', () => {
    it('debería abrir dialog de confirmación al rechazar', async () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });
        // El primer botón Rechazar es para credenciales
        fireEvent.click(rejectButtons[1]); // Segundo botón es para credencial

      await waitFor(() => {
          // Hay 2 labels "Motivo del rechazo", uno para credencial y otro para solicitud
          expect(screen.getAllByText(/Motivo del rechazo/i).length).toBeGreaterThan(0);
      });
    });

    it('debería validar que el motivo sea requerido', async () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });
        fireEvent.click(rejectButtons[1]);

      await waitFor(() => {
          // El botón está deshabilitado sin motivo
          const confirmButton = screen.getByRole('button', { name: /Rechazar Credencial/i });
          expect(confirmButton).toBeDisabled();
      });
    });

    it('debería rechazar credencial con motivo válido', async () => {
      vi.mocked(teacherService.reviewCredential).mockResolvedValue({
        success: true,
        message: 'Credencial rechazada'
      });

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i });
        fireEvent.click(rejectButtons[1]);

      await waitFor(() => {
        const reasonInput = screen.getByLabelText(/Motivo del rechazo/i);
        fireEvent.change(reasonInput, {
          target: { value: 'Documento ilegible' }
        });
      });

        const confirmButton = screen.getByRole('button', { name: /Rechazar Credencial/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(teacherService.reviewCredential).toHaveBeenCalled();
      });
    });
  });

  describe('Aprobar Profesor Completo', () => {
    it('debería deshabilitar el botón si hay credenciales pendientes', () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const approveButton = screen.getByRole('button', {
          name: /Aprobar Profesor/i
      });
      expect(approveButton).toBeDisabled();
    });

    it('debería habilitar el botón si todas las credenciales están aprobadas', () => {
      const approvedApp = {
        ...mockApplication,
        credentials: mockApplication.credentials!.map(c => ({
          ...c,
            verification_status: 'approved' as const
        }))
      };

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={approvedApp}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const approveButton = screen.getByRole('button', {
          name: /Aprobar Profesor/i
      });
      expect(approveButton).not.toBeDisabled();
    });

    it('debería llamar a approveTeacher al hacer click', async () => {
      vi.mocked(teacherService.approveTeacher).mockResolvedValue({
        success: true,
        message: 'Profesor aprobado'
      });

      const approvedApp = {
        ...mockApplication,
        credentials: mockApplication.credentials!.map(c => ({
          ...c,
          verification_status: 'approved' as const
        }))
      };

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={approvedApp}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const approveButton = screen.getByRole('button', {
          name: /Aprobar Profesor/i
      });
      fireEvent.click(approveButton);

      await waitFor(() => {
          expect(teacherService.approveTeacher).toHaveBeenCalledWith('1');
      });
    });

    it('debería cerrar el modal después de aprobar', async () => {
      vi.mocked(teacherService.approveTeacher).mockResolvedValue({
        success: true,
        message: 'Profesor aprobado'
      });

      const approvedApp = {
        ...mockApplication,
        credentials: mockApplication.credentials!.map(c => ({
          ...c,
            verification_status: 'approved' as const
        }))
      };

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={approvedApp}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const approveButton = screen.getByRole('button', {
          name: /Aprobar Profesor/i
      });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Rechazar Solicitud Completa', () => {
    it('debería abrir dialog de rechazo', async () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const rejectButton = screen.getByRole('button', {
        name: /Rechazar Solicitud/i
      });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByText(/Rechazar Solicitud de Profesor/i)).toBeInTheDocument();
      });
    });

    it('debería validar que el motivo sea requerido', async () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const rejectButton = screen.getByRole('button', {
        name: /Rechazar Solicitud/i
      });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirmar Rechazo/i });
        fireEvent.click(confirmButton);
      });

      const confirmButton2 = screen.getByRole('button', { name: /Confirmar Rechazo/i });
      expect(confirmButton2).toBeDisabled();
    });

    it('debería rechazar la solicitud completa con motivo válido', async () => {
      vi.mocked(teacherService.rejectTeacherApplication).mockResolvedValue({
        success: true,
        message: 'Solicitud rechazada'
      });

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const rejectButton = screen.getByRole('button', {
        name: /Rechazar Solicitud/i
      });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        const reasonInput = screen.getByLabelText(/Motivo del rechazo/i);
        fireEvent.change(reasonInput, {
          target: { value: 'Perfil no cumple requisitos' }
        });
      });

      const confirmButton = screen.getByRole('button', { name: /Confirmar Rechazo/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(teacherService.rejectTeacherApplication).toHaveBeenCalledWith(
          '1',
          'Perfil no cumple requisitos'
        );
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debería mostrar notificación de error al fallar aprobación', async () => {
      vi.mocked(teacherService.reviewCredential).mockRejectedValue(
        new Error('Error de red')
      );

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      // Click en aprobar credencial de la primera fila
      const row1 = screen.getByText('Universidad Nacional').closest('tr')!;
      const rowApprove = row1.querySelectorAll('button')[0] as HTMLButtonElement;
      fireEvent.click(rowApprove);

      await waitFor(() => {
        expect(screen.getByText(/Error de red/i)).toBeInTheDocument();
      });
    });

    it('debería mostrar notificación de error al fallar rechazo', async () => {
      vi.mocked(teacherService.rejectTeacherApplication).mockRejectedValue(
        new Error('Error de red')
      );

      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const rejectButton = screen.getByRole('button', {
        name: /Rechazar Solicitud/i
      });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        const reasonInput = screen.getByLabelText(/Motivo del rechazo/i);
        fireEvent.change(reasonInput, {
          target: { value: 'Motivo de prueba' }
        });
      });

      const confirmButton = screen.getByRole('button', { name: /Confirmar Rechazo/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Error de red/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cerrar modal', () => {
    it('debería cerrar al hacer click en el botón cerrar', () => {
      render(
        <TeacherApplicationModal
          open={true}
          onClose={mockOnClose}
          application={mockApplication}
          onApplicationUpdated={mockOnUpdate}
        />
      );

      const closeButton = screen.getByRole('button', { name: /Cerrar/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it.skip('debería cerrar al hacer click en la X del modal', () => {});
  });
});
