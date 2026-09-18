import * as React from 'react';

import { type CatalogItem, CatalogItemCategory } from '@flightctl/types/alpha';
import appIcon from '../../../assets/application.svg';
import osIcon from '../../../assets/os.svg';

const sizeStyles = {
  sm: { width: '2rem', height: '2rem', objectFit: 'contain' as const },
  md: { maxWidth: '40px' },
};

type CatalogItemIconProps = {
  catalogItem: CatalogItem;
  /** `md` (default) for catalog cards/details; `sm` for compact ref headers. */
  size?: keyof typeof sizeStyles;
};

const getCatalogItemIcon = (catalogItem: CatalogItem): string =>
  catalogItem.spec.icon ||
  ((catalogItem.spec.category === CatalogItemCategory.CatalogItemCategorySystem ? osIcon : appIcon) as string);

const CatalogItemIcon = ({ catalogItem, size = 'md' }: CatalogItemIconProps) => (
  <img src={getCatalogItemIcon(catalogItem)} alt={`${catalogItem.metadata.name} icon`} style={sizeStyles[size]} />
);

export default CatalogItemIcon;
