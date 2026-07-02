import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import * as taskApi from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Tâche',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('App', () => {
	it('shows the header without stats when there are no tasks', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);
		render(<App />);
		expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
		expect(screen.queryByText('Total')).not.toBeInTheDocument();
	});

	it('shows header stats once tasks are loaded', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([mockTask]);
		render(<App />);
		await waitFor(() => expect(screen.getByText('Tâche')).toBeInTheDocument());
		expect(screen.getByText('Total')).toBeInTheDocument();
		expect(screen.getByText('Terminées')).toBeInTheDocument();
		expect(screen.getByText('En cours')).toBeInTheDocument();
	});

	it('adds a task through the form', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);
		vi.spyOn(taskApi, 'createTask').mockResolvedValue(mockTask);
		render(<App />);
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());

		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Tâche' } });
		fireEvent.click(screen.getByText('Ajouter'));

		await waitFor(() => expect(screen.getByText('Tâche')).toBeInTheDocument());
	});

	it('swallows errors thrown while adding a task', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);
		vi.spyOn(taskApi, 'createTask').mockRejectedValue(new Error('fail'));
		render(<App />);
		await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());

		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Tâche' } });
		expect(() => fireEvent.click(screen.getByText('Ajouter'))).not.toThrow();
	});
});
