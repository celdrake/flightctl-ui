import * as React from 'react';
import { useField, useFormikContext } from 'formik';
import {
  Button,
  FormGroup,
  Icon,
  MenuFooter,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { TFunction } from 'react-i18next';

import { RepoSpecType, Repository } from '@flightctl/types';
import { useTranslation } from '../../hooks/useTranslation';
import CreateRepositoryModal from '../modals/CreateRepositoryModal/CreateRepositoryModal';
import { getRepoUrlOrRegistry } from '../Repository/CreateRepository/utils';
import { isAccessibleRepository } from '../../utils/status/repository';
import FormSelect, { SelectItem } from './FormSelect';
import { StatusDisplayContent } from '../Status/StatusDisplay';

export const getRepositoryItems = (
  t: TFunction,
  repositories: Repository[],
  repoType: RepoSpecType,
  selectedRepoName?: string,
  // Returns an error message if the repository cannot be selected
  validateRepoSelection?: (repo: Repository) => string | undefined,
) => {
  const invalidRepoItems: Record<string, SelectItem> = {};
  const validRepoItems: Record<string, SelectItem> = {};

  repositories
    .filter((repo) => {
      return repo.spec.type === repoType;
    })
    .forEach((repo) => {
      const selectionError = validateRepoSelection ? validateRepoSelection(repo) : undefined;
      const repoName = repo.metadata.name as string;
      if (selectionError) {
        invalidRepoItems[repoName] = {
          label: repoName,
          description: (
            <Stack>
              <StackItem>{getRepoUrlOrRegistry(repo.spec)}</StackItem>
              <StackItem>{selectionError}</StackItem>
            </Stack>
          ),
        };
      } else {
        const isAccessible = isAccessibleRepository(repo);
        const urlOrRegistry = getRepoUrlOrRegistry(repo.spec);

        validRepoItems[repoName] = {
          label: repoName,
          description: (
            <Stack>
              <StackItem>{urlOrRegistry}</StackItem>
              <StackItem>
                <StatusDisplayContent
                  label={isAccessible ? t('Accessible') : t('Not marked as accessible yet')}
                  level={isAccessible ? 'success' : 'warning'}
                />
              </StackItem>
            </Stack>
          ),
        };
      }
    });

  // If the selected repository has been removed, we still consider it "valid" since it needs to be selected initially
  const isSelectedRepoMissing =
    selectedRepoName && !repositories.some((repo) => repo.metadata.name === selectedRepoName);
  if (isSelectedRepoMissing && !validRepoItems[selectedRepoName]) {
    validRepoItems[selectedRepoName] = {
      label: selectedRepoName,
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

  return { validRepoItems, invalidRepoItems };
};

type RepositorySelectProps = {
  name: string;
  label?: string;
  repositories: Repository[];
  repoType: RepoSpecType;
  canCreateRepo: boolean;
  isReadOnly?: boolean;
  repoRefetch?: VoidFunction;
  isRequired?: boolean;
  validateRepoSelection?: (repo: Repository) => string | undefined;
};

const ReadOnlyRepositoryListItem = ({ invalidRepoItems }: { invalidRepoItems: Record<string, SelectItem> }) => {
  const itemKeys = Object.keys(invalidRepoItems);
  if (itemKeys.length === 0) {
    return null;
  }
  return (
    <SelectList className="fctl-form-select__menu">
      {itemKeys.map((key) => {
        const item = invalidRepoItems[key];
        return (
          <SelectOption key={key} value={key} description={item.description} isDisabled>
            {item.label}
          </SelectOption>
        );
      })}
    </SelectList>
  );
};

const RepositorySelect = ({
  name,
  repositories,
  repoType,
  canCreateRepo,
  isReadOnly,
  repoRefetch,
  label,
  isRequired,
  validateRepoSelection,
}: RepositorySelectProps) => {
  const { t } = useTranslation();
  const { setFieldValue, setFieldError } = useFormikContext();
  const [field] = useField<string>(name);
  const [createRepoModalOpen, setCreateRepoModalOpen] = React.useState(false);

  const { validRepoItems, invalidRepoItems } = React.useMemo(() => {
    return getRepositoryItems(t, repositories, repoType, field.value, validateRepoSelection);
  }, [t, repositories, repoType, field.value, validateRepoSelection]);

  const handleCreateRepository = (repo: Repository) => {
    setCreateRepoModalOpen(false);
    if (repoRefetch) {
      repoRefetch();
    }

    // If the created repository cannot be selected, we set the error and skip marking the repository as selected
    if (validateRepoSelection) {
      const selectionError = validateRepoSelection(repo);
      if (selectionError) {
        setFieldError(name, selectionError);
        return;
      }
    }

    void setFieldValue(name, repo.metadata.name, true);
  };

  const isRegistryType = repoType === RepoSpecType.OCI;
  return (
    <>
      <FormGroup label={label || (isRegistryType ? t('Registry') : t('Repository'))} isRequired={isRequired}>
        <FormSelect
          name={name}
          items={validRepoItems}
          withStatusIcon
          placeholderText={isRegistryType ? t('Select a registry') : t('Select a repository')}
          isDisabled={isReadOnly}
        >
          <ReadOnlyRepositoryListItem invalidRepoItems={invalidRepoItems} />

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
