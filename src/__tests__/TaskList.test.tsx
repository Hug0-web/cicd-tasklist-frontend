import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
	{
		id: 1,
		title: 'Première tâche',
		description: 'Description 1',
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Deuxième tâche',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

describe('TaskList', () => {
	it('shows loading state', () => {
		render(
			<TaskList
				tasks={[]}
				loading={true}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
	});

	it('renders list of tasks', () => {
		render(
			<TaskList
				tasks={mockTasks}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('task-list')).toBeInTheDocument();
		expect(screen.getByText('Première tâche')).toBeInTheDocument();
		expect(screen.getByText('Deuxième tâche')).toBeInTheDocument();
		expect(screen.getByText('2 tâches')).toBeInTheDocument();
	});

	it('shows error state', () => {
		render(
			<TaskList
				tasks={[]}
				loading={false}
				error="Erreur réseau"
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('error')).toBeInTheDocument();
		expect(screen.getByText('Erreur : Erreur réseau')).toBeInTheDocument();
	});

	it('shows empty state when no tasks', () => {
		render(
			<TaskList
				tasks={[]}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByTestId('empty')).toBeInTheDocument();
		expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
	});

	it('displays singular count for one task', () => {
		const singleTask: Task[] = [mockTasks[0]];
		render(
			<TaskList
				tasks={singleTask}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByText('1 tâche')).toBeInTheDocument();
	});

	it('displays completed task count', () => {
		render(
			<TaskList
				tasks={mockTasks}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByText('1 terminée')).toBeInTheDocument();
	});

	it('calls onToggle when checkbox is clicked', () => {
		const onToggle = vi.fn();
		render(
			<TaskList
				tasks={mockTasks}
				loading={false}
				error={null}
				onToggle={onToggle}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		const checkboxes = screen.getAllByRole('checkbox');
		fireEvent.click(checkboxes[0]);
		expect(onToggle).toHaveBeenCalledWith(mockTasks[0].id);
	});

	it('calls onDelete after double confirmation click', () => {
		const onDelete = vi.fn();
		render(
			<TaskList
				tasks={[mockTasks[0]]}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={onDelete}
				onEdit={vi.fn()}
			/>
		);
		const deleteBtn = screen.getByTitle('Supprimer');
		fireEvent.click(deleteBtn);
		expect(onDelete).not.toHaveBeenCalled();
		fireEvent.click(deleteBtn);
		expect(onDelete).toHaveBeenCalledWith(mockTasks[0].id);
	});

	it('calls onEdit with updated data when saving edit form', () => {
		const onEdit = vi.fn();
		render(
			<TaskList
				tasks={[mockTasks[0]]}
				loading={false}
				error={null}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={onEdit}
			/>
		);
		fireEvent.click(screen.getByTitle('Modifier'));
		const titleInput = screen.getByRole('textbox', { name: /modifier le titre/i });
		fireEvent.change(titleInput, { target: { value: 'Titre modifié' } });
		fireEvent.click(screen.getByText('Enregistrer'));
		expect(onEdit).toHaveBeenCalledWith(mockTasks[0].id, {
			title: 'Titre modifié',
			description: 'Description 1',
		});
	});
});
