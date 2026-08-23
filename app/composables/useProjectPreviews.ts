import { createEmptyProjectPreviews } from '#shared/constants';
import type { ProjectPreviews } from '#shared/types/projects';

export function useProjectPreviews() {
  return useLazyFetch<ProjectPreviews>('/api/projects/previews', {
    key: 'neoverse-project-previews-v5',
    server: true,
    default: () => createEmptyProjectPreviews(),
  });
}
