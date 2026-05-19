// プラットフォームごとの手数料率
export const feeRate = {
  mercari:  0.10,
  yahoo:    0.05,
  rakuma:   0.10,
  yahuoku:  0.10,
}

// anonymous: false のサービスは「匿名配送以外」
// → 選択時に UI 側で「送料＋梱包材費」の合算入力に切り替わる
// maxThickness: シミュレーションで厚みによる絞り込みに使用（cm）
//   null → 制限なし

export const shippingOptions = {

  // ─── メルカリ ───────────────────────────────────
  mercari: [
    {
      service: 'rakuraku',
      label: 'らくらくメルカリ便',
      anonymous: true,
      options: [
        { value: 'nekoposu',         label: 'ネコポス',         fee: 210,  maxThickness: 3    },
        { value: 'takkyubinCompact', label: '宅急便コンパクト',  fee: 450,  maxThickness: 5    },
        { value: 'takkyubin60',      label: '宅急便60',         fee: 750,  maxThickness: null },
        { value: 'takkyubin80',      label: '宅急便80',         fee: 850,  maxThickness: null },
        { value: 'takkyubin100',     label: '宅急便100',        fee: 1050, maxThickness: null },
        { value: 'takkyubin120',     label: '宅急便120',        fee: 1200, maxThickness: null },
        { value: 'takkyubin140',     label: '宅急便140',        fee: 1450, maxThickness: null },
        { value: 'takkyubin160',     label: '宅急便160',        fee: 1700, maxThickness: null },
        { value: 'takkyubin180',     label: '宅急便180',        fee: 2100, maxThickness: null },
        { value: 'takkyubin200',     label: '宅急便200',        fee: 2500, maxThickness: null },
      ],
    },
    {
      service: 'yuyuu',
      label: 'ゆうゆうメルカリ便',
      anonymous: true,
      options: [
        { value: 'yupacket',         label: 'ゆうパケット',          fee: 230,  maxThickness: 3    },
        { value: 'yupacketPost',     label: 'ゆうパケットポスト',     fee: 215,  maxThickness: 3    },
        { value: 'yupacketPostMini', label: 'ゆうパケットポストmini', fee: 160,  maxThickness: 2.5  },
        { value: 'yupacketPostPlus', label: 'ゆうパケットプラス',     fee: 455,  maxThickness: 7    },
        { value: 'yupack60',         label: 'ゆうパック60',          fee: 750,  maxThickness: null },
        { value: 'yupack80',         label: 'ゆうパック80',          fee: 870,  maxThickness: null },
        { value: 'yupack100',        label: 'ゆうパック100',         fee: 1070, maxThickness: null },
        { value: 'yupack120',        label: 'ゆうパック120',         fee: 1200, maxThickness: null },
        { value: 'yupack140',        label: 'ゆうパック140',         fee: 1450, maxThickness: null },
        { value: 'yupack160',        label: 'ゆうパック160',         fee: 1700, maxThickness: null },
        { value: 'yupack170',        label: 'ゆうパック170',         fee: 1900, maxThickness: null },
      ],
    },
    {
      // 匿名配送以外：送料＋梱包材費を合算入力
      service: 'other',
      label: '匿名配送以外',
      anonymous: false,
      options: [
        // fee: 0 → UI側で「送料＋梱包材費」をまとめて手入力するためダミー0
        { value: 'other', label: '送料・梱包材を直接入力', fee: 0, maxThickness: null },
      ],
    },
  ],

  // ─── Yahoo!フリマ（匿名配送以外なし） ───────────
  yahoo: [
    {
      service: 'yamato',
      label: 'ヤマト運輸',
      anonymous: true,
      options: [
        { value: 'nekoposu',         label: 'ネコポス',         fee: 210,  maxThickness: 3    },
        { value: 'takkyubinCompact', label: '宅急便コンパクト',  fee: 490,  maxThickness: 5    },
        { value: 'takkyubin60',      label: '宅急便60',         fee: 750,  maxThickness: null },
        { value: 'takkyubin80',      label: '宅急便80',         fee: 850,  maxThickness: null },
        { value: 'takkyubin100',     label: '宅急便100',        fee: 1050, maxThickness: null },
        { value: 'takkyubin120',     label: '宅急便120',        fee: 1200, maxThickness: null },
        { value: 'takkyubin140',     label: '宅急便140',        fee: 1400, maxThickness: null },
        { value: 'takkyubin160',     label: '宅急便160',        fee: 1700, maxThickness: null },
        { value: 'takkyubin180',     label: '宅急便180',        fee: 2100, maxThickness: null },
        { value: 'takkyubin200',     label: '宅急便200',        fee: 2500, maxThickness: null },
      ],
    },
    {
      service: 'jpPost',
      label: '日本郵便',
      anonymous: true,
      options: [
        { value: 'yupacket',         label: 'ゆうパケット',          fee: 215,  maxThickness: 3    },
        { value: 'yupacketPost',     label: 'ゆうパケットポスト',     fee: 275,  maxThickness: 3    },
        { value: 'yupacketPostMini', label: 'ゆうパケットポストmini', fee: 160,  maxThickness: 2.5  },
        { value: 'yupacketPostPlus', label: 'ゆうパケットプラス',     fee: 475,  maxThickness: 7    },
        { value: 'yupack60',         label: 'ゆうパック60',          fee: 750,  maxThickness: null },
        { value: 'yupack80',         label: 'ゆうパック80',          fee: 850,  maxThickness: null },
        { value: 'yupack100',        label: 'ゆうパック100',         fee: 1050, maxThickness: null },
        { value: 'yupack120',        label: 'ゆうパック120',         fee: 1200, maxThickness: null },
        { value: 'yupack140',        label: 'ゆうパック140',         fee: 1400, maxThickness: null },
        { value: 'yupack160',        label: 'ゆうパック160',         fee: 1700, maxThickness: null },
        { value: 'yupack170',        label: 'ゆうパック170',         fee: 1900, maxThickness: null },
      ],
    },
  ],

  // ─── ラクマ ─────────────────────────────────────
  rakuma: [
    {
      service: 'kantanrakumapackYamato',
      label: 'かんたんラクマパック(ヤマト)',
      anonymous: true,
      options: [
        { value: 'nekoposu',         label: 'ネコポス',         fee: 200,  maxThickness: 3    },
        { value: 'takkyubinCompact', label: '宅急便コンパクト',  fee: 430,  maxThickness: 5    },
        { value: 'takkyubin60',      label: '宅急便60',         fee: 650,  maxThickness: null },
        { value: 'takkyubin80',      label: '宅急便80',         fee: 750,  maxThickness: null },
        { value: 'takkyubin100',     label: '宅急便100',        fee: 1050, maxThickness: null },
        { value: 'takkyubin120',     label: '宅急便120',        fee: 1200, maxThickness: null },
        { value: 'takkyubin140',     label: '宅急便140',        fee: 1400, maxThickness: null },
        { value: 'takkyubin160',     label: '宅急便160',        fee: 1500, maxThickness: null },
        { value: 'takkyubin180',     label: '宅急便180',        fee: 2800, maxThickness: null },
        { value: 'takkyubin200',     label: '宅急便200',        fee: 3350, maxThickness: null },
      ],
    },
    {
      service: 'kantanrakumapackJP',
      label: 'かんたんラクマパック(日本郵便)',
      anonymous: true,
      options: [
        { value: 'yupacket',         label: 'ゆうパケット',          fee: 200,  maxThickness: 3    },
        { value: 'yupacketPost',     label: 'ゆうパケットポスト',     fee: 175,  maxThickness: 3    },
        { value: 'yupacketPostMini', label: 'ゆうパケットポストmini', fee: 170,  maxThickness: 2.5  },
        { value: 'yupacketPostPlus', label: 'ゆうパケットプラス',     fee: 450,  maxThickness: 7    },
        { value: 'yupack60',         label: 'ゆうパック60',          fee: 700,  maxThickness: null },
        { value: 'yupack80',         label: 'ゆうパック80',          fee: 800,  maxThickness: null },
        { value: 'yupack100',        label: 'ゆうパック100',         fee: 1150, maxThickness: null },
        { value: 'yupack120',        label: 'ゆうパック120',         fee: 1350, maxThickness: null },
        { value: 'yupack140',        label: 'ゆうパック140',         fee: 1500, maxThickness: null },
        { value: 'yupack160',        label: 'ゆうパック160',         fee: 1500, maxThickness: null },
        { value: 'yupack170',        label: 'ゆうパック170',         fee: 1500, maxThickness: null },
      ],
    },
    {
      service: 'other',
      label: '匿名配送以外',
      anonymous: false,
      options: [
        { value: 'other', label: '送料・梱包材を直接入力', fee: 0, maxThickness: null },
      ],
    },
  ],

  // ─── ヤフオク ───────────────────────────────────
  yahuoku: [
    {
      service: 'yahuokuYamato',
      label: 'おてがる配送（ヤマト運輸）',
      anonymous: true,
      options: [
        { value: 'nekoposu',         label: 'ネコポス',         fee: 210,  maxThickness: 3    },
        { value: 'takkyubinCompact', label: '宅急便コンパクト',  fee: 490,  maxThickness: 5    },
        { value: 'takkyubin60',      label: '宅急便60',         fee: 750,  maxThickness: null },
        { value: 'takkyubin80',      label: '宅急便80',         fee: 850,  maxThickness: null },
        { value: 'takkyubin100',     label: '宅急便100',        fee: 1050, maxThickness: null },
        { value: 'takkyubin120',     label: '宅急便120',        fee: 1200, maxThickness: null },
        { value: 'takkyubin140',     label: '宅急便140',        fee: 1400, maxThickness: null },
        { value: 'takkyubin160',     label: '宅急便160',        fee: 1700, maxThickness: null },
        { value: 'takkyubin180',     label: '宅急便180',        fee: 2100, maxThickness: null },
        { value: 'takkyubin200',     label: '宅急便200',        fee: 2500, maxThickness: null },
      ],
    },
    {
      service: 'yahuokuJpPost',
      label: 'おてがる配送（日本郵便）',
      anonymous: true,
      options: [
        { value: 'yupacket',         label: 'ゆうパケット',          fee: 215,  maxThickness: 3    },
        { value: 'yupacketPost',     label: 'ゆうパケットポスト',     fee: 275,  maxThickness: 3    },
        { value: 'yupacketPostMini', label: 'ゆうパケットポストmini', fee: 160,  maxThickness: 2.5  },
        { value: 'yupacketPostPlus', label: 'ゆうパケットプラス',     fee: 475,  maxThickness: 7    },
        { value: 'yupack60',         label: 'ゆうパック60',          fee: 750,  maxThickness: null },
        { value: 'yupack80',         label: 'ゆうパック80',          fee: 850,  maxThickness: null },
        { value: 'yupack100',        label: 'ゆうパック100',         fee: 1050, maxThickness: null },
        { value: 'yupack120',        label: 'ゆうパック120',         fee: 1200, maxThickness: null },
        { value: 'yupack140',        label: 'ゆうパック140',         fee: 1400, maxThickness: null },
        { value: 'yupack160',        label: 'ゆうパック160',         fee: 1700, maxThickness: null },
        { value: 'yupack170',        label: 'ゆうパック170',         fee: 1900, maxThickness: null },
      ],
    },
    {
      service: 'other',
      label: '匿名配送以外',
      anonymous: false,
      options: [
        { value: 'other', label: '送料・梱包材を直接入力', fee: 0, maxThickness: null },
      ],
    },
  ],
}