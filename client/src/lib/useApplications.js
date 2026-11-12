import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errorMessage } from './api';

const KEY = ['applications'];

export function useApplications() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get('/applications').then((r) => r.data),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/applications/stats').then((r) => r.data),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };
}

export function useSaveApplication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ _id, ...data }) =>
      _id ? api.patch(`/applications/${_id}`, data) : api.post('/applications', data),
    onSuccess: (_, vars) => {
      toast.success(vars._id ? 'Application updated' : 'Application added');
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useDeleteApplication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id) => api.delete(`/applications/${id}`),
    onSuccess: () => {
      toast.success('Application deleted');
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

// Drag & drop: optimistic update, roll back on failure
export function useReorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apps) =>
      api.patch('/applications/reorder', {
        items: apps.map((a) => ({ id: a._id, status: a.status, order: a.order })),
      }),
    onMutate: async (apps) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData(KEY);
      qc.setQueryData(KEY, apps);
      return { previous };
    },
    onError: (err, _, ctx) => {
      qc.setQueryData(KEY, ctx.previous);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
