import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('renders create mode by default', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		expect(screen.getByText('Ajouter')).toBeInTheDocument();
	});

	it('shows a validation error when submitting without a title', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.click(screen.getByText('Ajouter'));
		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('clears the validation error once the user types a title', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		fireEvent.click(screen.getByText('Ajouter'));
		expect(screen.getByRole('alert')).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Nouvelle tâche' } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('submits trimmed title and description', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: '  Titre  ' } });
		fireEvent.change(screen.getByLabelText('Description'), { target: { value: '  Desc  ' } });
		fireEvent.click(screen.getByText('Ajouter'));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Titre', description: 'Desc' });
	});

	it('submits with undefined description when left empty', () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);
		fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Titre' } });
		fireEvent.click(screen.getByText('Ajouter'));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Titre', description: undefined });
	});

	it('resets fields after submit in create mode', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
		fireEvent.change(titleInput, { target: { value: 'Titre' } });
		fireEvent.click(screen.getByText('Ajouter'));
		expect(titleInput.value).toBe('');
	});

	it('renders edit mode with initial values and does not reset after submit', () => {
		const onSubmit = vi.fn();
		render(
			<TaskForm
				onSubmit={onSubmit}
				mode="edit"
				initialValues={{ title: 'Existant', description: 'Old' }}
			/>
		);
		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
		expect(titleInput.value).toBe('Existant');
		fireEvent.click(screen.getByText('Modifier'));
		expect(onSubmit).toHaveBeenCalledWith({ title: 'Existant', description: 'Old' });
		expect(titleInput.value).toBe('Existant');
	});

	it('calls onCancel when the cancel button is clicked', () => {
		const onCancel = vi.fn();
		render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);
		fireEvent.click(screen.getByText('Annuler'));
		expect(onCancel).toHaveBeenCalled();
	});

	it('does not render the cancel button when onCancel is not provided', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.queryByText('Annuler')).not.toBeInTheDocument();
	});
});
