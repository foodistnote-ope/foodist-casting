import { useState } from 'react';
import type { Tag } from '../data/types';
import './FilterSidebar.css';

interface FilterSidebarProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedAreas: string[];
    setSelectedAreas: (v: string[]) => void;
    selectedBirthplaces: string[];
    setSelectedBirthplaces: (v: string[]) => void;
    selectedAges: string[];
    setSelectedAges: (v: string[]) => void;
    selectedMemberships: string[];
    setSelectedMemberships: (v: string[]) => void;
    selectedMaritalStatus: string[];
    setSelectedMaritalStatus: (v: string[]) => void;
    selectedFaceVisibility: string[];
    setSelectedFaceVisibility: (v: string[]) => void;
    selectedHasChildren: string[];
    setSelectedHasChildren: (v: string[]) => void;
    selectedChildrenCount: string[];
    setSelectedChildrenCount: (v: string[]) => void;
    selectedChildStages: string[];
    setSelectedChildStages: (v: string[]) => void;
    selectedFollowers: string[];
    setSelectedFollowers: (v: string[]) => void;
    selectedInstagramFollowers: string[];
    setSelectedInstagramFollowers: (v: string[]) => void;
    selectedTikTokFollowers: string[];
    setSelectedTikTokFollowers: (v: string[]) => void;
    selectedYouTubeFollowers: string[];
    setSelectedYouTubeFollowers: (v: string[]) => void;
    selectedXFollowers: string[];
    setSelectedXFollowers: (v: string[]) => void;
    selectedPlatforms: string[];
    setSelectedPlatforms: (v: string[]) => void;
    // タグカテゴリ別選択済みIDリスト
    selectedQualificationTagIds: string[];
    setSelectedQualificationTagIds: (v: string[]) => void;
    selectedAchievementTagIds: string[];
    setSelectedAchievementTagIds: (v: string[]) => void;
    selectedWorkTagIds: string[];
    setSelectedWorkTagIds: (v: string[]) => void;
    selectedFeatureTagIds: string[];
    setSelectedFeatureTagIds: (ids: string[]) => void;
    selectedAlcoholTagIds: string[];
    setSelectedAlcoholTagIds: (ids: string[]) => void;
    // 検索可能タグ（active=true & searchVisible=true のみ）
    qualificationTags: Tag[];
    achievementTags: Tag[];
    workTags: Tag[];
    alcoholTags: Tag[];
    featureTags: Tag[];
}

const AREA_GROUPS: Record<string, string[]> = {
    '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
    '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
    '中部': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
    '近畿': ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
    '中国・四国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'],
    '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
    'その他': ['海外', 'その他'],
};

const AGE_OPTIONS = ['10代以下', '20代', '30代', '40代', '50代以上'];
const MEMBERSHIP_OPTIONS = ['あり', 'なし', '要確認'];
const MARITAL_STATUS_OPTIONS = ['未婚', '既婚', '非公開', '未確認'];
const FACE_OPTIONS = ['可', '条件付き可', '不可'];
const HAS_CHILDREN_OPTIONS = ['あり', 'なし', '非公開', '未確認'];
const CHILDREN_COUNT_OPTIONS = ['1', '2', '3', '4人以上'];
const CHILD_STAGE_OPTIONS = ['乳幼児あり', '未就学児あり', '小学生の子あり', '中高生の子あり', '成人した子あり'];
const FOLLOWER_OPTIONS = [
    '1万未満', '1万〜3万未満', '3万〜5万未満', '5万〜10万未満',
    '10万〜30万未満', '30万〜50万未満', '50万〜100万未満',
    '100万〜200万未満', '200万以上'
];
const PLATFORM_OPTIONS = ['ブログ', 'Instagram', 'X', 'TikTok', 'YouTube', '公式ホームページ', 'その他'];

const SHOW_MORE_THRESHOLD = 8;

function useAccordion(defaultOpen = false) {
    const [open, setOpen] = useState(defaultOpen);
    return { open, toggle: () => setOpen(v => !v) };
}

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: number;
}

