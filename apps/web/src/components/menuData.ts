export type MegaColumn = {
  title: string;
  items: { label: string; href: string }[];
};

export type MegaItem = {
  id: string;
  icon: string;
  label: string;
  href?: string;
  columns?: MegaColumn[];
};

export const MENU: MegaItem[] = [
  {
    id: 'home',
    label: 'خانه',
    icon: 'house',
    href: '/home'
  },
  {
    id: 'products',
    label: 'محصولات',
    icon: 'grid',
    href: '/products'
  },
  {
    id: 'articles',
    label: 'مقاله ها',
    icon: 'newspaper',
    href: '/articles'
  },
  {
    id: 'about',
    label: 'درباره ما',
    icon: 'info-circle',
    href: '/about'
  },
  {
    id: 'contact',
    label: 'تماس با ما',
    icon: 'telephone',
    href: '/contact'
  },
  {
    id: 'faq',
    label: 'سوالات متداول',
    icon: 'question-circle',
    href: '/faq'
  }
];