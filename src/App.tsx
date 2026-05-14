import { useState, useMemo, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { FilterSidebar } from './components/FilterSidebar';
import { ProfileModal } from './components/ProfileModal';
import { DatabaseView } from './components/DatabaseView';
import { FoodistEditModal } from './components/FoodistEditModal';
import type { Foodist, MediaType } from './data/types';
import { useTags } from './hooks/useTags';
import { useFoodists, normalizeString } from './hooks/useFoodists';
import { parseFoodistCsv, parsePatchCsv } from './utils/csvParser';
import { AuthGate } from './components/AuthGate';
import { ImportResultModal } from './components/ImportResultModal';
import { PublicRegistrationForm } from './components/PublicRegistrationForm';
import { ApplicationReviewView } from './components/ApplicationReviewView';
import { updateApplicationStatus } from './lib/supabaseDb';
import { calculateAge, calculateAgeGroup, getEffectiveAgeGroup } from './utils/dateUtils';
import Papa from 'papaparse';
import { AVAILABLE_COLUMNS, getMediaFollowers } from './utils/exportColumns';
import { downloadCsvAsShiftJis } from './utils/csvExport';
import './App.css';

type FollowerRange = { min: number, max: number };
const FOLLOWER_RANGES: Record<string, FollowerRange> = {
  '1万未満': { min: 0, max: 9999 },
  '1万〜3万未満': { min: 10000, max: 29999 },
  '3万〜5万未満': { min: 30000, max: 49999 },
  '5万〜10万未満': { min: 50000, max: 99999 },
  '10万〜30万未満': { min: 100000, max: 299999 },
  '30万〜50万未満': { min: 300000, max: 499999 },
  '50万〜100万未満': { min: 500000, max: 999999 },
  '100万〜200万未満': { min: 1000000, max: 1999999 },
  '200万以上': { min: 2000000, max: Infinity },
};

function App() {
  // ---- ビュー ----
  const [currentView, setCurrentView] = useState<'dashboard' | 'database' | 'review'>(() => {
    return (localStorage.getItem('app_current_view') as any) || 'dashboard';
  });

  const isPublicApplyPage = window.location.pathname === '/apply';

  // 表示モードの永続化
  useEffect(() => {
    localStorage.setItem('app_current_view', currentView);
  }, [currentView]);

  // ---- CSV Export State for Dashboard ----
  const EXPORTABLE_COLUMNS = useMemo(() => AVAILABLE_COLUMNS.filter(c => !c.excludeFromExport), []);

  const [exportColumnIds, setExportColumnIds] = useState<string[]>(() => {
      const saved = localStorage.getItem('dashboard_export_columns_v2');
      if (saved) {
          try {
              return JSON.parse(saved);
          } catch (e) {}
      }
      // デフォルトですべての項目を選択状態にする
      return EXPORTABLE_COLUMNS.map(c => c.id);
  });
  const [isExportColumnDropdownOpen, setIsExportColumnDropdownOpen] = useState(false);
  const exportColumnDropdownRef = useRef<HTMLDivElement>(null);

  // モバイル判定用のステートとリスナー
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      localStorage.setItem('dashboard_export_columns_v2', JSON.stringify(exportColumnIds));
  }, [exportColumnIds]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (exportColumnDropdownRef.current && !exportColumnDropdownRef.current.contains(event.target as Node)) {
              setIsExportColumnDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExportColumn = (id: string) => {
      setExportColumnIds(prev => 
          prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      );
  };


  // ---- フィルター状態 ----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedBirthplaces, setSelectedBirthplaces] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<string[]>([]);
  const [selectedFaceVisibility, setSelectedFaceVisibility] = useState<string[]>([]);
  const [selectedHasChildren, setSelectedHasChildren] = useState<string[]>([]);
  const [selectedChildrenCount, setSelectedChildrenCount] = useState<string[]>([]);
  const [selectedChildStages, setSelectedChildStages] = useState<string[]>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [selectedInstagramFollowers, setSelectedInstagramFollowers] = useState<string[]>([]);
  const [selectedXFollowers, setSelectedXFollowers] = useState<string[]>([]);
  const [selectedTikTokFollowers, setSelectedTikTokFollowers] = useState<string[]>([]);
  const [selectedYouTubeFollowers, setSelectedYouTubeFollowers] = useState<string[]>([]);
  const [selectedQualificationTagIds, setSelectedQualificationTagIds] = useState<string[]>([]);
  const [selectedAchievementTagIds, setSelectedAchievementTagIds] = useState<string[]>([]);
  const [selectedWorkTagIds, setSelectedWorkTagIds] = useState<string[]>([]);
  const [selectedFeatureTagIds, setSelectedFeatureTagIds] = useState<string[]>([]);
  const [selectedAlcoholTagIds, setSelectedAlcoholTagIds] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedNoteFeaturedPermissions, setSelectedNoteFeaturedPermissions] = useState<string[]>([]);
  const [selectedCookingClassStatuses, setSelectedCookingClassStatuses] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const totalActiveFilters = useMemo(() => {
    return [
        selectedAreas, selectedBirthplaces, selectedAges, selectedMemberships, selectedMaritalStatus,
        selectedFaceVisibility, selectedHasChildren, selectedChildrenCount,
        selectedChildStages, selectedFollowers, selectedInstagramFollowers,
        selectedXFollowers, selectedTikTokFollowers, selectedYouTubeFollowers,
        selectedPlatforms, selectedGenders,
        selectedNoteFeaturedPermissions,
        selectedCookingClassStatuses,
        selectedQualificationTagIds, selectedAchievementTagIds, selectedWorkTagIds, 
        selectedFeatureTagIds, selectedAlcoholTagIds
    ].reduce((s, a) => s + a.length, 0) + (searchQuery ? 1 : 0);
  }, [
    searchQuery, selectedAreas, selectedBirthplaces, selectedAges, selectedMemberships, selectedMaritalStatus,
    selectedFaceVisibility, selectedHasChildren, selectedChildrenCount,
    selectedChildStages, selectedFollowers, selectedInstagramFollowers,
    selectedXFollowers, selectedTikTokFollowers, selectedYouTubeFollowers,
    selectedPlatforms, selectedGenders,
    selectedNoteFeaturedPermissions,
    selectedCookingClassStatuses,
    selectedQualificationTagIds, selectedAchievementTagIds, selectedWorkTagIds, 
    selectedFeatureTagIds, selectedAlcoholTagIds
  ]);

  // ---- モーダル状態 ----
  const [selectedFoodist, setSelectedFoodist] = useState<Foodist | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFoodist, setEditingFoodist] = useState<Foodist | null>(null);
  const [importResult, setImportResult] = useState<{
    title: string;
    summary: { success: number; added?: number; updated?: number };
    failures?: { type: 'notFound' | 'conflict' | 'duplicate'; label: string; items: string[] }[];
  } | null>(null);

  // ---- データ ----
  const { 
    foodists, loading, error, addFoodist, updateFoodist, deleteFoodist, deleteManyFoodists,
    replaceTagInAll, removeTagsFromAll, exportToJson, importFromJson, mergeFoodists, patchFoodists 
  } = useFoodists();
  const { tags, tagsLoading, getSearchableTags } = useTags();

  // 各カテゴリの検索可能タグ（active=true & searchVisible=true）
  const qualificationTags = getSearchableTags('資格・専門');
  const achievementTags = getSearchableTags('実績');
  const workTags = getSearchableTags('対応可能業務');
  const alcoholTags = getSearchableTags('飲酒について');
  const featureTags = useMemo(() => [
    ...getSearchableTags('得意な料理ジャンル'),
  ], [tags]);

  // CSV インポート処理
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isPatchingCsv, setIsPatchingCsv] = useState(false);
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingCsv(true);
    try {
      let parsed = await parseFoodistCsv(file, tags);
      if (parsed.length === 0) {
        alert('CSVに有効なデータが見つかりませんでした。');
        return;
      }

      // --- 同名データの重複チェック（正規化とエイリアスを考慮） ---
      const findExistingIdx = (name: string) => {
        const norm = normalizeString(name);
        return foodists.findIndex(f => 
          normalizeString(f.displayName) === norm || 
          (f.aliases ?? []).some(a => normalizeString(a) === norm)
        );
      };

      const duplicates = parsed.filter(p => findExistingIdx(p.displayName) !== -1);

      if (duplicates.length > 0) {
        const namesMsg = duplicates.map(p => p.displayName).slice(0, 10).join(', ');
        const extraMsg = duplicates.length > 10 ? ' など' : '';
        const msg = `⚠️ 重複警告\n\nアップロードされたCSV内に、既に登録されている（またはエイリアスが一致する）フーディストが ${duplicates.length} 件含まれています。\n（${namesMsg}${extraMsg}）\n\n重複を避けるため、これら既存のデータを「スキップ」して、新しく追加される人のみをインポートしますか？\n（「キャンセル」を押すと、インポート自体をすべて中止します）`;

        if (window.confirm(msg)) {
          // 重複分のデータを配列から除外してスキップする
          parsed = parsed.filter(p => findExistingIdx(p.displayName) === -1);
          if (parsed.length === 0) {
            alert('新しいデータがなかったため、インポートを終了しました。');
            setIsImportingCsv(false);
            e.target.value = '';
            return;
          }
        } else {
          // キャンセル時はすべて中止
          setIsImportingCsv(false);
          e.target.value = '';
          return;
        }
      }

      const { added } = await mergeFoodists(parsed);
      setImportResult({
        title: '新規追加インポート結果',
        summary: { success: added, added },
        failures: duplicates.length > 0 ? [{ type: 'duplicate', label: '登録済みのためスキップ', items: duplicates.map(p => p.displayName) }] : []
      });
    } catch (err) {
      console.error(err);
      alert(`CSVインポートに失敗しました。\n${err}`);
    } finally {
      setIsImportingCsv(false);
      e.target.value = '';
    }
  };

  // CSV 部分更新インポート処理
  const handlePatchCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPatchingCsv(true);
    try {
      const patches = await parsePatchCsv(file, tags);
      if (patches.length === 0) {
        alert('CSVにデータが見つかりませんでした。');
        return;
      }

      const confirmMsg = `部分更新CSVを読み込みました。\n対象レコード数: ${patches.length}件\n\n「id」または「活動名」でマッチした既存データに差分を上書きします。\n新規登録はされません。\n\n実行しますか？`;
      if (!window.confirm(confirmMsg)) return;

      const { updated, notFound, conflicts, noUpdateFields } = await patchFoodists(patches);
      setImportResult({
        title: '部分更新結果',
        summary: { success: updated },
        failures: [
          { type: 'notFound', label: 'マッチしなかった行', items: notFound },
          { type: 'conflict', label: '複数の候補が見つかりスキップ', items: conflicts },
          { type: 'noUpdate' as any, label: '有効な更新項目が見つからなかった行', items: noUpdateFields }
        ]
      });
    } catch (err) {
      console.error(err);
      alert(`部分更新CSVのインポートに失敗しました。\n${err}`);
    } finally {
      setIsPatchingCsv(false);
      e.target.value = '';
    }
  };

  // JSON インポート処理
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importFromJson(file, 'merge')
      .then(({ added, updated }) => {
        alert(`インポート完了\n追加: ${added}件 / 更新: ${updated}件`);
      })
      .catch(err => {
        alert(`インポートに失敗しました。\n${err}`);
      });
    // 同じファイルを再度選択できるようにリセット
    e.target.value = '';
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`「${name}」を削除しますか？\nこの操作は元に戻せません。`)) {
      deleteFoodist(id);
      if (selectedFoodist?.id === id) {
        setSelectedFoodist(null);
      }
    }
  };

  // タグIDからタグ情報を引きやすくするためのMap
  const tagMap = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);

  // ---- フィルタリング ----
  const filteredFoodists = useMemo(() => {
    return foodists.filter(f => {
      // 1. キーワード検索（活動名・肩書き・一覧用紹介文・タグ名・エイリアス等）
      const q = searchQuery.toLowerCase();
      const nq = normalizeString(searchQuery);
      const tagNames = (f.tagIds || []).map(id => tagMap.get(id)?.name || '').join(' ').toLowerCase();
      const nTagNames = normalizeString(tagNames);
      
      if (q && !f.displayName.toLowerCase().includes(q) &&
        !normalizeString(f.displayName).includes(nq) &&
        !(f.title || '').toLowerCase().includes(q) &&
        !normalizeString(f.title).includes(nq) &&
        !(f.listIntro || '').toLowerCase().includes(q) &&
        !normalizeString(f.listIntro || '').includes(nq) &&
        !(f.profileText || '').toLowerCase().includes(q) &&
        !normalizeString(f.profileText || '').includes(nq) &&
        !(f.realName || '').toLowerCase().includes(q) &&
        !normalizeString(f.realName).includes(nq) &&
        !(f.aliases ?? []).some(a => a.toLowerCase().includes(q) || normalizeString(a).includes(nq)) &&
        !tagNames.includes(q) && !nTagNames.includes(nq) &&
        !f.mediaAccounts.some(acc => 
          (acc.accountName || '').toLowerCase().includes(q) || 
          (acc.url || '').toLowerCase().includes(q)
        ) &&
        !f.notes.some(n => n.content.toLowerCase().includes(q) || normalizeString(n.content).includes(nq))
      ) return false;

      // 2. 居住地
      if (selectedAreas.length > 0 && !selectedAreas.includes(f.area || '')) return false;

      // 3. 出身地
      if (selectedBirthplaces.length > 0 && !selectedBirthplaces.includes(f.birthplace || '')) return false;

      // 4. 年代
      if (selectedAges.length > 0) {
        const effectiveAgeGroup = getEffectiveAgeGroup(f);
        if (!selectedAges.includes(effectiveAgeGroup || '')) return false;
      }

      // 4.5 性別
      if (selectedGenders.length > 0 && !selectedGenders.includes(f.gender || '')) return false;

      // 5. フーディスト会員登録状況
      if (selectedMemberships.length > 0 && !selectedMemberships.includes(f.membershipStatus)) return false;

      // 5.5 婚姻状況
      if (selectedMaritalStatus.length > 0 && !selectedMaritalStatus.includes(f.maritalStatus || '')) return false;

      // 6. 顔出し可否
      if (selectedFaceVisibility.length > 0 && !selectedFaceVisibility.includes(f.faceVisibility)) return false;

      // 7. 子どもの有無
      if (selectedHasChildren.length > 0 && !selectedHasChildren.includes(f.hasChildren)) return false;

      // 8. 子どもの数
      if (selectedChildrenCount.length > 0 && !selectedChildrenCount.includes(f.childrenCount || '')) return false;

      // 9. 子育てステージ（OR検索: いずれかに当てはまる）
      if (selectedChildStages.length > 0 && !selectedChildStages.some(s => f.childStage.includes(s))) return false;

      // 10. 総フォロワー数
      if (selectedFollowers.length > 0) {
        if (f.totalFollowers == null) return false;
        const matchesRanges = selectedFollowers.some(key => {
          const rng = FOLLOWER_RANGES[key];
          if (!rng) return false;
          return f.totalFollowers! >= rng.min && f.totalFollowers! <= rng.max;
        });
        if (!matchesRanges) return false;
      }

      // 10.5 Instagramフォロワー数
      if (selectedInstagramFollowers.length > 0) {
        const igAcc = f.mediaAccounts.find(a => a.mediaType === 'Instagram');
        const igFollowers = igAcc?.metricValue;
        if (igFollowers == null) return false;
        const matchesRanges = selectedInstagramFollowers.some(key => {
          const rng = FOLLOWER_RANGES[key];
          if (!rng) return false;
          return igFollowers >= rng.min && igFollowers <= rng.max;
        });
        if (!matchesRanges) return false;
      }

      // 10.6 Xフォロワー数
      if (selectedXFollowers.length > 0) {
        const acc = f.mediaAccounts.find(a => a.mediaType === 'X');
        const count = acc?.metricValue;
        if (count == null) return false;
        const matchesRanges = selectedXFollowers.some(key => {
          const rng = FOLLOWER_RANGES[key];
          if (!rng) return false;
          return count >= rng.min && count <= rng.max;
        });
        if (!matchesRanges) return false;
      }

      // 10.7 TikTokフォロワー数
      if (selectedTikTokFollowers.length > 0) {
        const acc = f.mediaAccounts.find(a => a.mediaType === 'TikTok');
        const count = acc?.metricValue;
        if (count == null) return false;
        const matchesRanges = selectedTikTokFollowers.some(key => {
          const rng = FOLLOWER_RANGES[key];
          if (!rng) return false;
          return count >= rng.min && count <= rng.max;
        });
        if (!matchesRanges) return false;
      }

      // 10.8 YouTube登録者数
      if (selectedYouTubeFollowers.length > 0) {
        const acc = f.mediaAccounts.find(a => a.mediaType === 'YouTube');
        const count = acc?.metricValue;
        if (count == null) return false;
        const matchesRanges = selectedYouTubeFollowers.some(key => {
          const rng = FOLLOWER_RANGES[key];
          if (!rng) return false;
          return count >= rng.min && count <= rng.max;
        });
        if (!matchesRanges) return false;
      }

      // 11.5 保有プラットフォーム（OR検索: mediaAccountsにURLがあるレコードのmediaTypeで判定）
      if (selectedPlatforms.length > 0) {
        const ownedPlatforms = new Set(
          f.mediaAccounts
            .filter(a => a.url && a.url.trim() !== '')
            .map(a => a.mediaType)
        );
        const matches = selectedPlatforms.some(p => ownedPlatforms.has(p as MediaType));
        if (!matches) return false;
      }

      // 11. タグ絞り込み（各カテゴリ内で AND、カテゴリ間も AND）
      const allSelectedTagIds = [
        ...selectedQualificationTagIds,
        ...selectedAchievementTagIds,
        ...selectedWorkTagIds,
        ...selectedFeatureTagIds,
        ...selectedAlcoholTagIds,
      ];
      if (allSelectedTagIds.length > 0 && !allSelectedTagIds.every(id => (f.tagIds || []).includes(id))) return false;
      
      // 12. フーディストノート掲載可否
      if (selectedNoteFeaturedPermissions.length > 0) {
        const actualPermission = f.noteFeaturedPermission || '未設定';
        const matches = selectedNoteFeaturedPermissions.some(selected => {
          // 短縮表示「掲載可（事前確認は不要）」はDB値「掲載可（事前確認は不要、掲載後に案内があればOK）」にマッチ
          if (selected === '掲載可（事前確認は不要）') {
            return actualPermission === '掲載可（事前確認は不要、掲載後に案内があればOK）';
          }
          return actualPermission === selected;
        });
        if (!matches) return false;
      }

      // 13. 料理教室の運営状況
      if (selectedCookingClassStatuses.length > 0 && !selectedCookingClassStatuses.includes(f.cookingClassStatus || '未確認')) return false;

      return true;
    }).sort((a, b) => (b.totalFollowers || 0) - (a.totalFollowers || 0));
  }, [
    foodists, searchQuery, selectedAreas, selectedBirthplaces, selectedAges,
    selectedMemberships, selectedMaritalStatus, selectedFaceVisibility, selectedHasChildren,
    selectedChildrenCount, selectedChildStages, selectedFollowers, selectedInstagramFollowers,
    selectedXFollowers, selectedTikTokFollowers, selectedYouTubeFollowers,
    selectedPlatforms,
    selectedQualificationTagIds, selectedAchievementTagIds, selectedWorkTagIds, selectedFeatureTagIds,
    selectedAlcoholTagIds, selectedGenders,
    selectedNoteFeaturedPermissions,
    selectedCookingClassStatuses,
  ]);

  const handleResetFilters = () => {
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
    setSelectedAlcoholTagIds([]);
    setSelectedGenders([]);
    setSelectedNoteFeaturedPermissions([]);
    setSelectedCookingClassStatuses([]);
  };

  // ---- データ移行: 不要タグの整理 (v5) ----
  useEffect(() => {
    if (loading || foodists.length === 0) return;
    const MIGRATION_KEY = 'foodist_tag_cleanup_v5';
    if (localStorage.getItem(MIGRATION_KEY)) return;
    localStorage.setItem(MIGRATION_KEY, 'done');
    const deletedTagIds = ['tag_d030', 'tag_d031', 'tag_d032'];
    removeTagsFromAll(deletedTagIds);
  }, [loading, foodists, removeTagsFromAll]);

  // ---- URLベースのディープリンク ----
  useEffect(() => {
    if (loading || foodists.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const foodistId = params.get('foodist');
    if (foodistId) {
      const target = foodists.find(f => f.id === foodistId);
      if (target) setSelectedFoodist(target);
    }
  }, [loading, foodists]);

  const openFoodistModal = (foodist: Foodist) => {
    setSelectedFoodist(foodist);
    const params = new URLSearchParams(window.location.search);
    params.set('foodist', foodist.id);
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const closeFoodistModal = () => {
    setSelectedFoodist(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('foodist');
    const newSearch = params.toString();
    window.history.pushState({}, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`);
  };

  const isFiltered = searchQuery || [
    selectedAreas, selectedBirthplaces, selectedAges, selectedMemberships, selectedMaritalStatus,
    selectedFaceVisibility, selectedHasChildren, selectedChildrenCount,
    selectedChildStages, selectedFollowers, selectedInstagramFollowers,
    selectedXFollowers, selectedTikTokFollowers, selectedYouTubeFollowers, selectedPlatforms,
    selectedQualificationTagIds, selectedAchievementTagIds, selectedWorkTagIds, selectedFeatureTagIds,
    selectedAlcoholTagIds, selectedGenders,
    selectedNoteFeaturedPermissions,
    selectedCookingClassStatuses,
  ].some(a => a.length > 0);

  const activeSnsFilter: string | null =
    selectedInstagramFollowers.length > 0 ? 'Instagram' :
    selectedXFollowers.length > 0 ? 'X' :
    selectedTikTokFollowers.length > 0 ? 'TikTok' :
    selectedYouTubeFollowers.length > 0 ? 'YouTube' :
    selectedFollowers.length > 0 ? '__total__' :
    null;

  const sortedFoodists = useMemo(() => {
    if (!activeSnsFilter) return filteredFoodists;
    return [...filteredFoodists].sort((a, b) => {
      const getVal = (f: typeof a) => {
        if (activeSnsFilter === '__total__') return f.totalFollowers ?? 0;
        return f.mediaAccounts.find(acc => acc.mediaType === activeSnsFilter)?.metricValue ?? 0;
      };
      return getVal(b) - getVal(a);
    });
  }, [filteredFoodists, activeSnsFilter]);

  const handleDashboardExportCsv = () => {
    if (sortedFoodists.length === 0) {
        alert('出力するデータがありません。');
        return;
    }
    const visibleColumns = EXPORTABLE_COLUMNS.filter(c => exportColumnIds.includes(c.id));
    const headers = visibleColumns.map(col => col.label);
    const data = sortedFoodists.map(f => {
        return visibleColumns.map(col => {
            if (col.csvValue) {
                return col.csvValue(f, getMediaFollowers, tags);
            }
            if (col.sortValue) {
                const val = col.sortValue(f, getMediaFollowers, tags);
                return val == null ? '' : String(val);
            }
            return '';
        });
    });

    const csv = Papa.unparse({ fields: headers, data: data }, { newline: '\r\n' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadCsvAsShiftJis(csv, `foodist_search_${timestamp}.csv`);
  };

  const CARD_SNS_ICONS: Record<string, string> = {
    'ブログ': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23555'/%3E%3Ctext x='50' y='73' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E",
    'Instagram': 'https://foodistnote.recipe-blog.jp/wp-content/themes/foodist_note/assets/img/common/icon_sns_instagram.png',
    'X': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg',
    'TikTok': '/tiktok-icon.png',
    'YouTube': 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
  };

  if (loading || tagsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px', color: '#888', fontFamily: 'sans-serif' }}>
        <div style={{ width: 36, height: 36, border: '4px solid #e0e0e0', borderTop: '4px solid #d4844a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span>データを読み込んでいます...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '12px', color: '#c0392b', fontFamily: 'sans-serif' }}>
        <p>⚠️ データの読み込みに失敗しました</p>
        <pre style={{ fontSize: '0.8rem', background: '#fef', padding: '8px', borderRadius: '4px' }}>{error}</pre>
        <button onClick={() => window.location.reload()}>再読み込みする</button>
      </div>
    );
  }

  if (isPublicApplyPage) {
    return <PublicRegistrationForm allTags={tags} />;
  }

  return (
    <AuthGate>
      <div className="app-container">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isMobile={isMobile} />

        <main className="main-content">
          {currentView === 'dashboard' ? (
            <>
              <header className="top-header dashboard-header">
                <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                  {/* ダッシュボード検索結果CSVエクスポート (PCのみ) */}
                  {!isMobile && (
                    <div className="csv-export-group">
                    <div className="column-dropdown-container" ref={exportColumnDropdownRef}>
                        <button 
                            className="btn-text-export-settings" 
                            onClick={() => setIsExportColumnDropdownOpen(!isExportColumnDropdownOpen)}
                            title="出力する項目を選択します"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1-1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            出力項目を選択 <span className="export-count-badge">{exportColumnIds.length}</span>
                        </button>
                        {isExportColumnDropdownOpen && (
                            <div className="column-dropdown-menu">
                                <div className="column-dropdown-header">
                                    <span>CSV出力項目の選択</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setExportColumnIds(EXPORTABLE_COLUMNS.map(c => c.id))}>すべて選択</button>
                                        <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setExportColumnIds(EXPORTABLE_COLUMNS.filter(c => c.defaultVisible).map(c => c.id))}>初期設定に戻す</button>
                                        <button className="btn-text" style={{ fontSize: '0.7rem', padding: '2px 4px' }} onClick={() => setExportColumnIds(['name'])}>クリア</button>
                                    </div>
                                </div>
                                <div className="column-dropdown-list">
                                    {EXPORTABLE_COLUMNS.map(col => (
                                        <label key={col.id} className="column-dropdown-item">
                                            <input 
                                                type="checkbox" 
                                                checked={exportColumnIds.includes(col.id)}
                                                onChange={() => toggleExportColumn(col.id)}
                                            />
                                            {col.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="export-divider"></div>
                    <button className="btn-dashboard-export" onClick={handleDashboardExportCsv} title="選択した項目でCSVを出力します">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        CSV出力
                    </button>
                  </div>
                  )}

                  {/* 検索ボックスと絞り込み（モバイル用） */}
                  {isMobile && (
                    <div className="header-search-group">
                        <div className="header-search-wrapper">
                            <input
                                type="text"
                                placeholder="検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="header-search-input"
                            />
                            {searchQuery && (
                                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                            )}
                        </div>
                        <button className="btn-secondary btn-header-filter" onClick={() => setIsMobileFilterOpen(true)} title="詳細な絞り込み">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="6" x2="20" y2="6"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                                <line x1="11" y1="18" x2="13" y2="18"/>
                            </svg>
                            {totalActiveFilters > 0 && <span className="filter-badge">{totalActiveFilters}</span>}
                        </button>
                    </div>
                  )}

                  {/* 新規登録 */}
                  <button className="btn-primary" style={{ marginRight: '8px' }} onClick={() => { setEditingFoodist(null); setIsEditModalOpen(true); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    新規登録
                  </button>
                  {!isMobile && (
                    <>
                      {/* JSONバックアップ */}
                      <button className="btn-secondary" onClick={exportToJson} title="現在のデータをJSONファイルとしてダウンロード">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        バックアップ
                      </button>
                      <label className="btn-secondary" style={{ cursor: 'pointer' }} title="JSONバックアップファイルを読み込んで復元">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        復元
                        <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonImport} />
                      </label>
                    </>
                  )}
                </div>
              </header>

              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <FilterSidebar
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  selectedAreas={selectedAreas} setSelectedAreas={setSelectedAreas}
                  selectedBirthplaces={selectedBirthplaces} setSelectedBirthplaces={setSelectedBirthplaces}
                  selectedAges={selectedAges} setSelectedAges={setSelectedAges}
                  selectedMemberships={selectedMemberships} setSelectedMemberships={setSelectedMemberships}
                  selectedMaritalStatus={selectedMaritalStatus} setSelectedMaritalStatus={setSelectedMaritalStatus}
                  selectedFaceVisibility={selectedFaceVisibility} setSelectedFaceVisibility={setSelectedFaceVisibility}
                  selectedHasChildren={selectedHasChildren} setSelectedHasChildren={setSelectedHasChildren}
                  selectedChildrenCount={selectedChildrenCount} setSelectedChildrenCount={setSelectedChildrenCount}
                  selectedChildStages={selectedChildStages} setSelectedChildStages={setSelectedChildStages}
                  selectedFollowers={selectedFollowers} setSelectedFollowers={setSelectedFollowers}
                  selectedInstagramFollowers={selectedInstagramFollowers} setSelectedInstagramFollowers={setSelectedInstagramFollowers}
                  selectedXFollowers={selectedXFollowers} setSelectedXFollowers={setSelectedXFollowers}
                  selectedTikTokFollowers={selectedTikTokFollowers} setSelectedTikTokFollowers={setSelectedTikTokFollowers}
                  selectedYouTubeFollowers={selectedYouTubeFollowers} setSelectedYouTubeFollowers={setSelectedYouTubeFollowers}
                  selectedPlatforms={selectedPlatforms} setSelectedPlatforms={setSelectedPlatforms}
                  selectedQualificationTagIds={selectedQualificationTagIds} setSelectedQualificationTagIds={setSelectedQualificationTagIds}
                  selectedAchievementTagIds={selectedAchievementTagIds} setSelectedAchievementTagIds={setSelectedAchievementTagIds}
                  selectedWorkTagIds={selectedWorkTagIds} setSelectedWorkTagIds={setSelectedWorkTagIds}
                  selectedFeatureTagIds={selectedFeatureTagIds} setSelectedFeatureTagIds={setSelectedFeatureTagIds}
                  selectedAlcoholTagIds={selectedAlcoholTagIds} setSelectedAlcoholTagIds={setSelectedAlcoholTagIds}
                  selectedGenders={selectedGenders} setSelectedGenders={setSelectedGenders}
                  selectedNoteFeaturedPermissions={selectedNoteFeaturedPermissions} setSelectedNoteFeaturedPermissions={setSelectedNoteFeaturedPermissions}
                  selectedCookingClassStatuses={selectedCookingClassStatuses} setSelectedCookingClassStatuses={setSelectedCookingClassStatuses}
                  isMobileOpen={isMobileFilterOpen} setIsMobileOpen={setIsMobileFilterOpen}
                  qualificationTags={qualificationTags}
                  achievementTags={achievementTags}
                  workTags={workTags}
                  alcoholTags={alcoholTags}
                  featureTags={featureTags}
                />

                <div className="content-pad" style={{ flex: 1 }}>
                  <div className="search-overview">
                    <p>
                      {isFiltered
                        ? `${filteredFoodists.length}件のフーディストが見つかりました`
                        : `全${foodists.length}件のフーディスト`}
                    </p>
                  </div>

                  {sortedFoodists.length > 0 ? (
                    <div className="foodist-grid">
                      {sortedFoodists.map(foodist => {
                        const cardTags = (foodist.tagIds || [])
                          .map(id => tagMap.get(id))
                          .filter((t): t is NonNullable<typeof t> => t != null)
                          .slice(0, 8);

                        const cardMedia = foodist.mediaAccounts
                          .filter(a => a.url && ['Instagram', 'X', 'YouTube', 'TikTok', 'ブログ'].includes(a.mediaType) && a.showOnDetail)
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .slice(0, 5);

                        return (
                          <div key={foodist.id} className="foodist-card" onClick={() => {
                            const selection = window.getSelection();
                            if (selection && selection.toString().length > 0) return;
                            openFoodistModal(foodist);
                          }}>
                            <div className="card-top-decoration"></div>
                            <div className="card-content">
                              <div className="card-main-info">
                                <img src={foodist.avatarUrl || '/no-image.png'} alt={foodist.displayName} className="card-avatar" />
                                <div className="card-header">
                                  <h3 className="foodist-name">{foodist.displayName}</h3>
                                  <span className="foodist-title">{foodist.title || '（肩書き未設定）'}</span>
                                </div>
                              </div>

                              <div className="card-details">
                                <div className="card-stats">
                                  {activeSnsFilter && activeSnsFilter !== '__total__' ? (() => {
                                    const acc = foodist.mediaAccounts.find(a => a.mediaType === activeSnsFilter);
                                    const labelMap: Record<string, string> = {
                                      'Instagram': 'Instagramフォロワー',
                                      'X': 'Xフォロワー',
                                      'TikTok': 'TikTokフォロワー',
                                      'YouTube': 'YouTube登録者数',
                                    };
                                    return (
                                      <>
                                        <span className="stat-label">{labelMap[activeSnsFilter]}:</span>
                                        <span className="stat-value">{acc?.metricValue != null ? acc.metricValue.toLocaleString() : '未設定'}</span>
                                      </>
                                    );
                                  })() : (
                                    <>
                                      <span className="stat-label">総フォロワー:</span>
                                      <span className="stat-value">{foodist.totalFollowers ? foodist.totalFollowers.toLocaleString() : '未設定'}</span>
                                    </>
                                  )}
                                </div>

                                {cardMedia.length > 0 && (
                                  <div className="card-sns">
                                    {cardMedia.map(acc => (
                                      <a key={acc.id} href={acc.url} target="_blank" rel="noreferrer" className="sns-link" title={acc.mediaType} onClick={e => e.stopPropagation()}>
                                        <img
                                          src={CARD_SNS_ICONS[acc.mediaType] || CARD_SNS_ICONS['ブログ']}
                                          alt={acc.mediaType}
                                          className="sns-icon-img"
                                          style={acc.mediaType === 'X' ? { filter: 'invert(1)' } : undefined}
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {cardTags.length > 0 && (
                                  <div className="card-tags">
                                    {cardTags.map(tag => (
                                      <span
                                        key={tag.id}
                                        className={`tag ${[...selectedQualificationTagIds, ...selectedAchievementTagIds, ...selectedWorkTagIds, ...selectedFeatureTagIds].includes(tag.id) ? 'tag-selected' : ''}`}
                                        onClick={e => {
                                          e.stopPropagation();
                                          if (tag.category === '資格・専門') {
                                            setSelectedQualificationTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                          } else if (tag.category === '実績') {
                                            setSelectedAchievementTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                          } else if (tag.category === '対応可能業務') {
                                            setSelectedWorkTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                          } else if (tag.category === '飲酒について') {
                                            setSelectedAlcoholTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                          } else {
                                            setSelectedFeatureTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                          }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                        title={tag.category}
                                      >
                                        {tag.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>条件に一致するフーディストが見つかりませんでした。</p>
                      <button className="btn-text" onClick={handleResetFilters}>条件をクリアする</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : currentView === 'database' ? (
            <DatabaseView
              foodists={foodists}
              allTags={tags}
              onEdit={f => { setEditingFoodist(f); setIsEditModalOpen(true); }}
              onAdd={() => { setEditingFoodist(null); setIsEditModalOpen(true); }}
              onDelete={(id) => {
                const f = foodists.find(x => x.id === id);
                if (f) handleDelete(id, f.displayName);
              }}
              onImport={handleCsvImport}
              isImporting={isImportingCsv}
              onPatchImport={handlePatchCsvImport}
              isPatchImporting={isPatchingCsv}
            />
          ) : (
            <ApplicationReviewView 
              allTags={tags} 
              onEdit={app => {
                if (!app || !app.data) return;
                const foodistData = {
                  tagIds: [],
                  mediaAccounts: [],
                  notes: [],
                  childStage: [],
                  aliases: [],
                  ...JSON.parse(JSON.stringify(app.data)),
                  id: app.id
                };
                if (foodistData.birthDate) {
                  const age = calculateAge(foodistData.birthDate);
                  const ageGroup = calculateAgeGroup(foodistData.birthDate);
                  if (age !== undefined) foodistData.age = age;
                  if (ageGroup) foodistData.ageGroup = ageGroup;
                }
                setEditingFoodist({ ...foodistData, _isApplication: true } as any);
                setIsEditModalOpen(true);
              }}
            />
          )}
        </main>

        {selectedFoodist && (
          <ProfileModal
            foodist={selectedFoodist}
            allTags={tags}
            onClose={closeFoodistModal}
            onTagClick={tagId => {
              const tag = tagMap.get(tagId);
              if (!tag) return;
              if (tag.category === '資格・専門') setSelectedQualificationTagIds(prev => [...prev, tagId]);
              else if (tag.category === '実績') setSelectedAchievementTagIds(prev => [...prev, tagId]);
              else if (tag.category === '対応可能業務') setSelectedWorkTagIds(prev => [...prev, tagId]);
              else if (tag.category === '飲酒について') setSelectedAlcoholTagIds(prev => [...prev, tagId]);
              else setSelectedFeatureTagIds(prev => [...prev, tagId]);
              closeFoodistModal();
            }}
            onEditClick={() => {
              setEditingFoodist(selectedFoodist);
              closeFoodistModal();
              setIsEditModalOpen(true);
            }}
          />
        )}

        {isEditModalOpen && (
          <FoodistEditModal
            foodist={editingFoodist}
            allTags={tags}
            onClose={() => { setIsEditModalOpen(false); setEditingFoodist(null); }}
            onSave={async (data) => {
              if ('id' in data) {
                const isApplication = (data as any)._isApplication;
                if (isApplication) {
                  const now = new Date().toISOString();
                  const newId = `foodist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                  const { _isApplication: _, ...rest } = data as any;
                  const foodist: Foodist = {
                    ...rest,
                    id: newId,
                    createdAt: now,
                    updatedAt: now,
                  } as Foodist;
                  try {
                    await addFoodist(foodist);
                    await updateApplicationStatus(data.id, 'approved');
                    alert('承認・登録が完了しました。');
                  } catch (err) {
                    console.error('Approval failed:', err);
                    alert('承認処理に失敗しました。');
                  }
                } else {
                  updateFoodist(data as Foodist);
                }
              } else {
                addFoodist(data);
              }
              setIsEditModalOpen(false);
              setEditingFoodist(null);
            }}
          />
        )}

        {importResult && (
          <ImportResultModal
            title={importResult.title}
            summary={importResult.summary}
            failures={importResult.failures}
            onClose={() => setImportResult(null)}
          />
        )}
      </div>
    </AuthGate>
  );
}

export default App;
