import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, mocked, userEvent, within } from 'storybook/test';
import styled from 'styled-components';
import { ReviewForm } from './ReviewForm';

const Frame = styled.div`
  width: min(100%, 520px);
`;
type Props = ComponentProps<typeof ReviewForm>;
const review = {
  movieId: 550,
  rating: 8.5,
  comment: 'Vale a pena rever.',
};

function ReviewDemo(args: Props) {
  const [current, setCurrent] = useState(args.review);
  const [saving, setSaving] = useState(false);
  return (
    <ReviewForm
      {...args}
      review={current}
      pending={args.pending || saving}
      saveReview={async (id, input) => {
        setSaving(true);
        try {
          const success = await args.saveReview(id, input);
          if (success) setCurrent({ movieId: id, ...input });
          return success;
        } finally {
          setSaving(false);
        }
      }}
      deleteReview={async (id) => {
        setSaving(true);
        try {
          const success = await args.deleteReview(id);
          if (success) setCurrent(undefined);
          return success;
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}

const meta = {
  title: 'Filme/Formulário de avaliação',
  component: ReviewForm,
  decorators: [
    (Story) => (
      <Frame>
        <Story />
      </Frame>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Formulário real com validação Zod ao salvar. Nota de 0,5 a 10 em passos de 0,5 e comentário opcional de até 500 caracteres. As operações dos exemplos são locais e não gravam no navegador.',
      },
    },
  },
  args: {
    movieId: 550,
    review: undefined,
    pending: false,
    saveReview: fn<Props['saveReview']>().mockResolvedValue(true),
    deleteReview: fn<Props['deleteReview']>().mockResolvedValue(true),
  },
  argTypes: {
    movieId: { control: false },
    review: { control: false },
    saveReview: { control: false },
    deleteReview: { control: false },
  },
  render: (args) => <ReviewDemo {...args} />,
  beforeEach: ({ args }) => {
    mocked(args.saveReview).mockResolvedValue(true);
    mocked(args.deleteReview).mockResolvedValue(true);
  },
} satisfies Meta<typeof ReviewForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NovaAvaliacao: Story = {};
export const Editar: Story = { args: { review } };
export const Salvando: Story = { args: { review, pending: true } };
export const Salvar: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('spinbutton', { name: 'Sua nota' }), '9.5');
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Comentário (opcional)' }),
      'Ótimo filme.',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Salvar avaliação' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Avaliação salva.');
    await expect(args.saveReview).toHaveBeenCalledWith(550, {
      rating: 9.5,
      comment: 'Ótimo filme.',
    });
    await expect(canvas.getByRole('button', { name: 'Atualizar avaliação' })).toBeEnabled();
  },
};
export const DadosInvalidos: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const rating = canvas.getByRole('spinbutton', { name: 'Sua nota' });
    const comment = canvas.getByRole('textbox', { name: 'Comentário (opcional)' });
    await userEvent.type(rating, '1.6');
    await userEvent.click(comment);
    await userEvent.paste('a'.repeat(501));
    await userEvent.click(canvas.getByRole('button', { name: 'Salvar avaliação' }));
    await expect(rating).toHaveFocus();
    await expect(rating).toHaveValue(1.6);
    await expect(comment).toHaveValue('a'.repeat(501));
    await expect(canvas.getByText('Use uma nota em passos de 0,5.')).toBeVisible();
    await expect(canvas.getByText('O comentário deve ter até 500 caracteres.')).toBeVisible();
    await expect(args.saveReview).not.toHaveBeenCalled();
  },
};
export const FalhaAoSalvar: Story = {
  args: { saveReview: fn<Props['saveReview']>().mockResolvedValue(false) },
  beforeEach: ({ args }) => {
    mocked(args.saveReview).mockResolvedValue(false);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rating = canvas.getByRole('spinbutton', { name: 'Sua nota' });
    const comment = canvas.getByRole('textbox', { name: 'Comentário (opcional)' });
    await userEvent.type(rating, '8.5');
    await userEvent.type(comment, 'Manter este comentário.');
    await userEvent.click(canvas.getByRole('button', { name: 'Salvar avaliação' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Seus dados foram mantidos.');
    await expect(rating).toHaveValue(8.5);
    await expect(comment).toHaveValue('Manter este comentário.');
  },
};
export const Excluir: Story = {
  args: { review },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Excluir avaliação' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Avaliação excluída.');
    await expect(canvas.getByRole('spinbutton', { name: 'Sua nota' })).toHaveFocus();
    await expect(canvas.getByRole('textbox', { name: 'Comentário (opcional)' })).toHaveValue('');
    await expect(args.deleteReview).toHaveBeenCalledWith(550);
  },
};
