import { defineConfig } from 'i18next-cli';

// Trans translations must be defined like this:

// <Trans
//   t={t}
//   i18nKey="Some text <bold>{{myVar}}</bold> etc."
//   values={{ myVar }}
//   components={{ bold: <b /> }}
// />

export default defineConfig({
  locales: ['en'],
  extract: {
    input: ['../../{libs,apps}/*/src/**/*.{js,jsx,ts,tsx}'],
    output: 'locales/{{language}}/{{namespace}}.json',
    defaultNS: 'translation',
    keySeparator: false,
    nsSeparator: '~',
    transComponents: ['Trans'],
    removeUnusedKeys: true,
    sort: true,
    defaultValue: (key) => key.replace(/_(zero|one|two|few|many|other)$/, ''),
    functions: ['t', '*.t'],
  },
});
