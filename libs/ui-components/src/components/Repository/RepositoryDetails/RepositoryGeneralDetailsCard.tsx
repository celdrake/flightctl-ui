import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Icon,
  Label,
  Popover,
} from '@patternfly/react-core';
import { LockIcon } from '@patternfly/react-icons/dist/js/icons/lock-icon';
import { LockOpenIcon } from '@patternfly/react-icons/dist/js/icons/lock-open-icon';

import type { OciRepoSpec, Repository } from '@flightctl/types';

import { getLastTransitionTimeText } from '../../../utils/status/repository';
import { useTranslation } from '../../../hooks/useTranslation';
import RepositoryStatus from '../../Status/RepositoryStatus';
import {
  getOciRepoPushDisplayPath,
  getRepoTypeLabel,
  getRepoUrlOrRegistry,
  hasCredentialsSettings,
  isHttpRepoSpec,
  isOciRepoSpec,
} from '../CreateRepository/utils';
import { GitRepositoryLink, HttpRepositoryUrl } from './RepositorySource';

const RepoPrivacy = ({ repo }: { repo: Repository }) => {
  const { t } = useTranslation();

  const isPrivate = hasCredentialsSettings(repo.spec);

  return isPrivate ? (
    <>
      <Icon>
        <LockIcon />
      </Icon>{' '}
      {t('Private repository')}
    </>
  ) : (
    <>
      <Icon>
        <LockOpenIcon />
      </Icon>{' '}
      {t('Public repository')}
    </>
  );
};

const RegistryOrUrl = ({ repo }: { repo: Repository }) => {
  const urlOrRegistry = getRepoUrlOrRegistry(repo.spec);
  if (isOciRepoSpec(repo.spec)) {
    return <div>{urlOrRegistry}</div>;
  }
  if (isHttpRepoSpec(repo.spec)) {
    return <HttpRepositoryUrl url={urlOrRegistry} />;
  }
  return <GitRepositoryLink url={urlOrRegistry} />;
};

const ImagePlacementDetails = ({ spec }: { spec: OciRepoSpec }) => {
  const { t } = useTranslation();

  const { repository, namespace } = spec;
  return (
    <>
      <span className="pf-v6-u-font-weight-bold">{spec.namespace ? t('Namespace') : t('Repository')}</span>:{' '}
      {spec.namespace ? namespace : repository}
      <p className="pf-v6-u-mt-md">
        {t('Example: An image named "my-org/my-app" would be stored at {{path}}.', {
          path: getOciRepoPushDisplayPath(spec),
        })}
      </p>
    </>
  );
};

const DetailsTab = ({ repoDetails }: { repoDetails: Repository }) => {
  const { t } = useTranslation();

  const spec = repoDetails.spec;
  const repoLabel = getRepoTypeLabel(t, spec.type);
  const isOciRepo = isOciRepoSpec(spec);

  return (
    <Card>
      <CardTitle>{t('Details')}</CardTitle>
      <CardBody>
        <DescriptionList columnModifier={{ lg: '3Col' }}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
            <DescriptionListDescription>{repoLabel}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{isOciRepo ? t('Registry') : t('URL')}</DescriptionListTerm>
            <DescriptionListDescription>
              <RegistryOrUrl repo={repoDetails} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          {isOciRepo && spec.deltaStorageTarget && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Delta repository')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Label isCompact variant="outline" color="blue">
                  {t('Enabled')}
                </Label>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {isOciRepo && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Image placement')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Popover
                  headerContent={t('Placement configuration')}
                  bodyContent={<ImagePlacementDetails spec={spec} />}
                >
                  <Button variant="link" isInline>
                    {t('View details')}
                  </Button>
                </Popover>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              {' '}
              {repoDetails ? (
                <RepositoryStatus repository={repoDetails} data-testid="repository-details-sync-status" />
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Privacy')}</DescriptionListTerm>
            <DescriptionListDescription>
              <RepoPrivacy repo={repoDetails} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Last transition')}</DescriptionListTerm>
            <DescriptionListDescription>
              {repoDetails ? getLastTransitionTimeText(repoDetails, t).text : '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default DetailsTab;
