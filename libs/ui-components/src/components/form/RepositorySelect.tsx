import * as React from 'react';
import { useFormikContext } from 'formik';
import { Button, FormGroup, Icon, MenuFooter } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { TFunction } from 'react-i18next';

import { RepoSpecType, Repository } from '@flightctl/types';
import { useTranslation } from '../../hooks/useTranslation';
import CreateRepositoryModal from '../modals/CreateRepositoryModal/CreateRepositoryModal';
import { getRepoUrlOrRegistry } from '../Repository/CreateRepository/utils';
import FormSelect from './FormSelect';

export const getRepositoryItems = (
  t: TFunction,
  repositories: Repository[],
  repoType: RepoSpecType,
  forcedRepoName?: string,
) => {
  const repositoryItems = repositories
    .filter((repo) => repo.spec.type === repoType)
    .reduce((acc, curr) => {
      const repoName = curr.metadata.name as string;
      acc[repoName] = {
        label: repoName,
        description: getRepoUrlOrRegistry(curr.spec),
      };
      return acc;
    }, {});
  // If there's a broken reference to a repository, we must add an item so the name shows in the dropdown
  if (forcedRepoName && !repositoryItems[forcedRepoName]) {
    repositoryItems[forcedRepoName] = {
      label: forcedRepoName,
      description: (
        <>
          <Icon size="sm" status="danger">
            <ExclamationCircleIcon />
          </Icon>{' '}
          {t('Missing repository')}
        </>
      ),
    };
  }
  return repositoryItems;
};

type RepositorySelectProps = {
  name: string;
  repositories: Repository[];
  repoType: RepoSpecType;
  selectedRepoName?: string;
  canCreateRepo: boolean;
  isReadOnly?: boolean;
  repoRefetch?: VoidFunction;
  isRequired?: boolean;
  label?: string;
};

const RepositorySelect = ({
  name,
  repositories,
  repoType,
  selectedRepoName,
  canCreateRepo,
  isReadOnly,
  repoRefetch,
  label,
  isRequired,
}: RepositorySelectProps) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext();
  const [createRepoModalOpen, setCreateRepoModalOpen] = React.useState(false);

  const isRegistryType = repoType === RepoSpecType.OCI;

  // CELIA-WIP If it's read only can we still select or is it blocked?
  const repositoryItems = getRepositoryItems(t, repositories, repoType, selectedRepoName);

  const handleCreateRepository = (repo: Repository) => {
    setCreateRepoModalOpen(false);
    if (repoRefetch) {
      repoRefetch();
    }
    void setFieldValue(name, repo.metadata.name, true);
  };

  return (
    <>
      <FormGroup label={label || (isRegistryType ? t('Registry') : t('Repository'))} isRequired={isRequired}>
        <FormSelect
          name={name}
          items={repositoryItems}
          withStatusIcon
          placeholderText={isRegistryType ? t('Select a registry') : t('Select a repository')}
          isDisabled={isReadOnly}
        >
          {canCreateRepo && (
            <MenuFooter>
              <Button
                variant="link"
                isInline
                icon={<PlusCircleIcon />}
                onClick={() => {
                  setCreateRepoModalOpen(true);
                }}
                isDisabled={isReadOnly}
              >
                {isRegistryType ? t('Create registry') : t('Create repository')}
              </Button>
            </MenuFooter>
          )}
        </FormSelect>
      </FormGroup>
      {createRepoModalOpen && (
        <CreateRepositoryModal
          type={repoType}
          onClose={() => setCreateRepoModalOpen(false)}
          onSuccess={handleCreateRepository}
        />
      )}
    </>
  );
};

export default RepositorySelect;
