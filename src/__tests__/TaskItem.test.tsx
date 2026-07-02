import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const task: Task = {
	id: 1,
	title: 'Tâche test',
	description: 'Une description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders task title, description and formatted date', () => {
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
		expect(screen.getByText('Tâche test')).toBeInTheDocument();
		expect(screen.getByText('Une description')).toBeInTheDocument();
		expect(screen.getByText('15 janvier 2026')).toBeInTheDocument();
	});

	it('does not render a description paragraph when there is none', () => {
		render(
			<TaskItem
				task={{ ...task, description: null }}
				onToggle={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.queryByText('Une description')).not.toBeInTheDocument();
	});

	it('applies the completed class when the task is done', () => {
		render(
			<TaskItem task={{ ...task, completed: true }} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		expect(screen.getByTestId('task-item')).toHaveClass('task-completed');
	});

	it('calls onToggle when the checkbox is clicked', () => {
		const onToggle = vi.fn();
		render(<TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);
		fireEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith(task.id);
	});

	it('requires a second click to confirm delete, then resets after a timeout', () => {
		const onDelete = vi.fn();
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);
		const deleteBtn = screen.getByTitle('Supprimer');

		fireEvent.click(deleteBtn);
		expect(onDelete).not.toHaveBeenCalled();
		expect(deleteBtn).toHaveTextContent('⚠️');

		act(() => {
			vi.advanceTimersByTime(3000);
		});
		expect(deleteBtn).toHaveTextContent('🗑️');
	});

	it('deletes on second click before the confirmation resets', () => {
		const onDelete = vi.fn();
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);
		const deleteBtn = screen.getByTitle('Supprimer');
		fireEvent.click(deleteBtn);
		fireEvent.click(deleteBtn);
		expect(onDelete).toHaveBeenCalledWith(task.id);
	});

	it('enters edit mode and cancels without saving changes', () => {
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
		fireEvent.click(screen.getByTitle('Modifier'));
		const titleInput = screen.getByLabelText('Modifier le titre');
		fireEvent.change(titleInput, { target: { value: 'Changé' } });
		fireEvent.click(screen.getByText('Annuler'));
		expect(screen.getByText('Tâche test')).toBeInTheDocument();
	});

	it('does not save an edit when the title is blank', () => {
		const onEdit = vi.fn();
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
		fireEvent.click(screen.getByTitle('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), { target: { value: '   ' } });
		fireEvent.click(screen.getByText('Enregistrer'));
		expect(onEdit).not.toHaveBeenCalled();
	});

	it('saves trimmed title and description on edit', () => {
		const onEdit = vi.fn();
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
		fireEvent.click(screen.getByTitle('Modifier'));
		fireEvent.change(screen.getByLabelText('Modifier le titre'), { target: { value: '  Nouveau titre  ' } });
		fireEvent.change(screen.getByLabelText('Modifier la description'), { target: { value: '  ' } });
		fireEvent.click(screen.getByText('Enregistrer'));
		expect(onEdit).toHaveBeenCalledWith(task.id, { title: 'Nouveau titre', description: undefined });
		expect(screen.queryByLabelText('Modifier le titre')).not.toBeInTheDocument();
	});
});
