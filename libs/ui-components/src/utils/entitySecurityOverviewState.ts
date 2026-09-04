import type { Vulnerability } from '@flightctl/types/alpha';

type Severity = Vulnerability['severity'];

export const getTileSelectedSeverity = (selectedSeverities: Severity[]): Severity | null =>
  selectedSeverities.length === 1 ? selectedSeverities[0] : null;

export const getSeverityToggleResult = (
  severity: Severity,
  selectedSeverities: Severity[],
): { selectedSeverities: Severity[]; expandTable: boolean } => {
  if (selectedSeverities.length === 1 && selectedSeverities[0] === severity) {
    return { selectedSeverities: [], expandTable: false };
  }

  return { selectedSeverities: [severity], expandTable: true };
};
