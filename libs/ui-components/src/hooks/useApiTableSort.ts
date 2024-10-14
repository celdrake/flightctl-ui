import * as React from 'react';
import { ThProps } from '@patternfly/react-table';

import { ApiSortTableColumn } from '../components/Table/Table';

const getDefaultSortField = (columns: ApiSortTableColumn[]) => {
  let defaultSortCol = columns.find((c) => c.defaultSort);
  if (!defaultSortCol) {
    defaultSortCol = columns.find((c) => !!c.sortableField);
  }
  return defaultSortCol?.sortableField || '';
};

export const useApiTableSort = (columns: ApiSortTableColumn[]) => {
  const [activeSortField, setActiveSortField] = React.useState<string>(getDefaultSortField(columns));
  const [activeSortDirection, setActiveSortDirection] = React.useState<'Asc' | 'Desc'>('Asc');

  const getSortParams = React.useCallback(
    (columnIndex: number): ThProps['sort'] => {
      const columnData = columns[columnIndex];
      if (!columnData.sortableField) {
        return undefined;
      }

      const activeColumnIndex = columns.findIndex((column) => column.sortableField === activeSortField);
      return {
        sortBy: {
          index: activeColumnIndex === -1 ? 0 : activeColumnIndex,
          direction: activeSortDirection === 'Asc' ? 'asc' : 'desc',
          defaultDirection: 'asc',
        },
        onSort: (_, index, direction) => {
          const column = columns[index];
          setActiveSortField(column.sortableField || '');
          setActiveSortDirection(direction === 'asc' ? 'Asc' : 'Desc');
        },
        columnIndex,
      };
    },
    [columns, activeSortField, activeSortDirection],
  );

  return {
    getSortParams,
    activeSortQuery: activeSortField ? `sortBy=${activeSortField}&sortOrder=${activeSortDirection}` : '',
  };
};
