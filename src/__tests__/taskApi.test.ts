import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	describe('getTasks', () => {
		it('returns array of tasks', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve([mockTask]),
				})
			);

			const tasks = await getTasks();
			expect(tasks).toEqual([mockTask]);
			expect(fetch).toHaveBeenCalledWith('/api/tasks');
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 500,
					text: () => Promise.resolve('Internal Server Error'),
				})
			);

			await expect(getTasks()).rejects.toThrow('HTTP 500: Internal Server Error');
		});
	});

	describe('createTask', () => {
		it('sends POST and returns created task', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve(mockTask),
				})
			);

			const task = await createTask({ title: 'Test', description: 'Desc' });

			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test', description: 'Desc' }),
			});
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 400,
					text: () => Promise.resolve('Bad Request'),
				})
			);

			await expect(createTask({ title: '' })).rejects.toThrow('HTTP 400: Bad Request');
		});
	});

	describe('updateTask', () => {
		it('sends PUT and returns updated task', async () => {
			const updated = { ...mockTask, title: 'Updated', completed: true };
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve(updated),
				})
			);

			const task = await updateTask(1, { title: 'Updated', completed: true });

			expect(task).toEqual(updated);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Updated', completed: true }),
			});
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 404,
					text: () => Promise.resolve('Not Found'),
				})
			);

			await expect(updateTask(999, { title: 'X' })).rejects.toThrow('HTTP 404: Not Found');
		});
	});

	describe('deleteTask', () => {
		it('sends DELETE request', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({ ok: true })
			);

			await deleteTask(1);

			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' });
		});

		it('throws on HTTP error', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: false,
					status: 404,
					text: () => Promise.resolve('Not Found'),
				})
			);

			await expect(deleteTask(999)).rejects.toThrow('HTTP 404: Not Found');
		});
	});
});
