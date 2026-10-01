import * as React from 'react';
import { Formik, type FormikProps } from 'formik';
import { Alert } from '@patternfly/react-core';
import { type TFunction } from 'i18next';
import * as Yup from 'yup';

import { type Device } from '@flightctl/types';
import LabelsField from '../../form/LabelsField';
import { type FlightCtlLabel } from '../../../types/extraTypes';
import { useFetch } from '../../../hooks/useFetch';
import { useTranslation } from '../../../hooks/useTranslation';
import { fromAPILabel } from '../../../utils/labels';
import { validLabelsSchema } from '../../form/validations';
import { getErrorMessage } from '../../../utils/error';
import { getDeviceLabelPatches } from '../../../utils/patches/patch';
import LabelsView from '../../common/LabelsView';

type EditLabelsFormValues = {
  labels: FlightCtlLabel[];
};

type EditLabelsFormContentProps = {
  isSubmitting: FormikProps<EditLabelsFormValues>['isSubmitting'];
  submitForm: (values: EditLabelsFormValues) => Promise<string>;
};

const forbiddenDeviceLabels = ['alias'];

const getValidationSchema = (t: TFunction) => {
  return Yup.object<EditLabelsFormValues>({
    labels: validLabelsSchema(t, forbiddenDeviceLabels),
  });
};

const omitLabelKeys = (
  labels: Record<string, string>,
  omittedKeys: Set<string>,
): Record<string, string> => {
  if (omittedKeys.size === 0) {
    return labels;
  }
  return Object.fromEntries(Object.entries(labels).filter(([key]) => !omittedKeys.has(key)));
};

const EditLabelsFormContent = ({ isSubmitting, submitForm }: EditLabelsFormContentProps) => {
  const [submitError, setSubmitError] = React.useState<string>();

  const onChangedLabels = async (newLabels: FlightCtlLabel[], hasErrors: boolean) => {
    setSubmitError(undefined);
    if (!hasErrors) {
      const error = await submitForm({ labels: newLabels });
      setSubmitError(error);
    }
  };

  return (
    <>
      <LabelsField name="labels" isLoading={isSubmitting} onChangeCallback={onChangedLabels} />
      {submitError && <Alert isInline title={submitError} variant="danger" />}
    </>
  );
};

type EditLabelsFormProps = {
  device: Device;
  onDeviceUpdate: () => void;
  /** Labels that must not appear in the editor and must be preserved on save. */
  managedLabels?: Record<string, string>;
};

export const ViewLabels = ({
  device,
  managedLabels = {},
}: {
  device: Device;
  managedLabels?: Record<string, string>;
}) => {
  const omittedKeys = new Set(Object.keys(managedLabels));
  const currentLabels = omitLabelKeys(device.metadata.labels || {}, omittedKeys);
  return <LabelsView prefix="read-only-labels" labels={currentLabels} />;
};

const EditLabelsForm = ({ device, onDeviceUpdate, managedLabels = {} }: EditLabelsFormProps) => {
  const { t } = useTranslation();
  const { patch } = useFetch();

  const omittedKeys = React.useMemo(() => new Set(Object.keys(managedLabels)), [managedLabels]);
  const currentLabelsMap = device.metadata.labels || {};
  const editableLabelsList = fromAPILabel(omitLabelKeys(currentLabelsMap, omittedKeys)).filter(
    (label) => label.key !== 'alias',
  );

  return (
    <Formik<EditLabelsFormValues>
      initialValues={{
        labels: editableLabelsList,
      }}
      onSubmit={async (values: EditLabelsFormValues) => {
        try {
          // Re-attach managed labels so a replace of /metadata/labels does not wipe them.
          const labelsToPatch = values.labels.concat(fromAPILabel(managedLabels));
          const labelsPatch = getDeviceLabelPatches(currentLabelsMap, labelsToPatch);
          if (labelsPatch.length > 0) {
            await patch(`devices/${device.metadata.name}`, labelsPatch);
            onDeviceUpdate();
          }
          return null;
        } catch (e) {
          return getErrorMessage(e);
        }
      }}
      validationSchema={getValidationSchema(t)}
    >
      {({ isSubmitting, submitForm }) => <EditLabelsFormContent isSubmitting={isSubmitting} submitForm={submitForm} />}
    </Formik>
  );
};

export default EditLabelsForm;
