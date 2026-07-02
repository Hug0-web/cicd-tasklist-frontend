import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';

const baseTask = {
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

describe('useTasks', () => {
	it('loads tasks on mount', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([baseTask]);
		const { result } = renderHook(() => useTasks());

		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.tasks).toEqual([baseTask]);
		expect(result.current.error).toBeNull();
	});

	it('sets an error message when loading fails', async () => {
		vi.spyOn(taskApi, 'getTasks').mockRejectedValue(new Error('Network down'));
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Network down');
		expect(result.current.tasks).toEqual([]);
	});

	it('falls back to a generic error message for non-Error rejections', async () => {
		vi.spyOn(taskApi, 'getTasks').mockRejectedValue('boom');
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Une erreur est survenue');
	});

	it('adds a task and prepends it to the list', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([]);
		vi.spyOn(taskApi, 'createTask').mockResolvedValue(baseTask);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({ title: 'Tâche' });
		});

		expect(result.current.tasks).toEqual([baseTask]);
	});

	it('edits a task in place', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([baseTask]);
		const updated = { ...baseTask, title: 'Modifiée' };
		vi.spyOn(taskApi, 'updateTask').mockResolvedValue(updated);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.editTask(1, { title: 'Modifiée' });
		});

		expect(result.current.tasks).toEqual([updated]);
	});

	it('removes a task from the list', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([baseTask]);
		vi.spyOn(taskApi, 'deleteTask').mockResolvedValue(undefined);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.removeTask(1);
		});

		expect(result.current.tasks).toEqual([]);
	});

	it('toggles task completion', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([baseTask]);
		const toggled = { ...baseTask, completed: true };
		vi.spyOn(taskApi, 'updateTask').mockResolvedValue(toggled);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(taskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
		expect(result.current.tasks).toEqual([toggled]);
	});

	it('does nothing when toggling a task that does not exist', async () => {
		vi.spyOn(taskApi, 'getTasks').mockResolvedValue([baseTask]);
		const updateSpy = vi.spyOn(taskApi, 'updateTask');
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(999);
		});

		expect(updateSpy).not.toHaveBeenCalled();
	});
});
