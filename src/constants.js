  //プラットフォームごとの手数料率
  export const feeRate ={
    mercari: 0.10,
    yahoo: 0.05,
    rakuma: 0.10,
  }

  //プラットフォームごとの送料リスト
  export const shippingOptions ={
    mercari: [
      {
      service: 'rakuraku',
      label: 'らくらくメルカリ便',
      options: [
        { value: 'nekoposu',          label: 'ネコポス',          fee: 210 },
        { value: 'takkyubinCompact',  label: '宅急便コンパクト',   fee: 450 },
        { value: 'takkyubin60',       label: '宅急便60サイズ',     fee: 750 },
        { value: 'takkyubin80',       label: '宅急便80サイズ',     fee: 850 },
        { value: 'takkyubin100',      label: '宅急便100サイズ',    fee: 1050 },
        { value: 'takkyubin120',      label: '宅急便120サイズ',    fee: 1200 },
        { value: 'takkyubin140',      label: '宅急便140サイズ',    fee: 1450 },
        { value: 'takkyubin160',      label: '宅急便160サイズ',    fee: 1700 },
        { value: 'takkyubin180',      label: '宅急便180サイズ',    fee: 2100 },
        { value: 'takkyubin200',      label: '宅急便200サイズ',    fee: 2500 },
      ],
    },
    {
      service: 'yuyuu',
      label: 'ゆうゆうメルカリ便',
      options: [
        { value: 'yupacket',          label: 'ゆうパケット',           fee: 230 },
        { value: 'yupacketPost',      label: 'ゆうパケットポスト',      fee: 215 },
        { value: 'yupacketPostMini',  label: 'ゆうパケットポストmini',       fee: 160 },
        { value: 'yupacketPostPlus',  label: 'ゆうパケットプラス',      fee: 455 },
        { value: 'yupack60',          label: 'ゆうパック60サイズ',      fee: 750 },
        { value: 'yupack80',          label: 'ゆうパック80サイズ',      fee: 870 },
        { value: 'yupack100',         label: 'ゆうパック100サイズ',     fee: 1070 },
        { value: 'yupack120',         label: 'ゆうパック120サイズ',     fee: 1200 },
        { value: 'yupack140',         label: 'ゆうパック140サイズ',     fee: 1450 },
        { value: 'yupack160',         label: 'ゆうパック160サイズ',     fee: 1700 },
        { value: 'yupack170',         label: 'ゆうパック170サイズ',     fee: 1900 },
      ],
    },
    ],
    yahoo:[
      {
        service: 'yamato',
      label: 'ヤマト運輸',
      options:[{ value: 'nekoposu', label: 'ネコポス', fee: 210},
        { value: 'takkyubinCompact', label: '宅急便コンパクト', fee: 490 },
        { value: 'takkyubin60',  label: '宅急便60サイズ',     fee: 750 },
        { value: 'takkyubin80',  label: '宅急便80サイズ',     fee: 850 },
        { value: 'takkyubin100', label: '宅急便100サイズ',    fee: 1050 },
        { value: 'takkyubin120', label: '宅急便120サイズ',    fee: 1200 },
        { value: 'takkyubin140', label: '宅急便140サイズ',    fee: 1400 },
        { value: 'takkyubin160', label: '宅急便160サイズ',    fee: 1700 },
        { value: 'takkyubin180', label: '宅急便180サイズ',    fee: 2100 },
        { value: 'takkyubin200', label: '宅急便200サイズ',    fee: 2500 },
    ],
      },
      {
        service: 'jpPost',
        label: '日本郵便',
        options:[
        { value: 'yupacket',     label: 'ゆうパケット',       fee: 215 },
        { value: 'yupacketPost', label: 'ゆうパケットポスト',  fee: 275 },
        { value: 'yupacketPostMini', label: 'ゆうパケットポストmini', fee: 160 },
        { value: 'yupacketPostPlus', label: 'ゆうパケットプラス', fee: 475 },
        { value: 'yupack60',     label: 'ゆうパック60サイズ', fee: 750 },
        { value: 'yupack80',     label: 'ゆうパック80サイズ', fee: 850 },
        { value: 'yupack100',     label: 'ゆうパック100サイズ', fee: 1050 },
        { value: 'yupack120',     label: 'ゆうパック120サイズ', fee: 1200 },
        { value: 'yupack140',     label: 'ゆうパック140サイズ', fee: 1400 },
        { value: 'yupack160',     label: 'ゆうパック160サイズ', fee: 1700 },
        { value: 'yupack170',     label: 'ゆうパック170サイズ', fee: 1900 },
        ],
      },
      
      
    ],
    rakuma:[
      {
        service: 'kantanrakumapackYamato',
        label: 'かんたんラクマパック(ヤマト運輸)',
        options:[
          { value: 'nekoposu', label: 'ネコポス', fee: 200},
          { value: 'takkyubinCompact', label: '宅急便コンパクト', fee: 430 },
          { value: 'takkyubin60',  label: '宅急便60サイズ',     fee: 650 },
          { value: 'takkyubin80',  label: '宅急便80サイズ',     fee: 750 },
          { value: 'takkyubin100', label: '宅急便100サイズ',    fee: 1050 },
          { value: 'takkyubin120', label: '宅急便120サイズ',    fee: 1200 },
          { value: 'takkyubin140', label: '宅急便140サイズ',    fee: 1400 },
          { value: 'takkyubin160', label: '宅急便160サイズ',    fee: 1500 },
          { value: 'takkyubin180', label: '宅急便180サイズ',    fee: 2800 },
          { value: 'takkyubin200', label: '宅急便200サイズ',    fee: 3350 },
        ],
      },
      {
        service: 'kantanrakumapackJP',
        label: 'かんたんラクマパック(日本郵便)',
        options:[
          { value: 'yupacket',     label: 'ゆうパケット',       fee: 200 },
          { value: 'yupacketPost', label: 'ゆうパケットポスト',  fee: 175 },
          { value: 'yupacketPostMini', label: 'ゆうパケットポストmini', fee: 170 },
          { value: 'yupacketPostPlus', label: 'ゆうパケットプラス', fee: 450 },
          { value: 'yupack60',     label: 'ゆうパック60サイズ', fee: 700 },
          { value: 'yupack80',     label: 'ゆうパック80サイズ', fee: 800 },
          { value: 'yupack100',     label: 'ゆうパック100サイズ', fee: 1150 },
          { value: 'yupack120',     label: 'ゆうパック120サイズ', fee: 1350 },
          { value: 'yupack140',     label: 'ゆうパック140サイズ', fee: 1500 },
          { value: 'yupack160',     label: 'ゆうパック160サイズ', fee: 1500 },
          { value: 'yupack170',     label: 'ゆうパック170サイズ', fee: 1500 },
        ],
      },
      
    ]
  }