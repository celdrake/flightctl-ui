import { describe, expect, it } from 'vitest';

import { ApiVersion, OciRepoSpec, RepoSpecType, type Repository } from '@flightctl/types';

import {
  getDeltaPushPathPreview,
  getInitValues,
  getOciPlacementModeFromSpec,
  getOciRepoDisplayPath,
  getRepository,
  getRepositoryPatches,
  isDuplicateDeltaStorageTargetError,
  repositorySchema,
} from './utils';
import { type RepositoryFormValues } from './types';

type DefinedOciConfig = NonNullable<RepositoryFormValues['ociConfig']>;

const t = (key: string) => key;

const testRegistry = 'my-registry.com';
const testRepo = 'my-org/diffs';
const testNs = 'my-org';

const getOciFormValues = (ociConfigOverrides?: Partial<DefinedOciConfig>): RepositoryFormValues => ({
  exists: false,
  name: 'delta-repo',
  repoType: RepoSpecType.RepoSpecTypeOci,
  url: '',
  showRepoTypes: true,
  allowDeltaStorage: true,
  useAdvancedConfig: false,
  configType: 'http',
  canUseResourceSyncs: false,
  useResourceSyncs: false,
  resourceSyncs: [],
  ociConfig: {
    registry: testRegistry,
    scheme: OciRepoSpec.scheme.HTTPS,
    accessMode: OciRepoSpec.accessMode.READ_WRITE,
    baseImages: [],
    deltaStorageTarget: true,
    placementMode: 'registry',
    repository: '',
    namespace: '',
    ...ociConfigOverrides,
  },
});

const existingDeltaRepository = (): Repository => ({
  apiVersion: ApiVersion.ApiVersionV1beta1,
  kind: 'Repository',
  metadata: { name: 'delta-repo' },
  spec: {
    type: RepoSpecType.RepoSpecTypeOci,
    registry: testRegistry,
    accessMode: OciRepoSpec.accessMode.READ_WRITE,
    deltaStorageTarget: true,
    repository: testRepo,
  },
});

describe('OCI delta repository utils', () => {
  it('derives placement mode from stored spec', () => {
    expect(
      getOciPlacementModeFromSpec({
        type: RepoSpecType.RepoSpecTypeOci,
        registry: testRegistry,
        repository: testRepo,
      }),
    ).toBe('repository');
    expect(
      getOciPlacementModeFromSpec({
        type: RepoSpecType.RepoSpecTypeOci,
        registry: testRegistry,
        namespace: testNs,
      }),
    ).toBe('namespace');
    expect(
      getOciPlacementModeFromSpec({
        type: RepoSpecType.RepoSpecTypeOci,
        registry: testRegistry,
      }),
    ).toBe('registry');
  });

  it('builds OCI display paths and delta push previews', () => {
    expect(
      getOciRepoDisplayPath({
        type: RepoSpecType.RepoSpecTypeOci,
        registry: testRegistry,
        repository: testRepo,
      }),
    ).toBe('my-registry.com/my-org/diffs');

    expect(
      getDeltaPushPathPreview({
        registry: testRegistry,
        placementMode: 'registry',
      } as DefinedOciConfig),
    ).toBe('my-registry.com/example/app');

    expect(
      getDeltaPushPathPreview({
        registry: testRegistry,
        placementMode: 'repository',
        repository: testRepo,
      } as DefinedOciConfig),
    ).toBe('my-registry.com/my-org/diffs');

    expect(
      getDeltaPushPathPreview({
        registry: testRegistry,
        placementMode: 'namespace',
        namespace: testNs,
      } as DefinedOciConfig),
    ).toBe('my-registry.com/my-org/app');

    expect(
      getDeltaPushPathPreview({
        registry: testRegistry,
        placementMode: 'repository',
      } as DefinedOciConfig),
    ).toBeUndefined();

    expect(
      getDeltaPushPathPreview({
        registry: testRegistry,
        placementMode: 'namespace',
      } as DefinedOciConfig),
    ).toBeUndefined();
  });

  it('maps delta target create payload for each placement mode', () => {
    const baseFormValues = getOciFormValues();

    expect(getRepository(baseFormValues).spec).toMatchObject({
      registry: testRegistry,
      deltaStorageTarget: true,
      accessMode: OciRepoSpec.accessMode.READ_WRITE,
    });

    expect(
      getRepository(
        getOciFormValues({
          placementMode: 'repository',
          repository: testRepo,
        }),
      ).spec,
    ).toMatchObject({
      repository: testRepo,
    });

    expect(
      getRepository(
        getOciFormValues({
          placementMode: 'namespace',
          namespace: testNs,
        }),
      ).spec,
    ).toMatchObject({
      namespace: testNs,
    });
  });

  it('omits delta fields from getRepository when allowDeltaStorage is false', () => {
    const baseFormValues = getOciFormValues({
      placementMode: 'repository',
      repository: testRepo,
    });
    const spec = getRepository({
      ...baseFormValues,
      allowDeltaStorage: false,
    }).spec;

    expect(spec).toMatchObject({
      registry: testRegistry,
      accessMode: OciRepoSpec.accessMode.READ_WRITE,
    });
    expect(spec).not.toHaveProperty('deltaStorageTarget');
    expect(spec).not.toHaveProperty('repository');
  });

  it('round-trips delta fields in getInitValues', () => {
    const repository = existingDeltaRepository();
    const values = getInitValues({ repository });
    expect(values.ociConfig).toMatchObject({
      deltaStorageTarget: true,
      placementMode: 'repository',
      repository: testRepo,
    });
  });

  it('patches delta storage fields on edit', () => {
    const repository = existingDeltaRepository();
    const values = getInitValues({ repository });
    const updatedValues = {
      ...values,
      ociConfig: {
        ...values.ociConfig!,
        placementMode: 'namespace' as const,
        repository: '',
        namespace: 'team-a',
      },
    };

    const patches = getRepositoryPatches(updatedValues, repository);
    expect(patches).toEqual(
      expect.arrayContaining([
        { op: 'remove', path: '/spec/repository' },
        { op: 'add', path: '/spec/namespace', value: 'team-a' },
      ]),
    );
  });

  it('removes delta storage target and path fields when disabled', () => {
    const repository = existingDeltaRepository();
    const values = getInitValues({ repository });
    const updatedValues = {
      ...values,
      ociConfig: {
        ...values.ociConfig!,
        deltaStorageTarget: false,
        placementMode: 'registry' as const,
        repository: '',
        namespace: '',
      },
    };

    const patches = getRepositoryPatches(updatedValues, repository);
    expect(patches).toEqual(
      expect.arrayContaining([
        { op: 'remove', path: '/spec/deltaStorageTarget' },
        { op: 'remove', path: '/spec/repository' },
      ]),
    );
  });

  it('detects duplicate delta storage target API errors', () => {
    expect(isDuplicateDeltaStorageTargetError(new Error('Error 409: deltaStorageTarget already exists'))).toBe(true);
    expect(isDuplicateDeltaStorageTargetError(new Error('Error 400: bad request'))).toBe(false);
  });

  it('rejects read-only access mode with delta storage target', async () => {
    const values = getOciFormValues({
      accessMode: OciRepoSpec.accessMode.READ,
    });
    const schema = repositorySchema(t, undefined)(values);
    await expect(schema.validate(values)).rejects.toThrow();
  });

  it('requires repository path when placement mode is repository', async () => {
    const values = getOciFormValues({
      placementMode: 'repository',
      repository: '',
    });
    const schema = repositorySchema(t, undefined)(values);
    await expect(schema.validate(values)).rejects.toThrow();
  });
});
