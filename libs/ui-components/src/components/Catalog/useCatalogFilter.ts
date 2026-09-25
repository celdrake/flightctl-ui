import * as React from 'react';
import { type CatalogTypeFilter } from './useCatalogItems';

export type CatalogFilter = {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  typeFilter: CatalogTypeFilter;
  setTypeFilter: (typeFilter: CatalogTypeFilter) => void;
  catalogs: string[];
  setCatalogs: React.Dispatch<React.SetStateAction<string[]>>;
};

export const useCatalogFilter = (): CatalogFilter => {
  const [nameFilter, setNameFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<CatalogTypeFilter>({});
  const [catalogs, setCatalogs] = React.useState<string[]>([]);

  return {
    nameFilter,
    setNameFilter,
    typeFilter,
    setTypeFilter,
    catalogs,
    setCatalogs,
  };
};
