import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';
import * as UploadAPI from '../api/upload.service';

vi.mock('../api/upload.service');

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('estado inicial es correcto', () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('rechaza archivo sin tipo MIME', async () => {
    const { result } = renderHook(() => useFileUpload());

    const invalidFile = new File(['content'], 'test.txt', { type: '' });

    await result.current.upload(invalidFile);

    await waitFor(() => {
      expect(result.current.error).toBe('Por favor, selecciona un archivo.');
    });
    expect(result.current.uploading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('rechaza archivo de tipo no permitido', async () => {
    const { result } = renderHook(() => useFileUpload());

    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    await result.current.upload(invalidFile);

    await waitFor(() => {
      expect(result.current.error).toBe(
        'Tipo de archivo no permitido. Solo se aceptan PDF o videos (MP4, MPEG, QuickTime, AVI, WMV, WebM).'
      );
    });
    expect(result.current.uploading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('acepta archivo PDF válido', async () => {
    const { result } = renderHook(() => useFileUpload());

    const mockResponse = {
      url: 'https://cloudinary.com/file.pdf',
      publicId: 'file123',
      resourceType: 'raw' as const,
      format: 'pdf',
      size: 1000000,
      originalName: 'test.pdf',
      mimetype: 'application/pdf',
    };

    vi.spyOn(UploadAPI, 'uploadFile').mockResolvedValue(mockResponse);

    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await result.current.upload(validFile);

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResponse);
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('acepta archivo de video MP4 válido', async () => {
    const { result } = renderHook(() => useFileUpload());

    const mockResponse = {
      url: 'https://cloudinary.com/video.mp4',
      publicId: 'video123',
      resourceType: 'video' as const,
      format: 'mp4',
      size: 5000000,
      originalName: 'test.mp4',
      mimetype: 'video/mp4',
    };

    vi.spyOn(UploadAPI, 'uploadFile').mockResolvedValue(mockResponse);

    const validFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });

    await result.current.upload(validFile);

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResponse);
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('acepta archivo de video MPEG válido', async () => {
    const { result } = renderHook(() => useFileUpload());

    const mockResponse = {
      url: 'https://cloudinary.com/video.mpeg',
      publicId: 'video456',
      resourceType: 'video' as const,
      format: 'mpeg',
      size: 3000000,
      originalName: 'test.mpeg',
      mimetype: 'video/mpeg',
    };

    vi.spyOn(UploadAPI, 'uploadFile').mockResolvedValue(mockResponse);

    const validFile = new File(['content'], 'test.mpeg', { type: 'video/mpeg' });

    await result.current.upload(validFile);

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResponse);
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('acepta archivo de video QuickTime válido', async () => {
    const { result } = renderHook(() => useFileUpload());

    const mockResponse = {
      url: 'https://cloudinary.com/video.mov',
      publicId: 'video789',
      resourceType: 'video' as const,
      format: 'mov',
      size: 4000000,
      originalName: 'test.mov',
      mimetype: 'video/quicktime',
    };

    vi.spyOn(UploadAPI, 'uploadFile').mockResolvedValue(mockResponse);

    const validFile = new File(['content'], 'test.mov', { type: 'video/quicktime' });

    await result.current.upload(validFile);

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResponse);
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('rechaza archivo que excede 100MB', async () => {
    const { result } = renderHook(() => useFileUpload());

    // Crear un archivo de más de 100MB (100 * 1024 * 1024 bytes)
    const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    await result.current.upload(largeFile);

    await waitFor(() => {
      expect(result.current.error).toBe('El archivo es demasiado grande. Tamaño máximo: 100MB.');
    });
    expect(result.current.uploading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('acepta archivo de exactamente 100MB', async () => {
    const { result } = renderHook(() => useFileUpload());

    const mockResponse = {
      url: 'https://cloudinary.com/large.pdf',
      publicId: 'large123',
      resourceType: 'raw' as const,
      format: 'pdf',
      size: 100 * 1024 * 1024,
      originalName: 'large.pdf',
      mimetype: 'application/pdf',
    };

    vi.spyOn(UploadAPI, 'uploadFile').mockResolvedValue(mockResponse);

    // Crear un archivo de exactamente 100MB
    const exactFile = new File(['x'.repeat(100 * 1024 * 1024)], 'exact.pdf', {
      type: 'application/pdf',
    });

    await result.current.upload(exactFile);

    await waitFor(() => {
      expect(result.current.result).toEqual(mockResponse);
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maneja errores de API correctamente', async () => {
    const { result } = renderHook(() => useFileUpload());

    vi.spyOn(UploadAPI, 'uploadFile').mockRejectedValue(new Error('Network error'));

    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await result.current.upload(validFile);

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('establece estado uploading durante la carga', async () => {
    const { result } = renderHook(() => useFileUpload());

    const mockResponse = {
      url: 'https://cloudinary.com/file.pdf',
      publicId: 'file123',
      resourceType: 'raw' as const,
      format: 'pdf',
      size: 1000000,
      originalName: 'test.pdf',
      mimetype: 'application/pdf',
    };

    // Simular delay en la carga
    vi.spyOn(UploadAPI, 'uploadFile').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        })
    );

    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    const uploadPromise = result.current.upload(validFile);

    // Durante la carga, uploading debe ser true
    await waitFor(() => {
      expect(result.current.uploading).toBe(true);
    });

    await uploadPromise;

    // Después de la carga, uploading debe ser false
    await waitFor(() => {
      expect(result.current.uploading).toBe(false);
    });
  });

  it('limpia error anterior en nueva carga exitosa', async () => {
    const { result } = renderHook(() => useFileUpload());

    // Primera carga con error
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    await result.current.upload(invalidFile);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Segunda carga exitosa
    const mockResponse = {
      url: 'https://cloudinary.com/file.pdf',
      publicId: 'file123',
      resourceType: 'raw' as const,
      format: 'pdf',
      size: 1000000,
      originalName: 'test.pdf',
      mimetype: 'application/pdf',
    };

    vi.spyOn(UploadAPI, 'uploadFile').mockResolvedValue(mockResponse);

    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await result.current.upload(validFile);

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    expect(result.current.result).toEqual(mockResponse);
  });
});
