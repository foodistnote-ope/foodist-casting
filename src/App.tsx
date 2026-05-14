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
  '1荳�悴貅': { min: 0, max: 9999 },
  '1荳��3荳�悴貅': { min: 10000, max: 29999 },
  '3荳��5荳�悴貅': { min: 30000, max: 49999 },
  '5荳��10荳�悴貅': { min: 50000, max: 99999 },
  '10荳��30荳�悴貅': { min: 100000, max: 299999 },
  '30荳��50荳�悴貅': { min: 300000, max: 499999 },
  '50荳��100荳�悴貅': { min: 500000, max: 999999 },
  '100荳��200荳�悴貅': { min: 1000000, max: 1999999 },
  '200荳�ｻ･荳�': { min: 2000000, max: Infinity },
};

function App() {
  // ---- 繝薙Η繝ｼ ----
  const [currentView, setCurrentView] = useState<'dashboard' | 'database' | 'review'>(() => {
    return (localStorage.getItem('app_current_view') as any) || 'dashboard';
  });

  const isPublicApplyPage = window.location.pathname === '/apply';

  // 陦ｨ遉ｺ繝｢繝ｼ繝峨�豌ｸ邯壼喧
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
      // 繝�ヵ繧ｩ繝ｫ繝医〒縺吶∋縺ｦ縺ｮ鬆�岼繧帝∈謚樒憾諷九↓縺吶ｋ
      return EXPORTABLE_COLUMNS.map(c => c.id);
  });
  const [isExportColumnDropdownOpen, setIsExportColumnDropdownOpen] = useState(false);
  const exportColumnDropdownRef = useRef<HTMLDivElement>(null);

  // 繝｢繝舌う繝ｫ蛻､螳夂畑縺ｮ繧ｹ繝��繝医→繝ｪ繧ｹ繝翫���A蛻､螳壹ｂ菴ｵ逕ｨ縺励※遒ｺ螳滓ｧ繧帝ｫ倥ａ繧具ｼ�
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // 蛻晄悄蛹匁凾縺ｫ繧ょｮ溯｡�
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


  // ---- 繝輔ぅ繝ｫ繧ｿ繝ｼ迥ｶ諷� ----
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

  // ---- 繝｢繝ｼ繝繝ｫ迥ｶ諷� ----
  const [selectedFoodist, setSelectedFoodist] = useState<Foodist | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFoodist, setEditingFoodist] = useState<Foodist | null>(null);
  const [importResult, setImportResult] = useState<{
    title: string;
    summary: { success: number; added?: number; updated?: number };
    failures?: { type: 'notFound' | 'conflict' | 'duplicate'; label: string; items: string[] }[];
  } | null>(null);

  // ---- 繝��繧ｿ ----
  const { 
    foodists, loading, error, addFoodist, updateFoodist, deleteFoodist, deleteManyFoodists,
    replaceTagInAll, removeTagsFromAll, exportToJson, importFromJson, mergeFoodists, patchFoodists 
  } = useFoodists();
  const { tags, tagsLoading, getSearchableTags } = useTags();

  // 蜷�き繝�ざ繝ｪ縺ｮ讀懃ｴ｢蜿ｯ閭ｽ繧ｿ繧ｰ��ctive=true & searchVisible=true��
  const qualificationTags = getSearchableTags('雉��ｼ繝ｻ蟆る摩');
  const achievementTags = getSearchableTags('実績');
  const workTags = getSearchableTags('蟇ｾ蠢懷庄閭ｽ讌ｭ蜍�');
  const alcoholTags = getSearchableTags('鬟ｲ驟偵↓縺､縺�※');
  const featureTags = useMemo(() => [
    ...getSearchableTags('蠕玲э縺ｪ譁咏炊繧ｸ繝｣繝ｳ繝ｫ'),
  ], [tags]);

  // CSV 繧､繝ｳ繝昴�繝亥�逅�
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isPatchingCsv, setIsPatchingCsv] = useState(false);
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingCsv(true);
    try {
      let parsed = await parseFoodistCsv(file, tags);
      if (parsed.length === 0) {
        alert('CSV縺ｫ譛牙柑縺ｪ繝��繧ｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲�');
        return;
      }

      // --- 蜷悟錐繝��繧ｿ縺ｮ驥崎､�メ繧ｧ繝�け�域ｭ｣隕丞喧縺ｨ繧ｨ繧､繝ｪ繧｢繧ｹ繧定���� ---
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
        const extraMsg = duplicates.length > 10 ? ' 縺ｪ縺ｩ' : '';
        const msg = `笞��� 驥崎､�ｭｦ蜻浬n\n繧｢繝��繝ｭ繝ｼ繝峨＆繧後◆CSV蜀�↓縲∵里縺ｫ逋ｻ骭ｲ縺輔ｌ縺ｦ縺�ｋ�医∪縺溘�繧ｨ繧､繝ｪ繧｢繧ｹ縺御ｸ閾ｴ縺吶ｋ�峨ヵ繝ｼ繝�ぅ繧ｹ繝医′ ${duplicates.length} 莉ｶ蜷ｫ縺ｾ繧後※縺�∪縺吶�n��${namesMsg}${extraMsg}�噂n\n驥崎､�ｒ驕ｿ縺代ｋ縺溘ａ縲√％繧後ｉ譌｢蟄倥�繝��繧ｿ繧偵後せ繧ｭ繝��縲阪＠縺ｦ縲∵眠縺励￥霑ｽ蜉�縺輔ｌ繧倶ｺｺ縺ｮ縺ｿ繧偵う繝ｳ繝昴�繝医＠縺ｾ縺吶°�歃n�医後く繝｣繝ｳ繧ｻ繝ｫ縲阪ｒ謚ｼ縺吶→縲√う繝ｳ繝昴�繝郁�菴薙ｒ縺吶∋縺ｦ荳ｭ豁｢縺励∪縺呻ｼ荏;

        if (window.confirm(msg)) {
          // 驥崎､��縺ｮ繝��繧ｿ繧帝�蛻励°繧蛾勁螟悶＠縺ｦ繧ｹ繧ｭ繝��縺吶ｋ
          parsed = parsed.filter(p => findExistingIdx(p.displayName) === -1);
          if (parsed.length === 0) {
            alert('譁ｰ縺励＞繝��繧ｿ縺後↑縺九▲縺溘◆繧√√う繝ｳ繝昴�繝医ｒ邨ゆｺ�＠縺ｾ縺励◆縲�');
            setIsImportingCsv(false);
            e.target.value = '';
            return;
          }
        } else {
          // 繧ｭ繝｣繝ｳ繧ｻ繝ｫ譎ゅ�縺吶∋縺ｦ荳ｭ豁｢
          setIsImportingCsv(false);
          e.target.value = '';
          return;
        }
      }

      const { added } = await mergeFoodists(parsed);
      setImportResult({
        title: '譁ｰ隕剰ｿｽ蜉�繧､繝ｳ繝昴�繝育ｵ先棡',
        summary: { success: added, added },
        failures: duplicates.length > 0 ? [{ type: 'duplicate', label: '逋ｻ骭ｲ貂医∩縺ｮ縺溘ａ繧ｹ繧ｭ繝��', items: duplicates.map(p => p.displayName) }] : []
      });
    } catch (err) {
      console.error(err);
      alert(`CSVインポートに失敗しました。\n${err}`);
    } finally {
      setIsImportingCsv(false);
      e.target.value = '';
    }
  };

  // CSV 驛ｨ蛻�峩譁ｰ繧､繝ｳ繝昴�繝亥�逅�
  const handlePatchCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPatchingCsv(true);
    try {
      const patches = await parsePatchCsv(file, tags);
      if (patches.length === 0) {
        alert('CSV縺ｫ繝��繧ｿ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲�');
        return;
      }

      const confirmMsg = `驛ｨ蛻�峩譁ｰCSV繧定ｪｭ縺ｿ霎ｼ縺ｿ縺ｾ縺励◆縲�n蟇ｾ雎｡繝ｬ繧ｳ繝ｼ繝画焚: ${patches.length}莉ｶ\n\n縲景d縲阪∪縺溘�縲梧ｴｻ蜍募錐縲阪〒繝槭ャ繝√＠縺滓里蟄倥ョ繝ｼ繧ｿ縺ｫ蟾ｮ蛻�ｒ荳頑嶌縺阪＠縺ｾ縺吶�n譁ｰ隕冗匳骭ｲ縺ｯ縺輔ｌ縺ｾ縺帙ｓ縲�n\n螳溯｡後＠縺ｾ縺吶°�歔;
      if (!window.confirm(confirmMsg)) return;

      const { updated, notFound, conflicts, noUpdateFields } = await patchFoodists(patches);
      setImportResult({
        title: '驛ｨ蛻�峩譁ｰ邨先棡',
        summary: { success: updated },
        failures: [
          { type: 'notFound', label: '繝槭ャ繝√＠縺ｪ縺九▲縺溯｡�', items: notFound },
          { type: 'conflict', label: '隍�焚縺ｮ蛟呵｣懊′隕九▽縺九ｊ繧ｹ繧ｭ繝��', items: conflicts },
          { type: 'noUpdate' as any, label: '譛牙柑縺ｪ譖ｴ譁ｰ鬆�岼縺瑚ｦ九▽縺九ｉ縺ｪ縺九▲縺溯｡�', items: noUpdateFields }
        ]
      });
    } catch (err) {
      console.error(err);
      alert(`驛ｨ蛻�峩譁ｰCSV縺ｮ繧､繝ｳ繝昴�繝医↓螟ｱ謨励＠縺ｾ縺励◆縲�n${err}`);
    } finally {
      setIsPatchingCsv(false);
      e.target.value = '';
    }
  };

  // JSON 繧､繝ｳ繝昴�繝亥�逅�
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importFromJson(file, 'merge')
      .then(({ added, updated }) => {
        alert(`繧､繝ｳ繝昴�繝亥ｮ御ｺ�n霑ｽ蜉�: ${added}莉ｶ / 譖ｴ譁ｰ: ${updated}莉ｶ`);
      })
      .catch(err => {
        alert(`繧､繝ｳ繝昴�繝医↓螟ｱ謨励＠縺ｾ縺励◆縲�n${err}`);
      });
    // 蜷後§繝輔ぃ繧､繝ｫ繧貞�蠎ｦ驕ｸ謚槭〒縺阪ｋ繧医≧縺ｫ繝ｪ繧ｻ繝�ヨ
    e.target.value = '';
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`縲�${name}縲阪ｒ蜑企勁縺励∪縺吶°�歃n縺薙�謫堺ｽ懊�蜈�↓謌ｻ縺帙∪縺帙ｓ縲Ａ)) {
      deleteFoodist(id);
      if (selectedFoodist?.id === id) {
        setSelectedFoodist(null);
      }
    }
  };

  // 繧ｿ繧ｰID縺九ｉ繧ｿ繧ｰ諠��ｱ繧貞ｼ輔″繧�☆縺上☆繧九◆繧√�Map
  const tagMap = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);

  // ---- 繝輔ぅ繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ ----
  const filteredFoodists = useMemo(() => {
    return foodists.filter(f => {
      // 1. 繧ｭ繝ｼ繝ｯ繝ｼ繝画､懃ｴ｢�域ｴｻ蜍募錐繝ｻ閧ｩ譖ｸ縺阪�荳隕ｧ逕ｨ邏ｹ莉区枚繝ｻ繧ｿ繧ｰ蜷阪�繧ｨ繧､繝ｪ繧｢繧ｹ遲会ｼ�
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

      // 2. 螻�ｽ丞慍
      if (selectedAreas.length > 0 && !selectedAreas.includes(f.area || '')) return false;

      // 3. 蜃ｺ霄ｫ蝨ｰ
      if (selectedBirthplaces.length > 0 && !selectedBirthplaces.includes(f.birthplace || '')) return false;

      // 4. 蟷ｴ莉｣
      if (selectedAges.length > 0) {
        const effectiveAgeGroup = getEffectiveAgeGroup(f);
        if (!selectedAges.includes(effectiveAgeGroup || '')) return false;
      }

      // 4.5 諤ｧ蛻･
      if (selectedGenders.length > 0 && !selectedGenders.includes(f.gender || '')) return false;

      // 5. 繝輔�繝�ぅ繧ｹ繝井ｼ壼藤逋ｻ骭ｲ迥ｶ豕�
      if (selectedMemberships.length > 0 && !selectedMemberships.includes(f.membershipStatus)) return false;

      // 5.5 蟀壼ｧｻ迥ｶ豕�
      if (selectedMaritalStatus.length > 0 && !selectedMaritalStatus.includes(f.maritalStatus || '')) return false;

      // 6. 鬘泌�縺怜庄蜷ｦ
      if (selectedFaceVisibility.length > 0 && !selectedFaceVisibility.includes(f.faceVisibility)) return false;

      // 7. 蟄舌←繧ゅ�譛臥┌
      if (selectedHasChildren.length > 0 && !selectedHasChildren.includes(f.hasChildren)) return false;

      // 8. 蟄舌←繧ゅ�謨ｰ
      if (selectedChildrenCount.length > 0 && !selectedChildrenCount.includes(f.childrenCount || '')) return false;

      // 9. 蟄占ご縺ｦ繧ｹ繝��繧ｸ��R讀懃ｴ｢: 縺�★繧後°縺ｫ蠖薙※縺ｯ縺ｾ繧具ｼ�
      if (selectedChildStages.length > 0 && !selectedChildStages.some(s => f.childStage.includes(s))) return false;

      // 10. 邱上ヵ繧ｩ繝ｭ繝ｯ繝ｼ謨ｰ
      if (selectedFollowers.length > 0) {
        if (f.totalFollowers == null) return false;
        const matchesRanges = selectedFollowers.some(key => {
          const rng = FOLLOWER_RANGES[key];
          if (!rng) return false;
          return f.totalFollowers! >= rng.min && f.totalFollowers! <= rng.max;
        });
        if (!matchesRanges) return false;
      }

      // 10.5 Instagram繝輔か繝ｭ繝ｯ繝ｼ謨ｰ
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

      // 10.6 X繝輔か繝ｭ繝ｯ繝ｼ謨ｰ
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

      // 10.7 TikTok繝輔か繝ｭ繝ｯ繝ｼ謨ｰ
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

      // 10.8 YouTube逋ｻ骭ｲ閠�焚
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

      // 11.5 菫晄怏繝励Λ繝�ヨ繝輔か繝ｼ繝���R讀懃ｴ｢: mediaAccounts縺ｫURL縺後≠繧九Ξ繧ｳ繝ｼ繝峨�mediaType縺ｧ蛻､螳夲ｼ�
      if (selectedPlatforms.length > 0) {
        const ownedPlatforms = new Set(
          f.mediaAccounts
            .filter(a => a.url && a.url.trim() !== '')
            .map(a => a.mediaType)
        );
        const matches = selectedPlatforms.some(p => ownedPlatforms.has(p as MediaType));
        if (!matches) return false;
      }

      // 11. 繧ｿ繧ｰ邨槭ｊ霎ｼ縺ｿ�亥推繧ｫ繝�ざ繝ｪ蜀�〒 AND縲√き繝�ざ繝ｪ髢薙ｂ AND��
      const allSelectedTagIds = [
        ...selectedQualificationTagIds,
        ...selectedAchievementTagIds,
        ...selectedWorkTagIds,
        ...selectedFeatureTagIds,
        ...selectedAlcoholTagIds,
      ];
      if (allSelectedTagIds.length > 0 && !allSelectedTagIds.every(id => (f.tagIds || []).includes(id))) return false;
      
      // 12. 繝輔�繝�ぅ繧ｹ繝医ヮ繝ｼ繝域軸霈牙庄蜷ｦ
      if (selectedNoteFeaturedPermissions.length > 0) {
        const actualPermission = f.noteFeaturedPermission || '譛ｪ險ｭ螳�';
        const matches = selectedNoteFeaturedPermissions.some(selected => {
          // 遏ｭ邵ｮ陦ｨ遉ｺ縲梧軸霈牙庄�井ｺ句燕遒ｺ隱阪�荳崎ｦ�ｼ峨阪�DB蛟､縲梧軸霈牙庄�井ｺ句燕遒ｺ隱阪�荳崎ｦ√∵軸霈牙ｾ後↓譯亥�縺後≠繧後�OK�峨阪↓繝槭ャ繝�
          if (selected === '謗ｲ霈牙庄�井ｺ句燕遒ｺ隱阪�荳崎ｦ�ｼ�') {
            return actualPermission === '謗ｲ霈牙庄�井ｺ句燕遒ｺ隱阪�荳崎ｦ√∵軸霈牙ｾ後↓譯亥�縺後≠繧後�OK��';
          }
          return actualPermission === selected;
        });
        if (!matches) return false;
      }

      // 13. 譁咏炊謨吝ｮ､縺ｮ驕句霧迥ｶ豕�
      if (selectedCookingClassStatuses.length > 0 && !selectedCookingClassStatuses.includes(f.cookingClassStatus || '譛ｪ遒ｺ隱�')) return false;

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

  // ---- 繝��繧ｿ遘ｻ陦�: 荳崎ｦ√ち繧ｰ縺ｮ謨ｴ逅� (v5) ----
  useEffect(() => {
    if (loading || foodists.length === 0) return;
    const MIGRATION_KEY = 'foodist_tag_cleanup_v5';
    if (localStorage.getItem(MIGRATION_KEY)) return;
    localStorage.setItem(MIGRATION_KEY, 'done');
    const deletedTagIds = ['tag_d030', 'tag_d031', 'tag_d032'];
    removeTagsFromAll(deletedTagIds);
  }, [loading, foodists, removeTagsFromAll]);

  // ---- URL繝吶�繧ｹ縺ｮ繝�ぅ繝ｼ繝励Μ繝ｳ繧ｯ ----
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
        alert('蜃ｺ蜉帙☆繧九ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ縲�');
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
    '繝悶Ο繧ｰ': "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23555'/%3E%3Ctext x='50' y='73' font-family='Arial' font-size='65' font-weight='bold' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E",
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
        <span>繝��繧ｿ繧定ｪｭ縺ｿ霎ｼ繧薙〒縺�∪縺�...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '12px', color: '#c0392b', fontFamily: 'sans-serif' }}>
        <p>笞��� 繝��繧ｿ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆</p>
        <pre style={{ fontSize: '0.8rem', background: '#fef', padding: '8px', borderRadius: '4px' }}>{error}</pre>
        <button onClick={() => window.location.reload()}>蜀崎ｪｭ縺ｿ霎ｼ縺ｿ縺吶ｋ</button>
      </div>
    );
  }

  if (isPublicApplyPage) {
    return <PublicRegistrationForm allTags={tags} />;
  }

  return (
    <AuthGate>
      <div className={`app-container ${isMobile ? 'is-mobile' : ''}`}>
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} isMobile={isMobile} />

        <main className="main-content">
          {currentView === 'dashboard' ? (
            <>
              <header className="top-header dashboard-header">
                <div className="header-actions">
                  {!isMobile && (
                    <div className="csv-export-group">
                      <div className="column-dropdown-container" ref={exportColumnDropdownRef}>
                        <button 
                            className="btn-text-export-settings" 
                            onClick={() => setIsExportColumnDropdownOpen(!isExportColumnDropdownOpen)}
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
                                    <span>CSV出力項目</span>
                                </div>
                                <div className="column-dropdown-body">
                                    {EXPORTABLE_COLUMNS.map(column => (
                                        <label key={column.id} className="column-checkbox-item">
                                            <input 
                                                type="checkbox" 
                                                checked={exportColumnIds.includes(column.id)}
                                                onChange={() => toggleExportColumn(column.id)}
                                            />
                                            <span>{column.label}</span>
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

                  <button className="btn-primary" onClick={() => { setEditingFoodist(null); setIsEditModalOpen(true); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    新規登録
                  </button>
                  {!isMobile && (
                    <>
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
                        ? `${filteredFoodists.length}莉ｶ縺ｮ繝輔�繝�ぅ繧ｹ繝医′隕九▽縺九ｊ縺ｾ縺励◆`
                        : `蜈ｨ${foodists.length}莉ｶ縺ｮ繝輔�繝�ぅ繧ｹ繝�}
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
                          .filter(a => a.url && ['Instagram', 'X', 'YouTube', 'TikTok', '繝悶Ο繧ｰ'].includes(a.mediaType) && a.showOnDetail)
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
                              <div className="card-main-info" style={isMobile ? { display: 'flex', alignItems: 'center', gap: '12px' } : undefined}>
                                <img 
                                  src={foodist.avatarUrl || '/no-image.png'} 
                                  alt={foodist.displayName} 
                                  className="card-avatar" 
                                   
                                />
                                <div className="card-header" >
                                  <h3 className="foodist-name" >{foodist.displayName}</h3>
                                  <span className="foodist-title" >{foodist.title || '�郁か譖ｸ縺肴悴險ｭ螳夲ｼ�'}</span>
                                </div>
                              </div>

                              <div className="card-details">
                                <div className="card-stats">
                                  {activeSnsFilter && activeSnsFilter !== '__total__' ? (() => {
                                    const acc = foodist.mediaAccounts.find(a => a.mediaType === activeSnsFilter);
                                    const labelMap: Record<string, string> = {
                                      'Instagram': 'Instagram繝輔か繝ｭ繝ｯ繝ｼ',
                                      'X': 'X繝輔か繝ｭ繝ｯ繝ｼ',
                                      'TikTok': 'TikTok繝輔か繝ｭ繝ｯ繝ｼ',
                                      'YouTube': 'YouTube逋ｻ骭ｲ閠�焚',
                                    };
                                    return (
                                      <>
                                        <span className="stat-label">{labelMap[activeSnsFilter]}:</span>
                                        <span className="stat-value">{acc?.metricValue != null ? acc.metricValue.toLocaleString() : '譛ｪ險ｭ螳�'}</span>
                                      </>
                                    );
                                  })() : (
                                    <>
                                      <span className="stat-label">邱上ヵ繧ｩ繝ｭ繝ｯ繝ｼ:</span>
                                      <span className="stat-value">{foodist.totalFollowers ? foodist.totalFollowers.toLocaleString() : '譛ｪ險ｭ螳�'}</span>
                                    </>
                                  )}
                                </div>

                                {cardMedia.length > 0 && (
                                  <div className="card-sns" style={isMobile ? { display: 'flex', flexDirection: 'row', gap: '8px', flexWrap: 'wrap', marginTop: '8px' } : undefined}>
                                    {cardMedia.map(acc => (
                                      <a key={acc.id} href={acc.url} target="_blank" rel="noreferrer" className="sns-link" title={acc.mediaType} onClick={e => e.stopPropagation()} style={isMobile ? { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '4px', borderRadius: '4px' } : undefined}>
                                        <img
                                          src={CARD_SNS_ICONS[acc.mediaType] || CARD_SNS_ICONS['繝悶Ο繧ｰ']}
                                          alt={acc.mediaType}
                                          className="sns-icon-img"
                                          style={{
                                            width: isMobile ? '20px' : '16px',
                                            height: isMobile ? '20px' : '16px',
                                            ...(acc.mediaType === 'X' ? { filter: 'invert(1)' } : {})
                                          }}
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {cardTags.length > 0 && (
                                  <div className="card-tags" style={isMobile ? { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' } : undefined}>
                                    {cardTags.map(tag => {
                                      const isSelected = [...selectedQualificationTagIds, ...selectedAchievementTagIds, ...selectedWorkTagIds, ...selectedFeatureTagIds, ...selectedAlcoholTagIds].includes(tag.id);
                                      return (
                                        <span
                                          key={tag.id}
                                          className={`tag ${isSelected ? 'tag-selected' : ''}`}
                                          onClick={e => {
                                            e.stopPropagation();
                                            if (tag.category === '雉��ｼ繝ｻ蟆る摩') {
                                              setSelectedQualificationTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                            } else if (tag.category === '螳溽ｸｾ') {
                                              setSelectedAchievementTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                            } else if (tag.category === '蟇ｾ蠢懷庄閭ｽ讌ｭ蜍�') {
                                              setSelectedWorkTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                            } else if (tag.category === '鬟ｲ驟偵↓縺､縺�※') {
                                              setSelectedAlcoholTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                            } else {
                                              setSelectedFeatureTagIds(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                                            }
                                          }}
                                          style={isMobile ? { 
                                            fontSize: '10px', 
                                            padding: '2px 8px', 
                                            background: isSelected ? 'var(--color-brand-primary)' : '#f1f5f9',
                                            color: isSelected ? 'white' : 'var(--color-text-secondary)',
                                            borderRadius: '4px',
                                            border: '1px solid #e2e8f0',
                                            display: 'inline-block'
                                          } : { cursor: 'pointer' }}
                                          title={tag.category}
                                        >
                                          {tag.name}
                                        </span>
                                      );
                                    })}
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
                      <p>譚｡莉ｶ縺ｫ荳閾ｴ縺吶ｋ繝輔�繝�ぅ繧ｹ繝医′隕九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲�</p>
                      <button className="btn-text" onClick={handleResetFilters}>譚｡莉ｶ繧偵け繝ｪ繧｢縺吶ｋ</button>
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
              if (tag.category === '雉��ｼ繝ｻ蟆る摩') setSelectedQualificationTagIds(prev => [...prev, tagId]);
              else if (tag.category === '螳溽ｸｾ') setSelectedAchievementTagIds(prev => [...prev, tagId]);
              else if (tag.category === '蟇ｾ蠢懷庄閭ｽ讌ｭ蜍�') setSelectedWorkTagIds(prev => [...prev, tagId]);
              else if (tag.category === '鬟ｲ驟偵↓縺､縺�※') setSelectedAlcoholTagIds(prev => [...prev, tagId]);
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
                    alert('謇ｿ隱阪�逋ｻ骭ｲ縺悟ｮ御ｺ�＠縺ｾ縺励◆縲�');
                  } catch (err) {
                    console.error('Approval failed:', err);
                    alert('謇ｿ隱榊�逅�↓螟ｱ謨励＠縺ｾ縺励◆縲�');
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
