import type { Foodist } from './types';

/**
 * 初期実データ (initialFoodists)
 * 2026/04/01 にユーザー様より提供された9名分の実データをベースにしています。
 * ブラウザの localStorage がリセットされた際、このデータが初期状態として読み込まれます。
 */
export const initialFoodists: Foodist[] = [
  {
    "displayName": "山本ゆり",
    "realName": "山本 ゆり",
    "title": "料理コラムニスト",
    "membershipStatus": "あり",
    "area": "大阪府",
    "ageGroup": "30代",
    "gender": "女性",
    "faceVisibility": "可",
    "hasChildren": "あり",
    "childStage": [
      "小学生の子あり"
    ],
    "listIntro": "絶大な影響力。親しみやすいキャラクターで幅広い層から支持。",
    "profileText": "『syunkonカフェごはん』(宝島社)シリーズなどに代表される著書は、累計で780万部を超えるベストセラーに。身近な材料で簡単にできる料理と、ユーモアあふれる日常を綴ったブログから人気に火が付き、X・Instagramではそれぞれ135万人を超えるフォロワーから支持を集めている。",
    "avatarUrl": "https://foodistnote.recipe-blog.jp/wp-content/uploads/2023/07/24164123/yamamotoyuri-1-20230724164122-20230724164122.jpg",
    "totalFollowers": 2920000,
    "tagIds": [
      "tag_a008",
      "tag_a005",
      "tag_a006",
      "tag_a007",
      "tag_a009",
      "tag_a013",
      "tag_a012",
      "tag_a017",
      "tag_w001",
      "tag_w002",
      "tag_w004",
      "tag_w005",
      "tag_w012",
      "tag_w013",
      "tag_w014",
      "tag_w015",
      "tag_w016",
      "tag_d001",
      "tag_d009",
      "tag_d030",
      "tag_d029",
      "tag_d027",
      "tag_d007",
      "tag_custom_1774536193563",
      "tag_custom_1774536516603",
      "tag_custom_1774536534173",
      "tag_custom_1774536529197",
      "tag_custom_1774536627657"
    ],
    "mediaAccounts": [
      {
        "id": "media_1_blog",
        "mediaType": "ブログ",
        "accountName": "含み笑いのカフェごはん『syunkon』",
        "url": "https://ameblo.jp/syunkon/",
        "metricType": "PV",
        "metricValue": 5000000,
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_1_ig",
        "mediaType": "Instagram",
        "url": "https://www.instagram.com/yamamoto0507/",
        "metricType": "フォロワー数",
        "metricValue": 1350000,
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-18T20:51:35.540Z",
        "accountName": "yamamoto0507"
      },
      {
        "id": "media_1_x",
        "mediaType": "X",
        "url": "https://x.com/syunkon0507",
        "metricType": "フォロワー数",
        "metricValue": 1570000,
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-18T20:51:35.540Z",
        "accountName": "syunkon0507"
      }
    ],
    "notes": [
      {
        "id": "note_1_1",
        "noteType": "その他",
        "content": "",
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "note_1774596118483_l7yr",
        "noteType": "その他",
        "content": "",
        "updatedAt": "2026-03-27T07:21:58.483Z"
      }
    ],
    "createdAt": "2026-03-18T20:51:35.540Z",
    "updatedAt": "2026-03-27T07:29:54.462Z",
    "childrenCount": "3",
    "maritalStatus": "既婚",
    "id": "1"
  },
  {
    "displayName": "Mizuki",
    "realName": "Mizuki",
    "title": "料理研究家,スイーツコンシェルジュ",
    "membershipStatus": "要確認",
    "area": "和歌山県",
    "ageGroup": "30代",
    "gender": "女性",
    "faceVisibility": "可",
    "hasChildren": "非公開",
    "childStage": [],
    "listIntro": "簡単・時短・節約をコンセプトに、身近な食材で誰でも失敗なく作れるレシピを発信。",
    "profileText": "和歌山県在住の料理研究家・スイーツコンシェルジュ。“簡単・時短・節約”をコンセプトに、ブログ「Mizukiオフィシャルブログ～奇跡のキッチン」で毎日レシピを紹介し、月間300万PVを誇る。「フーディストアワード2022」では、総合グランプリを受賞。",
    "avatarUrl": "https://foodistnote.recipe-blog.jp/wp-content/uploads/2025/09/09093942/Mizuki%E3%81%95%E3%82%93%E3%83%97%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%E5%86%99%E7%9C%9F202509-2-20250909093941-20250909093941-100x100.jpg",
    "totalFollowers": 1372000,
    "tagIds": [
      "tag_q014",
      "tag_a002",
      "tag_a008",
      "tag_a007",
      "tag_a009",
      "tag_a010",
      "tag_a011",
      "tag_a005",
      "tag_a006",
      "tag_a013",
      "tag_a012",
      "tag_a017",
      "tag_w001",
      "tag_w002",
      "tag_w005",
      "tag_w011",
      "tag_w015",
      "tag_w016",
      "tag_w014",
      "tag_w013",
      "tag_d009"
    ],
    "mediaAccounts": [
      {
        "id": "media_2_blog",
        "mediaType": "ブログ",
        "accountName": "「奇跡のキッチン」",
        "url": "https://mizuki-recipe.blog.jp/",
        "metricType": "PV",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_2_ig",
        "mediaType": "Instagram",
        "url": "https://www.instagram.com/mizuki_31cafe/",
        "metricType": "フォロワー数",
        "metricValue": 1320000,
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_2_x",
        "mediaType": "X",
        "url": "https://x.com/Mizuki_31cafe",
        "metricType": "フォロワー数",
        "metricValue": 12000,
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_2_yt",
        "mediaType": "YouTube",
        "accountName": "Mizuki・料理研究家",
        "url": "https://www.youtube.com/channel/UCGbKzBQqpTsLaFmzfPjOyfw",
        "metricType": "チャンネル登録者数",
        "metricValue": 40000,
        "showOnDetail": true,
        "sortOrder": 4,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      }
    ],
    "notes": [
      {
        "id": "note_2_1",
        "noteType": "その他",
        "content": "簡単・時短・節約をコンセプトに、身近な食材で誰でも失敗なく作れるレシピを発信。",
        "updatedAt": "2026-03-18T20:51:35.540Z"
      }
    ],
    "createdAt": "2026-03-18T20:51:35.540Z",
    "updatedAt": "2026-03-25T09:53:15.811Z",
    "childrenCount": "非公開",
    "id": "2"
  },
  {
    "displayName": "Yｕｕ",
    "realName": "Yｕｕ",
    "title": "料理家、野菜ソムリエ",
    "membershipStatus": "要確認",
    "area": "福岡県",
    "ageGroup": "40代",
    "gender": "女性",
    "faceVisibility": "可",
    "hasChildren": "なし",
    "childStage": [],
    "listIntro": "身近な食材で作れる簡単レシピが特徴。ブロググランプリ受賞歴あり。",
    "profileText": "福岡県在住の料理研究家。彼のために作る日々の料理を紹介するブログが瞬く間に人気となり、WEBサイトでの連載や雑誌、広告、企業のレシピ開発などで幅広く活躍中。「フーディストアワード2020」ではブログ部門のグランプリを受賞。",
    "totalFollowers": 1135000,
    "tagIds": [
      "tag_d009",
      "tag_d002",
      "tag_d001",
      "tag_d003",
      "tag_d004"
    ],
    "mediaAccounts": [
      {
        "id": "media_3_blog",
        "mediaType": "ブログ",
        "accountName": "「作り置き＆スピードおかず de おうちバル 〜yuu's stylish bar〜」",
        "url": "https://yuu-stylish-bar.blog.jp",
        "metricType": "PV",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_3_ig",
        "mediaType": "Instagram",
        "url": "https://www.instagram.com/yuuyuu514/",
        "metricType": "フォロワー数",
        "metricValue": 1070000,
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_3_x",
        "mediaType": "X",
        "url": "https://x.com/innocence_yuu",
        "metricType": "フォロワー数",
        "metricValue": 53000,
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_3_yt",
        "mediaType": "YouTube",
        "accountName": "Yuuのラクうまクッキング",
        "url": "https://www.youtube.com/@yuulacook8944",
        "metricType": "チャンネル登録者数",
        "metricValue": 12000,
        "showOnDetail": true,
        "sortOrder": 4,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_3_tt",
        "mediaType": "TikTok",
        "url": "https://www.tiktok.com/@yuuyuu0514",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 5,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_3_note",
        "mediaType": "ブログ",
        "accountName": "note",
        "url": "https://note.com/note_by_yuu",
        "metricType": "なし",
        "showOnDetail": true,
        "sortOrder": 6,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      }
    ],
    "notes": [
      {
        "id": "note_3_1",
        "noteType": "その他",
        "content": "身近な食材で作れる簡単レシピが特徴。ブロググランプリ受賞歴あり。",
        "updatedAt": "2026-03-18T20:51:35.540Z"
      }
    ],
    "createdAt": "2026-03-18T20:51:35.540Z",
    "updatedAt": "2026-03-25T09:53:47.022Z",
    "id": "3"
  },
  {
    "displayName": "長田知恵（つき）",
    "realName": "長田知恵",
    "title": "料理研究家",
    "membershipStatus": "要確認",
    "area": "千葉県",
    "birthplace": "兵庫県",
    "ageGroup": "40代",
    "gender": "女性",
    "faceVisibility": "可",
    "hasChildren": "あり",
    "childrenCount": "3",
    "childStage": [],
    "listIntro": "\t\t",
    "avatarUrl": "https://foodistnote.recipe-blog.jp/wp-content/uploads/2025/11/20094307/DSC_4444_Original-20251120094307-20251120094307.jpg",
    "totalFollowers": 357779,
    "tagIds": [
      "tag_a008",
      "tag_a009",
      "tag_a006",
      "tag_a017",
      "tag_a007",
      "tag_a002",
      "tag_a011",
      "tag_a005",
      "tag_a013",
      "tag_q003",
      "tag_d003",
      "tag_d002",
      "tag_d007",
      "tag_d015",
      "tag_d001",
      "tag_d004",
      "tag_d005"
    ],
    "mediaAccounts": [
      {
        "id": "media_foodist-1773305659547_blog",
        "mediaType": "ブログ",
        "accountName": "つきの家族食堂",
        "url": "https://ameblo.jp/moon3sun8/",
        "metricType": "PV",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-18T20:51:35.540Z"
      },
      {
        "id": "media_foodist-1773305659547_ig",
        "mediaType": "Instagram",
        "url": "https://www.instagram.com/tsukicook/",
        "metricType": "フォロワー数",
        "metricValue": 340000,
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-18T20:51:35.540Z",
        "accountName": "tsukicook"
      },
      {
        "id": "media_foodist-1773305659547_x",
        "mediaType": "X",
        "url": "https://x.com/tsukicook",
        "metricType": "フォロワー数",
        "metricValue": 17000,
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-18T20:51:35.540Z",
        "accountName": "tsukicook"
      },
      {
        "id": "media_1775022425090_j5ak",
        "mediaType": "YouTube",
        "metricType": "チャンネル登録者数",
        "showOnDetail": true,
        "sortOrder": 4,
        "updatedAt": "2026-04-01T05:47:05.090Z",
        "url": "https://www.youtube.com/@tsukicook",
        "metricValue": 779,
        "accountName": "「料理研究家 長田知恵(つき)」"
      }
    ],
    "notes": [
      {
        "id": "note_foodist-1773305659547_1",
        "noteType": "その他",
        "content": "お酒は飲まないがPR企画には対応可能\t\t\t\t\t\t",
        "updatedAt": "2026-03-18T20:51:35.540Z"
      }
    ],
    "createdAt": "2026-03-18T20:51:35.540Z",
    "updatedAt": "2026-04-01T10:03:39.400Z",
    "profileText": "",
    "maritalStatus": "既婚",
    "id": "foodist-1773305659547"
  },
  {
    "displayName": "もあいかすみ",
    "realName": "",
    "title": "管理栄養士",
    "membershipStatus": "要確認",
    "area": "東京都",
    "birthplace": "大阪府",
    "birthDate": "",
    "gender": "女性",
    "faceVisibility": "可",
    "hasChildren": "あり",
    "childStage": [],
    "listIntro": "大学卒業後、食品メーカーに就職。全国チェーンのレストランや居酒屋、量販店など幅広い業態のメニュー開発を手がける。忙しく働きながら自炊してきた経験と管理栄養士の資格を生かして、料理研究家として独立。 ",
    "profileText": "作り置きおかず\n\n大学卒業後、食品メーカーに就職。全国チェーンのレストランや居酒屋、量販店など幅広い業態のメニュー開発を手がける。忙しく働きながら自炊してきた経験と管理栄養士の資格を生かして、料理研究家として独立。 ",
    "avatarUrl": "https://foodistnote.recipe-blog.jp/wp-content/uploads/2023/07/25112853/%E3%82%82%E3%81%82%E3%81%84%E3%81%8B%E3%81%99%E3%81%BF%E5%AE%A3%E6%9D%90%E5%86%99%E7%9C%9F%EF%BC%93-20230725112853-20230725112853.jpg",
    "totalFollowers": 2707592,
    "tagIds": [
      "tag_q001"
    ],
    "mediaAccounts": [
      {
        "id": "media_1773869927261_u47r",
        "mediaType": "公式ホームページ",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-18T21:38:47.261Z",
        "url": "https://www.moaiskitchen.net/",
        "accountName": "MOAI's KITCHEN"
      },
      {
        "id": "media_1773869959178_jf3a",
        "mediaType": "Instagram",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-18T21:39:19.178Z",
        "url": "https://www.instagram.com/moaiskitchen/",
        "accountName": "moaiskitchen",
        "metricValue": 1097000
      },
      {
        "id": "media_1773869986645_mfbl",
        "mediaType": "X",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-18T21:39:46.645Z",
        "url": "https://x.com/moai_s_kitchen",
        "accountName": "moai_s_kitchen",
        "metricValue": 6592
      },
      {
        "id": "media_1773870045307_2n0m",
        "mediaType": "TikTok",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 4,
        "updatedAt": "2026-03-18T21:40:45.307Z",
        "url": "https://www.tiktok.com/@moaiskitchen1109",
        "accountName": "moaiskitchen1109",
        "metricValue": 1604000
      }
    ],
    "notes": [],
    "createdAt": "2026-03-18T21:39:01.568Z",
    "updatedAt": "2026-03-26T22:33:25.405Z",
    "ageGroup": "30代",
    "childrenCount": "1",
    "maritalStatus": "既婚",
    "id": "foodist-1773869941568"
  },
  {
    "displayName": "だれウマ",
    "realName": "",
    "title": "簡単料理&ダイエット料理研究家",
    "membershipStatus": "要確認",
    "area": "",
    "birthplace": "",
    "birthDate": "",
    "gender": "",
    "faceVisibility": "可",
    "hasChildren": "未確認",
    "childStage": [],
    "listIntro": "YouTubeチャンネル登録者数188万人（2026年3月時点）を誇る簡単料理&ダイエット料理研究家。失敗することなく誰でも上手く、そしておいしく作ることができるようなレシピを発信している。",
    "profileText": "YouTubeチャンネル登録者数188万人（2026年3月時点）を誇る簡単料理&ダイエット料理研究家。失敗することなく誰でも上手く、そしておいしく作ることができるようなレシピを発信している。著書に『極上ずぼら飯』『悶絶ずぼら飯』『宇宙一ずぼら絶品めし』などがあり累計16万部以上。TVにも多数出演。",
    "avatarUrl": "https://foodistnote.recipe-blog.jp/wp-content/uploads/2021/09/07151847/%E3%81%A0%E3%82%8C%E3%82%A6%E3%83%9E%E3%81%95%E3%82%93%E3%83%97%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%E5%86%99%E7%9C%9F.png",
    "totalFollowers": 848000,
    "tagIds": [],
    "mediaAccounts": [
      {
        "id": "media_1773902960989_gaf8",
        "mediaType": "ブログ",
        "metricType": "なし",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-19T06:49:20.989Z",
        "url": "https://www.yassu-cooking.com/",
        "accountName": "「だれウマ～誰でも上手く、そして美味く～」"
      },
      {
        "id": "media_1773903074979_hf1p",
        "mediaType": "Instagram",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-19T06:51:14.979Z",
        "url": "https://www.instagram.com/dareuma_recipe/",
        "accountName": "dareuma_recipe",
        "metricValue": 419000
      },
      {
        "id": "media_1773903081788_45ae",
        "mediaType": "X",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-19T06:51:21.788Z",
        "url": "https://x.com/muscle1046",
        "accountName": "muscle1046",
        "metricValue": 429000
      },
      {
        "id": "media_1773903083204_6l2c",
        "mediaType": "YouTube",
        "metricType": "なし",
        "showOnDetail": true,
        "sortOrder": 4,
        "updatedAt": "2026-03-19T06:51:23.204Z",
        "url": "https://www.youtube.com/channel/UCmMFrO9hjeAg9RLuTSF4A2A/",
        "accountName": "「だれウマ【料理研究家」"
      }
    ],
    "notes": [],
    "createdAt": "2026-03-19T06:49:54.419Z",
    "updatedAt": "2026-03-25T09:11:28.123Z",
    "id": "foodist-1773902994419-96qp"
  },
  {
    "displayName": "井上かなえ（かな姐）",
    "realName": "",
    "title": "",
    "membershipStatus": "要確認",
    "area": "",
    "birthplace": "",
    "birthDate": "",
    "gender": "",
    "faceVisibility": "可",
    "hasChildren": "あり",
    "childrenCount": "3",
    "childStage": [
      "成人した子あり"
    ],
    "listIntro": "",
    "profileText": "",
    "avatarUrl": "https://foodistnote.recipe-blog.jp/wp-content/uploads/2023/11/08163718/%E4%BA%95%E4%B8%8A%E3%81%8B%E3%81%AA%E3%81%88-20230124140554-20230124140554-e1677026757295-20231108163718-20231108163718.jpg",
    "totalFollowers": 39103,
    "tagIds": [
      "tag_q003",
      "tag_q008",
      "tag_d005",
      "tag_d007",
      "tag_d019",
      "tag_d029",
      "tag_d027",
      "tag_d015"
    ],
    "mediaAccounts": [
      {
        "id": "media_1774511149127_ikai",
        "mediaType": "Instagram",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-26T07:45:49.127Z",
        "url": "https://www.instagram.com/kanae.inoue/",
        "accountName": "kanae.inoue",
        "metricValue": 35000
      },
      {
        "id": "media_1774511170833_i1ky",
        "mediaType": "ブログ",
        "metricType": "なし",
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-26T07:46:10.833Z",
        "url": "http://inoue-kanae.blog.jp/",
        "accountName": "井上かなえオフィシャルブログ 「母ちゃんちの晩御飯とどたばた日記」"
      },
      {
        "id": "media_1774511227817_2q6q",
        "mediaType": "X",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-26T07:47:07.817Z",
        "url": "https://x.com/inokana0123",
        "accountName": "inokana0123",
        "metricValue": 4103
      }
    ],
    "notes": [],
    "createdAt": "2026-03-26T07:48:49.038Z",
    "updatedAt": "2026-03-26T07:53:26.001Z",
    "id": "foodist-1774511329038-aq1s"
  },
  {
    "displayName": "たっきーママ（奥田和美）",
    "realName": "奥田和美",
    "title": "料理研究家",
    "membershipStatus": "要確認",
    "maritalStatus": "既婚",
    "area": "",
    "birthplace": "",
    "birthDate": "",
    "ageGroup": "50代以上",
    "gender": "女性",
    "faceVisibility": "可",
    "hasChildren": "あり",
    "childrenCount": "2",
    "childStage": [],
    "listIntro": "",
    "profileText": "",
    "avatarUrl": "",
    "totalFollowers": 0,
    "tagIds": [
      "tag_q003",
      "tag_q005",
      "tag_d001",
      "tag_d003",
      "tag_d005",
      "tag_d007",
      "tag_d021",
      "tag_d029",
      "tag_d020",
      "tag_d030",
      "tag_w004",
      "tag_w002",
      "tag_w001",
      "tag_a005",
      "tag_a006",
      "tag_a008",
      "tag_a007",
      "tag_a013",
      "tag_a002"
    ],
    "mediaAccounts": [
      {
        "id": "media_1774513473214_hto2",
        "mediaType": "Instagram",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-26T08:24:33.214Z",
        "url": "https://www.instagram.com/kazumiokuda/"
      },
      {
        "id": "media_1774513819218_qmkr",
        "mediaType": "公式ホームページ",
        "metricType": "なし",
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-26T08:30:19.218Z",
        "url": "https://asasugubento-lab.com/"
      },
      {
        "id": "media_1774513830906_c6r9",
        "mediaType": "ブログ",
        "metricType": "なし",
        "showOnDetail": true,
        "sortOrder": 3,
        "updatedAt": "2026-03-26T08:30:30.906Z",
        "url": "https://okudakazumi.livedoor.blog/"
      },
      {
        "id": "media_1774513849157_pk3g",
        "mediaType": "X",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 4,
        "updatedAt": "2026-03-26T08:30:49.157Z",
        "url": "https://x.com/kazumi_okuda"
      }
    ],
    "notes": [
      {
        "id": "note_1774513568593_d05a",
        "noteType": "その他",
        "content": "フードアナリスト",
        "updatedAt": "2026-03-26T08:26:08.593Z"
      }
    ],
    "createdAt": "2026-03-26T08:24:39.910Z",
    "updatedAt": "2026-03-26T08:33:12.352Z",
    "id": "foodist-1774513479910-1e4p"
  },
  {
    "displayName": "しにゃ",
    "realName": "",
    "title": "",
    "membershipStatus": "要確認",
    "area": "",
    "birthplace": "",
    "birthDate": "",
    "gender": "",
    "faceVisibility": "未設定",
    "hasChildren": "あり",
    "childStage": [],
    "listIntro": "",
    "profileText": "",
    "avatarUrl": "",
    "totalFollowers": 790000,
    "tagIds": [],
    "mediaAccounts": [
      {
        "id": "media_1774534389751_4qml",
        "mediaType": "Instagram",
        "metricType": "フォロワー数",
        "showOnDetail": true,
        "sortOrder": 1,
        "updatedAt": "2026-03-26T14:13:09.751Z",
        "url": "https://www.instagram.com/shinya6727/",
        "accountName": "shinya6727",
        "metricValue": 790000
      },
      {
        "id": "media_1774534399466_cjjk",
        "mediaType": "ブログ",
        "metricType": "なし",
        "showOnDetail": true,
        "sortOrder": 2,
        "updatedAt": "2026-03-26T14:13:19.466Z",
        "url": "https://www.shinya-gohan.com/"
      }
    ],
    "notes": [],
    "createdAt": "2026-03-26T14:13:53.877Z",
    "updatedAt": "2026-03-26T14:15:48.900Z",
    "id": "foodist-1774534433877-xhpa"
  }
];
