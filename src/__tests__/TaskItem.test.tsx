import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

});
