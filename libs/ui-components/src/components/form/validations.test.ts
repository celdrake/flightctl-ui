import { beforeAll, describe, expect, it } from 'vitest';
import i18next from 'i18next';
import * as Yup from 'yup';
import { getIn, yupToFormErrors } from 'formik';

import { AppType } from '@flightctl/types';
import { AppSpecType, type ApplicationEntry, type PortMapping, type UpdatePolicyForm } from '../../types/deviceSpec';
import { UpdateScheduleMode } from '../../utils/time';
import { isDuplicatePortMapping, validApplicationsSchema, validUpdatePolicySchema } from './validations';

const app = (name: string, ports: PortMapping[]): ApplicationEntry => ({
  type: 'manual',
  app: {
    appType: AppType.AppTypeContainer,
    specType: AppSpecType.OCI_IMAGE,
    name,
    image: 'docker.io/library/nginx:stable-alpine',
    ports,
    cpuLimit: '',
    memoryLimit: '',
    variables: [],
    volumes: [],
  },
});

const translations = i18next.createInstance();
const schema = Yup.object({ applications: validApplicationsSchema(translations.t) });

const oneTimeOnlyUpdatePolicy = (overrides: Partial<UpdatePolicyForm> = {}): UpdatePolicyForm => ({
  isCustomized: true,
  downloadAndInstallDiffer: false,
  downloadStartsAt: '00:00',
  downloadEndsAt: '23:59',
  downloadStartGraceDuration: '0s',
  downloadScheduleMode: UpdateScheduleMode.Daily,
  downloadWeekDays: [true, true, true, true, true, true, true],
  downloadTimeZone: 'UTC',
  installStartsAt: '00:00',
  installEndsAt: '23:59',
  installStartGraceDuration: '0s',
  installScheduleMode: UpdateScheduleMode.Daily,
  installWeekDays: [true, true, true, true, true, true, true],
  installTimeZone: 'UTC',
  downloadOneTimeWindows: [{ id: '1', date: '2026-11-15', startsAt: '22:00', endsAt: '23:30' }],
  installOneTimeWindows: [],
  ...overrides,
});

beforeAll(async () => {
  await translations.init({ lng: 'en', resources: { en: { translation: {} } } });
});

describe('container host port validation', () => {
  it.each(['hostPort', 'targetPort'] as const)(
    'preserves duplicate and invalid port errors when a mapping has an invalid %s',
    async (invalidField) => {
      const mappings = [{ hostPort: '8080', targetPort: '80' }];
      if (invalidField === 'targetPort') {
        mappings[0].targetPort = '70000';
      } else {
        mappings.push({ hostPort: '70000', targetPort: '80' });
      }
      const error = await schema
        .validate(
          {
            applications: [app('port-test-a', mappings), app('port-test-b', [{ hostPort: '8080', targetPort: '81' }])],
          },
          { abortEarly: false },
        )
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Yup.ValidationError);
      const errors = yupToFormErrors(error as Yup.ValidationError);
      expect(getIn(errors, 'applications[0].app.ports')).toBe(
        'Port must be between 1 and 65535 The following host ports are used in more than one application: 8080',
      );
    },
  );

  it('reports invalid mappings at the combined field without a duplicate', async () => {
    const error = await schema
      .validate({ applications: [app('port-test-a', [{ hostPort: '', targetPort: '70000' }])] }, { abortEarly: false })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Yup.ValidationError);
    expect(getIn(yupToFormErrors(error as Yup.ValidationError), 'applications[0].app.ports')).toBe(
      'Host port is required Port must be between 1 and 65535',
    );
  });

  it.each(['80', '81'])('rejects host port reuse across applications with target port %s', async (targetPort) => {
    const applications = [
      app('port-test-a', [{ hostPort: '8080', targetPort: '80' }]),
      app('port-test-b', [{ hostPort: '8080', targetPort }]),
    ];

    const error = await schema.validate({ applications }, { abortEarly: false }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Yup.ValidationError);
    expect((error as Yup.ValidationError).inner.map(({ path }) => path)).toEqual([
      'applications[0].app.ports',
      'applications[1].app.ports',
    ]);
    expect((error as Yup.ValidationError).errors).toContain(
      'The following host ports are used in more than one application: 8080',
    );
  });

  it('lists every conflicting host port once at the combined ports field', async () => {
    const error = await schema
      .validate(
        {
          applications: [
            app('port-test-a', [
              { hostPort: '8080', targetPort: '80' },
              { hostPort: '9090', targetPort: '90' },
              { hostPort: '8080', targetPort: '81' },
              { hostPort: '7070', targetPort: '70' },
            ]),
            app('port-test-b', [{ hostPort: '9090', targetPort: '91' }]),
          ],
        },
        { abortEarly: false },
      )
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Yup.ValidationError);
    expect((error as Yup.ValidationError).inner).toEqual([
      expect.objectContaining({
        path: 'applications[0].app.ports',
        message: 'The following host ports are used in more than one application: 8080, 9090',
      }),
      expect.objectContaining({
        path: 'applications[1].app.ports',
        message: 'The following host ports are used in more than one application: 9090',
      }),
    ]);
  });

  it('rejects host port reuse within an application', async () => {
    await expect(
      schema.validate({
        applications: [
          app('port-test-a', [
            { hostPort: '8080', targetPort: '80' },
            { hostPort: '8080', targetPort: '81' },
          ]),
        ],
      }),
    ).rejects.toBeInstanceOf(Yup.ValidationError);
  });

  it('allows applications to use the same container port on different host ports', async () => {
    const value = {
      applications: [
        app('port-test-a', [{ hostPort: '8080', targetPort: '80' }]),
        app('port-test-b', [{ hostPort: '8081', targetPort: '80' }]),
      ],
    };
    await expect(schema.validate(value)).resolves.toEqual(value);
  });

  it('allows removing a conflicting mapping', async () => {
    await expect(
      schema.isValid({
        applications: [app('port-test-a', [{ hostPort: '8080', targetPort: '80' }]), app('port-test-b', [])],
      }),
    ).resolves.toBe(true);
  });

  it('detects an occupied host port in the port editor regardless of target port', () => {
    expect(isDuplicatePortMapping('8080', '81', [{ hostPort: '8080', targetPort: '80' }])).toBe(true);
  });
});

describe('validUpdatePolicySchema', () => {
  it('accepts a one-time-only update policy without recurring fields', () => {
    expect(validUpdatePolicySchema(translations.t).isValidSync(oneTimeOnlyUpdatePolicy())).toBe(true);
  });

  it('rejects a one-time window whose end equals its start', () => {
    const policy = oneTimeOnlyUpdatePolicy({
      downloadOneTimeWindows: [{ id: '1', date: '2026-11-15', startsAt: '22:00', endsAt: '22:00' }],
    });
    expect(validUpdatePolicySchema(translations.t).isValidSync(policy)).toBe(false);
  });
});
