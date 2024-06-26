import * as React from 'react';
import fuzzy from 'fuzzysearch';

export const useTableTextSearch = <D>(
  data: D[],
  getText: (datum: D) => Array<string | undefined>,
): { search: string; setSearch: (value: string) => void; filteredData: D[] } => {
  const [search, setSearch] = React.useState<string>('');

  const filteredData = React.useMemo(() => {
    return data.filter((d) => {
      const texts = getText(d);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return texts.some((t) => t && fuzzy(search, t));
    });
  }, [data, search, getText]);

  return {
    search,
    setSearch,
    filteredData,
  };
};
