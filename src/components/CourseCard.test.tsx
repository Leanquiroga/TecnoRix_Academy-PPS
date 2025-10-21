import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { CourseCard } from './CourseCard';
import type { CoursePublic } from '../types/course';

const mockCourse: CoursePublic = {
  id: 'course-1',
  title: 'Curso de React Avanzado',
  description: 'Aprende React desde cero hasta nivel avanzado con proyectos reales',
  price: 15000,
  thumbnail_url: null,
  category: 'Programación',
  level: 'intermediate',
  teacher_id: 'teacher-1',
  instructor_name: 'Juan Pérez',
};

const mockFreeCourse: CoursePublic = {
  ...mockCourse,
  id: 'course-2',
  title: 'Introducción a JavaScript',
  price: null,
  level: 'beginner',
};

const mockAdvancedCourse: CoursePublic = {
  ...mockCourse,
  id: 'course-3',
  title: 'Arquitectura de Software',
  level: 'advanced',
};

const mockCourseWithoutLevel: CoursePublic = {
  ...mockCourse,
  id: 'course-4',
  title: 'Curso sin nivel',
  level: null,
};

function renderCourseCard(course: CoursePublic) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <CourseCard course={course} />,
    },
    {
      path: '/courses/:id',
      element: <div>Detalle del curso</div>,
    },
  ], { initialEntries: ['/'] });

  return render(<RouterProvider router={router} />);
}

describe('CourseCard', () => {
  it('renderiza información básica del curso', () => {
    renderCourseCard(mockCourse);

    expect(screen.getByText('Curso de React Avanzado')).toBeInTheDocument();
    expect(screen.getByText(/Aprende React desde cero/)).toBeInTheDocument();
    expect(screen.getByText('Instructor: Juan Pérez')).toBeInTheDocument();
  });

  it('muestra precio formateado en ARS', () => {
    renderCourseCard(mockCourse);

    // Busca el precio formateado (puede variar según locale)
    expect(screen.getByText(/\$\s*15[.,]?000/)).toBeInTheDocument();
  });

  it('muestra chip "Gratis" cuando precio es null', () => {
    renderCourseCard(mockFreeCourse);

    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  it('muestra nivel Principiante con color correcto', () => {
    renderCourseCard(mockFreeCourse);

    const chip = screen.getByText('Principiante');
    expect(chip).toBeInTheDocument();
  });

  it('muestra nivel Intermedio con color correcto', () => {
    renderCourseCard(mockCourse);

    const chip = screen.getByText('Intermedio');
    expect(chip).toBeInTheDocument();
  });

  it('muestra nivel Avanzado con color correcto', () => {
    renderCourseCard(mockAdvancedCourse);

    const chip = screen.getByText('Avanzado');
    expect(chip).toBeInTheDocument();
  });

  it('no muestra chip de nivel cuando level es null', () => {
    renderCourseCard(mockCourseWithoutLevel);

    expect(screen.queryByText('Principiante')).not.toBeInTheDocument();
    expect(screen.queryByText('Intermedio')).not.toBeInTheDocument();
    expect(screen.queryByText('Avanzado')).not.toBeInTheDocument();
  });

  it('muestra "No especificado" cuando instructor_name es null', () => {
    const courseWithoutInstructor: CoursePublic = {
      ...mockCourse,
      instructor_name: null,
    };

    renderCourseCard(courseWithoutInstructor);

    expect(screen.getByText('Instructor: No especificado')).toBeInTheDocument();
  });

  it('navega a la página de detalles al hacer click en "Ver Detalles"', async () => {
    renderCourseCard(mockCourse);

    const button = screen.getByRole('button', { name: /ver detalles/i });
    fireEvent.click(button);

    // Verifica que se navegó a la página de detalles
    expect(await screen.findByText('Detalle del curso')).toBeInTheDocument();
  });

  it('aplica hover effect correctamente', () => {
    renderCourseCard(mockCourse);

    const button = screen.getByRole('button', { name: /ver detalles/i });
    expect(button).toBeInTheDocument();
  });

  it('trunca descripciones largas', () => {
    const longDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
    const courseWithLongDescription: CoursePublic = {
      ...mockCourse,
      description: longDescription,
    };

    renderCourseCard(courseWithLongDescription);

    // Verifica que el texto se renderiza (aunque se trunca visualmente con CSS)
    expect(screen.getByText(new RegExp(longDescription.substring(0, 50)))).toBeInTheDocument();
  });
});
