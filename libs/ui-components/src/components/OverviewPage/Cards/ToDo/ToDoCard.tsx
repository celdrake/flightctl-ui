import * as React from 'react';
import {
  Bullseye,
  Card,
  CardBody,
  CardTitle,
  List,
  ListItem,
  Spinner,
  Split,
  SplitItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { EnrollmentRequestList } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useFetchPeriodically } from '../../../../hooks/useFetchPeriodically';
import { Link, ROUTE } from '../../../../hooks/useNavigate';
import ErrorAlert from '../../../ErrorAlert/ErrorAlert';
import { getApiListCount } from '../../../../utils/api';

const ToDoCard = () => {
  const { t } = useTranslation();
  const [erList, loading, error] = useFetchPeriodically<EnrollmentRequestList>({
    endpoint: 'enrollmentrequests?fieldSelector=!status.approval.approved&limit=1',
  });
  const pendingErCount = getApiListCount(erList) || 0;

  let content: React.ReactNode;
  if (loading) {
    content = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  } else if (error) {
    content = <ErrorAlert error={error} />;
  } else {
    if (pendingErCount) {
      content = (
        <List>
          <ListItem>
            <Split hasGutter>
              <SplitItem isFilled>{t('{{ count }} devices pending approval', { count: pendingErCount })}</SplitItem>
              <SplitItem>
                <Link to={ROUTE.DEVICES}>{t('Review pending devices', { count: pendingErCount })}</Link>
              </SplitItem>
            </Split>
          </ListItem>
        </List>
      );
    } else {
      content = (
        <Bullseye>
          <TextContent>
            <Text component={TextVariants.small}>{t('All good!')}</Text>
          </TextContent>
        </Bullseye>
      );
    }
  }

  return (
    <Card>
      <CardTitle>{t('To do')}</CardTitle>
      <CardBody>{content}</CardBody>
    </Card>
  );
};

export default ToDoCard;
