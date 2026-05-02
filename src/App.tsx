import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FilterSidebar } from './components/FilterSidebar';
import { ProfileModal } from './components/ProfileModal';
import { TagSettingsModal } from './components/TagSettingsModal';
import { DatabaseView } from './components/DatabaseView';
import { FoodistEditModal } from './components/FoodistEditModal';
import type { Foodist, MediaType } from './data/types';
import { useTags } from './hooks/useTags';
import { useFoodists, normalizeString } from './hooks/useFoodists';
import { parseFoodistCsv, parsePatchCsv } from './utils/csvParser';
import { AuthGate } from './components/AuthGate';
import { ImportResultModal } from './components/ImportResultModal';
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'database'>('dashboard');

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

  // ---- モーダル状態 ----
  const [selectedFoodist, setSelectedFoodist] = useState<Foodist | null>(null);
  const [isTagSettingsOpen, setIsTagSettingsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFoodist, setEditingFoodist] = useState<Foodist | null>(null);
  const [importResult, setImportResult] = useState<{
    title: string;
    summary: { success: number; added?: number; updated?: number };
    failures?: { type: 'notFound' | 'conflict' | 'duplicate'; label: string; items: string[] }[];
  } | null>(null);

  // ---- データ ----
  const { foodists, loading, error, addFoodist, updateFoodist, deleteFoodist, replaceTagInAll, batchReplaceTags, exportToJson, importFromJson, mergeFoodists, patchFoodists } = useFoodists();
  const { tags, tagsLoading, addTag, removeTag, toggleTagActive, deactivateTag, getSearchableTags } = useTags();

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

      const { updated, notFound, conflicts } = await patchFoodists(patches);
      setImportResult({
        title: '部分更新結果',
        summary: { success: updated },
        failures: [
          { type: 'notFound', label: 'マッチしなかった行', items: notFound },
          { type: 'conflict', label: '複数の候補が見つかりスキップ', items: conflicts }
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
      const tagNames = f.tagIds.map(id => tagMap.get(id)?.name || '').join(' ').toLowerCase();
      
      if (q && !f.displayName.toLowerCase().includes(q) &&
        !(f.title || '').toLowerCase().includes(q) &&
        !(f.listIntro || '').toLowerCase().includes(q) &&
        !(f.realName || '').toLowerCase().includes(q) &&
        !(f.aliases ?? []).some(a => a.toLowerCase().includes(q)) &&
        !tagNames.includes(q) &&
        !f.mediaAccounts.some(acc => 
          (acc.accountName || '').toLowerCase().includes(q) || 
          (acc.url || '').toLowerCase().includes(q)
        ) &&
        !f.notes.some(n => n.content.toLowerCase().includes(q))
      ) return false;

      // 2. 居住地
      if (selectedAreas.length > 0 && !selectedAreas.includes(f.area || '')) return false;

      // 3. 出身地
      if (selectedBirthplaces.length > 0 && !selectedBirthplaces.includes(f.birthplace || '')) return false;

      // 4. 年代
      if (selectedAges.length > 0 && !selectedAges.includes(f.ageGroup || '')) return false;

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
      if (allSelectedTagIds.length > 0 && !allSelectedTagIds.every(id => f.tagIds.includes(id))) return false;
      
      // 12. フーディストノート掲載可否
      if (selectedNoteFeaturedPermissions.length > 0 && !selectedNoteFeaturedPermissions.includes(f.noteFeaturedPermission || '未設定')) return false;

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
  };

  /*
  // ---- データ移行: 動画関連タグの統合 ----
  useEffect(() => {
    if (loading || foodists.length === 0) return;
    const MIGRATION_KEY = 'foodist_tag_migration_v4_video';
    if (localStorage.getItem(MIGRATION_KEY)) return;

    // 統合対象: tag_w007 (動画企画), tag_w008 (動画撮影), tag_w010 (動画台本作成) -> tag_w009 (動画制作)
    const replacements = [
      { source: 'tag_w007', target: 'tag_w009' },
      { source: 'tag_w008', target: 'tag_w009' },
      { source: 'tag_w010', target: 'tag_w009' },
    ];

    batchReplaceTags(replacements);
    localStorage.setItem(MIGRATION_KEY, 'done');
    console.info('[App] 動画関連タグの統合（v4）が完了しました');
  }, [loading, foodists, batchReplaceTags]);
  */

  // ---- URLベースのディープリンク ----
  // フーディストがロードされたらURLパラメータをチェックし、对象のモーダルを自動で開く
  useEffect(() => {
    if (loading || foodists.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const foodistId = params.get('foodist');
    if (foodistId) {
      const target = foodists.find(f => f.id === foodistId);
      if (target) setSelectedFoodist(target);
    }
  }, [loading, foodists]);

  // モーダルを開くときにURLを更新するヘルパー
  const openFoodistModal = (foodist: Foodist) => {
    setSelectedFoodist(foodist);
    const params = new URLSearchParams(window.location.search);
    params.set('foodist', foodist.id);
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  // モーダルを閉じるときにURLをクリーンにするヘルパー
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
  ].some(a => a.length > 0);

  // SNSフォロワーフィルターのアクティブなプラットフォームを特定し、そのフォロワー数で降順ソート
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

  // SNSアイコンの定義（カード表示用）
  const CARD_SNS_ICONS: Record<string, string> = {
    'ブログ': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23555'/%3E%3Ctext x='50' y='73' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E",
    'Instagram': 'https://foodistnote.recipe-blog.jp/wp-content/themes/foodist_note/assets/img/common/icon_sns_instagram.png',
    'X': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/X_icon_2.svg',
    'TikTok': '/tiktok-icon.png',
    'YouTube': 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
  };

  // ---- ローディング / エラー画面 ----
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

  return (
    <AuthGate>
      <div className="app-container">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

        {currentView === 'dashboard' ? (
          <main className="main-content">
            <header className="top-header" style={{ justifyContent: 'flex-end' }}>
              <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* 新規登録 */}
                <button className="btn-primary" style={{ marginRight: '8px' }} onClick={() => { setEditingFoodist(null); setIsEditModalOpen(true); }}>
                  + 新規登録
                </button>
                {/* JSONバックアップ */}
                <button className="btn-secondary" onClick={exportToJson} title="現在のデータをJSONファイルとしてダウンロード">
                  💾 バックアップ
                </button>
                <label className="btn-secondary" style={{ cursor: 'pointer' }} title="JSONバックアップファイルを読み込んで復元">
                  📂 復元
                  <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonImport} />
                </label>
                <button className="btn-secondary" onClick={() => setIsTagSettingsOpen(true)}>
                  タグの管理
                </button>
              </div>
            </header>

            <div style={{ display: 'flex' }}>
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
                      // 表示するタグ（最大8件、active=true 優先）
                      const cardTags = foodist.tagIds
                        .map(id => tagMap.get(id))
                        .filter((t): t is NonNullable<typeof t> => t != null)
                        .slice(0, 8);

                      // 媒体リンク（showOnDetail=true、主要SNSのみ）
                      const cardMedia = foodist.mediaAccounts
                        .filter(a => a.url && ['Instagram', 'X', 'YouTube', 'TikTok', 'ブログ'].includes(a.mediaType) && a.showOnDetail)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .slice(0, 5);

                      return (
                        <div key={foodist.id} className="foodist-card" onClick={() => openFoodistModal(foodist)}>
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
                              <p className="card-notes">{foodist.listIntro || '（紹介文未設定）'}</p>

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
          </main>
        ) : (
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
        )}

        {/* 詳細モーダル */}
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

        {/* タグ管理モーダル */}
        {isTagSettingsOpen && (
          <TagSettingsModal
            tags={tags}
            addTag={addTag}
            removeTag={removeTag}
            toggleTagActive={toggleTagActive}
            deactivateTag={deactivateTag}
            onMerge={(sourceId, targetId) => {
              deactivateTag(sourceId);
              replaceTagInAll(sourceId, targetId);
            }}
            onClose={() => setIsTagSettingsOpen(false)}
          />
        )}

        {/* 編集モーダル */}
        {isEditModalOpen && (
          <FoodistEditModal
            foodist={editingFoodist}
            allTags={tags}
            onClose={() => { setIsEditModalOpen(false); setEditingFoodist(null); }}
            onSave={data => {
              if ('id' in data) {
                updateFoodist(data as Foodist);
              } else {
                addFoodist(data);
              }
              setIsEditModalOpen(false);
              setEditingFoodist(null);
            }}
          />
        )}

        {/* インポート結果モーダル */}
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