const FilterSection = ({ title, children, defaultOpen = false, badge = 0 }: FilterSectionProps) => {
    const { open, toggle } = useAccordion(defaultOpen);
    return (
        <div className={`filter-section ${open ? 'open' : ''}`}>
            <button className="filter-section-header" onClick={toggle} aria-expanded={open}>
                <span className="filter-heading">
                    {title}
                    {badge > 0 && <span className="filter-badge">{badge}</span>}
                </span>
                <span className="filter-chevron">{open ? '▲' : '▼'}</span>
            </button>
            {open && <div className="filter-section-body">{children}</div>}
        </div>
    );
};

interface CheckListProps {
    items: { value: string; label: string }[];
    selected: string[];
    onToggle: (v: string) => void;
    showMoreThreshold?: number;
}

const CheckList = ({ items, selected, onToggle, showMoreThreshold = 0 }: CheckListProps) => {
    const [expanded, setExpanded] = useState(false);
    const shown = showMoreThreshold > 0 && !expanded ? items.slice(0, showMoreThreshold) : items;
    const hasMore = showMoreThreshold > 0 && items.length > showMoreThreshold;
    return (
        <div className="filter-options">
            {shown.map(({ value, label }) => (
                <label key={value} className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={selected.includes(value)}
                        onChange={() => onToggle(value)}
                    />
                    <span className="checkbox-text">{label}</span>
                </label>
            ))}
            {hasMore && (
                <button className="show-more-btn" onClick={() => setExpanded(v => !v)}>
                    {expanded ? '▲ 閉じる' : `▼ もっと見る（残り${items.length - showMoreThreshold}件）`}
                </button>
            )}
        </div>
    );
};

function toggle(value: string, list: string[], setList: (v: string[]) => void) {
    if (list.includes(value)) setList(list.filter(v => v !== value));
    else setList([...list, value]);
}

