import * as React from 'react';
import { Formik, type FormikProps } from 'formik';
import { Alert } from '@patternfly/react-core';
import { type TFunction } from 'i18next';
import * as Yup from 'yup';

import { LabelSyncProvenanceItem, type Device } from '@flightctl/types';
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

type ApiLabels = Record<string, string>;

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

const omitManagedLabels = (labels: ApiLabels, managedLabelKeys: string[]): ApiLabels => {
  const result = {};

  for (const [key, value] of Object.entries(labels)) {
    if (key !== 'alias' && !managedLabelKeys.includes(key)) {
      result[key] = value;
    }
  }
  return result;
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
    <div style={{ border: '2px solid lime' }}>
      <LabelsField name="labels" isLoading={isSubmitting} onChangeCallback={onChangedLabels} />
      {submitError && <Alert isInline title={submitError} variant="danger" />}
    </div>
  );
};

type EditLabelsFormProps = {
  device: Device;
  onDeviceUpdate: () => void;
  managedLabelKeys?: string[];
};

export const ViewLabels = ({ device, managedLabelKeys = [] }: { device: Device; managedLabelKeys?: string[] }) => {
  const viewableLabels = omitManagedLabels(device.metadata.labels || {}, managedLabelKeys);
  return <LabelsView prefix="read-only-labels" labels={viewableLabels} />;
};

const EditLabelsForm = ({ device, onDeviceUpdate, managedLabelKeys = [] }: EditLabelsFormProps) => {
  const { t } = useTranslation();
  const { patch } = useFetch();

  const currentLabels = device.metadata.labels || {};
  const editableLabels = fromAPILabel(omitManagedLabels(currentLabels, managedLabelKeys));

  return (
    <Formik<EditLabelsFormValues>
      initialValues={{
        labels: editableLabels,
      }}
      onSubmit={async (values: EditLabelsFormValues) => {
        try {
          // Re-attach managed labels so a replace of /metadata/labels does not wipe them.
          // CELIA-WIP: in theory we don't need to re-attach managed labels, check after Kyle's changes.
          // But need to reattach "alias" label.
          const labelsPatch = getDeviceLabelPatches(currentLabels, values.labels);
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
