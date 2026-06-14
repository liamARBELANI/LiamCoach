import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Client, IntakeForm, NutritionForm } from '@/types';
import { clientRepository } from '@/lib/dataSource';

export const clientKeys = {
  all: ['clients'] as const,
  detail: (id: string) => ['clients', id] as const,
};

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: () => clientRepository.list(),
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(id ?? '__none__'),
    queryFn: () => clientRepository.get(id as string),
    enabled: !!id,
  });
}

export interface CreateClientArgs {
  intake: IntakeForm;
  nutrition: NutritionForm;
  goalImageFile?: File | null;
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ intake, nutrition, goalImageFile }: CreateClientArgs) => {
      const created = await clientRepository.create({
        intake,
        nutrition,
        status: 'completed',
      });
      if (goalImageFile) {
        const url = await clientRepository.uploadGoalImage(created.id, goalImageFile);
        return clientRepository.update(created.id, {
          intake: { ...intake, goalImageUrl: url },
        });
      }
      return created;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export interface UpdateClientArgs {
  id: string;
  patch: Partial<Omit<Client, 'id' | 'createdAt'>>;
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateClientArgs) =>
      clientRepository.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: clientKeys.detail(id) });
      const previous = qc.getQueryData<Client>(clientKeys.detail(id));
      if (previous) {
        qc.setQueryData<Client>(clientKeys.detail(id), {
          ...previous,
          ...patch,
          updatedAt: Date.now(),
        });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData(clientKeys.detail(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      void qc.invalidateQueries({ queryKey: clientKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