export const FilterSidebar = ({
    searchQuery, setSearchQuery,
    selectedAreas, setSelectedAreas,
    selectedBirthplaces, setSelectedBirthplaces,
    selectedAges, setSelectedAges,
    selectedMemberships, setSelectedMemberships,
    selectedMaritalStatus, setSelectedMaritalStatus,
    selectedFaceVisibility, setSelectedFaceVisibility,
    selectedHasChildren, setSelectedHasChildren,
    selectedChildrenCount, setSelectedChildrenCount,
    selectedChildStages, setSelectedChildStages,
    selectedFollowers, setSelectedFollowers,
    selectedInstagramFollowers, setSelectedInstagramFollowers,
    selectedXFollowers, setSelectedXFollowers,
    selectedTikTokFollowers, setSelectedTikTokFollowers,
    selectedYouTubeFollowers, setSelectedYouTubeFollowers,
    selectedPlatforms, setSelectedPlatforms,
    selectedQualificationTagIds, setSelectedQualificationTagIds,
    selectedAchievementTagIds, setSelectedAchievementTagIds,
    selectedWorkTagIds, setSelectedWorkTagIds,
    selectedFeatureTagIds, setSelectedFeatureTagIds,
    selectedAlcoholTagIds, setSelectedAlcoholTagIds,
    qualificationTags,
    achievementTags,
    workTags,
    alcoholTags,
    featureTags
}: FilterSidebarProps) => {

    const handleReset = () => {
        setSearchQuery('');
        setSelectedAreas([]);
        setSelectedBirthplaces([]);
        setSelectedAges([]);
        setSelectedMemberships([]);
        setSelectedMaritalStatus([]);
        setSelectedFaceVisibility([]);
        setSelectedHasChildren([]);
        setSelectedChildrenCount([]);
        setSelectedChildStages([]);
        setSelectedFollowers([]);
        setSelectedInstagramFollowers([]);
        setSelectedXFollowers([]);
        setSelectedTikTokFollowers([]);
        setSelectedYouTubeFollowers([]);
        setSelectedPlatforms([]);
        setSelectedQualificationTagIds([]);
        setSelectedAchievementTagIds([]);
        setSelectedWorkTagIds([]);
        setSelectedFeatureTagIds([]);
    };

    const totalActiveFilters = [
        selectedAreas, selectedBirthplaces, selectedAges, selectedMemberships, selectedMaritalStatus,
        selectedFaceVisibility, selectedHasChildren, selectedChildrenCount,
        selectedChildStages, selectedFollowers, selectedInstagramFollowers,
        selectedXFollowers, selectedTikTokFollowers, selectedYouTubeFollowers,
        selectedPlatforms,
        selectedQualificationTagIds, selectedAchievementTagIds, selectedWorkTagIds, selectedFeatureTagIds,
    ].reduce((s, a) => s + a.length, 0) + (searchQuery ? 1 : 0);

    // 都道府県リスト（居住地・出身地共通）

    return (
        <aside className="filter-sidebar">
            <div className="filter-header">
                <h2>絞り込み条件
                    {totalActiveFilters > 0 && <span className="filter-badge">{totalActiveFilters}</span>}
                </h2>
                <button className="btn-reset" onClick={handleReset} aria-label="条件をリセット">リセット</button>
            </div>

            {/* キーワード検索 */}
            <div className="filter-section open">
                <div className="filter-section-body" style={{ paddingTop: 0 }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="活動名・肩書き・アカウント・メモで検索..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* 居住地 */}
            <FilterSection title="居住地" badge={selectedAreas.length}>
                <div className="filter-options scrollable-options">
                    {Object.entries(AREA_GROUPS).map(([group, prefs]) => (
                        <div key={group} className="area-group">
                            <h4 className="area-group-title">{group}</h4>
                            {prefs.map(p => (
                                <label key={p} className="checkbox-label">
                                    <input type="checkbox" checked={selectedAreas.includes(p)} onChange={() => toggle(p, selectedAreas, setSelectedAreas)} />
                                    <span className="checkbox-text">{p}</span>
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
            </FilterSection>

            {/* 出身地 */}
            <FilterSection title="出身地" badge={selectedBirthplaces.length}>
                <div className="filter-options scrollable-options">
                    {Object.entries(AREA_GROUPS).map(([group, prefs]) => (
                        <div key={group} className="area-group">
                            <h4 className="area-group-title">{group}</h4>
                            {prefs.map(p => (
                                <label key={p} className="checkbox-label">
                                    <input type="checkbox" checked={selectedBirthplaces.includes(p)} onChange={() => toggle(p, selectedBirthplaces, setSelectedBirthplaces)} />
                                    <span className="checkbox-text">{p}</span>
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
            </FilterSection>

            {/* 年代 */}
            <FilterSection title="年代" badge={selectedAges.length}>
                <CheckList items={AGE_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedAges} onToggle={v => toggle(v, selectedAges, setSelectedAges)} />
            </FilterSection>

            {/* フーディスト会員登録状況 */}
            <FilterSection title="フーディスト会員登録" badge={selectedMemberships.length}>
                <CheckList items={MEMBERSHIP_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedMemberships} onToggle={v => toggle(v, selectedMemberships, setSelectedMemberships)} />
            </FilterSection>

            {/* 婚姻状況 */}
            <FilterSection title="婚姻状況" badge={selectedMaritalStatus.length}>
                <CheckList items={MARITAL_STATUS_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedMaritalStatus} onToggle={v => toggle(v, selectedMaritalStatus, setSelectedMaritalStatus)} />
            </FilterSection>

            {/* 顔出し可否 */}
            <FilterSection title="顔出し可否" badge={selectedFaceVisibility.length}>
                <CheckList items={FACE_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedFaceVisibility} onToggle={v => toggle(v, selectedFaceVisibility, setSelectedFaceVisibility)} />
            </FilterSection>

            {/* 子ども関連 */}
            <FilterSection title="子ども・子育て" badge={selectedHasChildren.length + selectedChildrenCount.length + selectedChildStages.length}>
                <p className="filter-sub-label">子どもの有無</p>
                <CheckList items={HAS_CHILDREN_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedHasChildren} onToggle={v => toggle(v, selectedHasChildren, setSelectedHasChildren)} />
                <p className="filter-sub-label" style={{ marginTop: 10 }}>子どもの数</p>
                <CheckList items={CHILDREN_COUNT_OPTIONS.map(v => ({ value: v, label: `${v}人` }))} selected={selectedChildrenCount} onToggle={v => toggle(v, selectedChildrenCount, setSelectedChildrenCount)} />
                <p className="filter-sub-label" style={{ marginTop: 10 }}>子育てステージ（OR）</p>
                <CheckList items={CHILD_STAGE_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedChildStages} onToggle={v => toggle(v, selectedChildStages, setSelectedChildStages)} />
            </FilterSection>

            {/* 保有プラットフォーム */}
            <FilterSection title="保有プラットフォーム" badge={selectedPlatforms.length}>
                <CheckList items={PLATFORM_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedPlatforms} onToggle={v => toggle(v, selectedPlatforms, setSelectedPlatforms)} />
            </FilterSection>

            {/* 総フォロワー数 */}
            <FilterSection title="総フォロワー数" badge={selectedFollowers.length}>
                <CheckList items={FOLLOWER_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedFollowers} onToggle={v => toggle(v, selectedFollowers, setSelectedFollowers)} />
            </FilterSection>

            {/* Instagramフォロワー数 */}
            <FilterSection title="Instagramフォロワー数" badge={selectedInstagramFollowers.length}>
                <CheckList items={FOLLOWER_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedInstagramFollowers} onToggle={v => toggle(v, selectedInstagramFollowers, setSelectedInstagramFollowers)} />
            </FilterSection>

            {/* Xフォロワー数 */}
            <FilterSection title="Xフォロワー数" badge={selectedXFollowers.length}>
                <CheckList items={FOLLOWER_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedXFollowers} onToggle={v => toggle(v, selectedXFollowers, setSelectedXFollowers)} />
            </FilterSection>

            {/* TikTokフォロワー数 */}
            <FilterSection title="TikTokフォロワー数" badge={selectedTikTokFollowers.length}>
                <CheckList items={FOLLOWER_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedTikTokFollowers} onToggle={v => toggle(v, selectedTikTokFollowers, setSelectedTikTokFollowers)} />
            </FilterSection>

            {/* YouTube登録者数 */}
            <FilterSection title="YouTube登録者数" badge={selectedYouTubeFollowers.length}>
                <CheckList items={FOLLOWER_OPTIONS.map(v => ({ value: v, label: v }))} selected={selectedYouTubeFollowers} onToggle={v => toggle(v, selectedYouTubeFollowers, setSelectedYouTubeFollowers)} />
            </FilterSection>

            {/* 飲酒について */}
            <FilterSection title="飲酒について" badge={selectedAlcoholTagIds.length}>
                <CheckList
                    items={alcoholTags.map(t => ({ value: t.id, label: t.name }))}
                    selected={selectedAlcoholTagIds}
                    onToggle={v => toggle(v, selectedAlcoholTagIds, setSelectedAlcoholTagIds)}
                />
            </FilterSection>

            {/* 保有資格・専門 */}
            <FilterSection title="保有資格・専門" badge={selectedQualificationTagIds.length}>
                <CheckList
                    items={qualificationTags.map(t => ({ value: t.id, label: t.name }))}
                    selected={selectedQualificationTagIds}
                    onToggle={v => toggle(v, selectedQualificationTagIds, setSelectedQualificationTagIds)}
                    showMoreThreshold={SHOW_MORE_THRESHOLD}
                />
            </FilterSection>

            {/* 実績 */}
            <FilterSection title="実績" badge={selectedAchievementTagIds.length}>
                <CheckList
                    items={achievementTags.map(t => ({ value: t.id, label: t.name }))}
                    selected={selectedAchievementTagIds}
                    onToggle={v => toggle(v, selectedAchievementTagIds, setSelectedAchievementTagIds)}
                    showMoreThreshold={SHOW_MORE_THRESHOLD}
                />
            </FilterSection>

            {/* 対応可能業務 */}
            <FilterSection title="対応可能業務" badge={selectedWorkTagIds.length}>
                <CheckList
                    items={workTags.map(t => ({ value: t.id, label: t.name }))}
                    selected={selectedWorkTagIds}
                    onToggle={v => toggle(v, selectedWorkTagIds, setSelectedWorkTagIds)}
                    showMoreThreshold={SHOW_MORE_THRESHOLD}
                />
            </FilterSection>

            {/* 特徴・タグ */}
            <FilterSection title="特徴・タグ" badge={selectedFeatureTagIds.length}>
                <CheckList
                    items={featureTags.map(t => ({ value: t.id, label: t.name }))}
                    selected={selectedFeatureTagIds}
                    onToggle={v => toggle(v, selectedFeatureTagIds, setSelectedFeatureTagIds)}
                    showMoreThreshold={SHOW_MORE_THRESHOLD}
                />
            </FilterSection>
        </aside>
    );
};
