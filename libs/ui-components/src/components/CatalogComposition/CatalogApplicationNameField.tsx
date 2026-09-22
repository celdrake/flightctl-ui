import * as React from 'react';
import {
  Button,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  FormGroup,
  Icon,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/js/icons/pencil-alt-icon';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import TextField from '../form/TextField';

type CatalogApplicationNameFieldProps = {
  defaultAppName: string;
};

const CatalogApplicationNameField = ({ defaultAppName }: CatalogApplicationNameFieldProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = React.useState(false);
  const { values, setFieldValue } = useFormikContext<{ applicationName: string }>();

  React.useEffect(() => {
    setIsEditing(false);
  }, [defaultAppName]);

  return (
    <FormGroup label={t('Application name')} isRequired fieldId="catalog-app-name">
      {isEditing ? (
        <Stack hasGutter>
          <StackItem>
            <TextField
              name="applicationName"
              aria-label={t('Application name')}
              helperText={t('Must be unique within this template.')}
            />
          </StackItem>
          <StackItem>
            <Button
              variant="link"
              isInline
              onClick={() => {
                void setFieldValue('applicationName', defaultAppName, false);
                setIsEditing(false);
              }}
            >
              {t('Cancel')}
            </Button>
          </StackItem>
        </Stack>
      ) : (
        <>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Content component={ContentVariants.p}>{values.applicationName}</Content>
            </FlexItem>
            <FlexItem>
              <Button
                variant="link"
                aria-label={t('Edit name')}
                onClick={() => setIsEditing(true)}
                icon={
                  <Icon size="sm">
                    <PencilAltIcon />
                  </Icon>
                }
              />
            </FlexItem>
          </Flex>
        </>
      )}
    </FormGroup>
  );
};

export default CatalogApplicationNameField;
