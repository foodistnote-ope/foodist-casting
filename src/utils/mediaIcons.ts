import type { MediaType } from '../data/types';

export const MEDIA_ICONS: Record<MediaType, string> = {
    'ブログ': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23555'/%3E%3Ctext x='50' y='73' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E",
    'Instagram': 'https://foodistnote.recipe-blog.jp/wp-content/themes/foodist_note/assets/img/common/icon_sns_instagram.png',
    'X': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg',
    'TikTok': '/tiktok-icon.png',
    'YouTube': 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    '公式ホームページ': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23334155' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9 22 9 12 15 12 15 22'/%3E%3C/svg%3E",
    'Lemon8': 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/20/3d/70/203d70b1-b339-470c-0826-2f62da9b67c0/Placeholder.mill/400x400bb-75.webp',
    'note': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAIAAAD9b0jDAAAAi0lEQVR4Ae3UAQbAIBQG4IFOEbE7bVfomg8IELpHjED4t9l4MmJ7Npj3g+rPJ+QN6wdRtBtFAfDiTFs9Q2utQz/TPBFRBxShHHYlqLXWOTceMca075WjIYRSynIk5+y95wqAEE0ptRURvY/uW672a4r+DwXQQ2OMwi/FE4QX7fmlffDSq34vOvkV3QAnExiLiBFPFQAAAABJRU5ErkJggg==',
    'その他': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/%3E%3C/svg%3E",
};

export const MEDIA_ICON_FILTER: Partial<Record<MediaType, string>> = {
    'X': 'invert(1)',
};
