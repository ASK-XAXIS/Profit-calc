// LegalPages.jsx — プライバシーポリシー / 利用規約 / 特定商取引法に基づく表記

const UPDATED = '2025年6月1日'
const APP_NAME = 'Revofit（レヴォフィット）'
const OPERATOR = 'RYO MORITOU'
const ADDRESS  = '沖縄県豊見城市字豊見城1004-1 ウィングシャトー豊見城プロムナード708'
const EMAIL    = 'ryo06040123@gmail.com'

// ─────────────────────────────────────────
// 共通レイアウト
// ─────────────────────────────────────────
function LegalLayout({ title, children, onBack }) {
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-blue-500 font-semibold self-start"
      >
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 4L6 10l6 6" />
        </svg>
        ホームに戻る
      </button>

      {/* タイトル */}
      <div className="bg-white rounded-2xl shadow-sm px-5 py-5 border-l-4 border-blue-500">
        <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest mb-1">{APP_NAME}</p>
        <h1 className="text-lg font-black text-gray-800">{title}</h1>
        <p className="text-[10px] text-gray-400 mt-1">最終更新日：{UPDATED}</p>
      </div>

      {/* 本文 */}
      <div className="flex flex-col gap-3">
        {children}
      </div>

      {/* フッター */}
      <div className="bg-gray-50 rounded-2xl px-5 py-4 text-center">
        <p className="text-[10px] text-gray-400">運営者：{OPERATOR}</p>
        <p className="text-[10px] text-gray-400">お問い合わせ：{EMAIL}</p>
        <p className="text-[11px] text-gray-300 mt-2">© 2025 {OPERATOR}. All rights reserved.</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
      {title && (
        <h2 className="text-sm font-bold text-gray-700 mb-2 pb-2 border-b border-gray-100">{title}</h2>
      )}
      <div className="text-[12px] text-gray-600 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// 1. プライバシーポリシー
// ─────────────────────────────────────────
export function PrivacyPolicy({ onBack }) {
  return (
    <LegalLayout title="プライバシーポリシー" onBack={onBack}>

      <Section title="1. はじめに">
        <p>
          {OPERATOR}（以下「運営者」）は、{APP_NAME}（以下「本アプリ」）における
          ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>
      </Section>

      <Section title="2. 収集する情報">
        <p>本アプリは以下の情報を収集します。</p>
        <p className="mt-1 font-semibold text-gray-700">■ ユーザーが入力した情報（端末内のみ保存）</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>商品名・仕入れ価格・販売価格などの商品情報</li>
          <li>売上・利益に関する損益データ</li>
          <li>商品画像（端末のカメラロールから選択した場合）</li>
        </ul>
        <p className="mt-2 text-[11px] text-gray-400">
          ※ 上記データはすべてお使いの端末のローカルストレージに保存され、外部サーバーへの送信は行いません。
        </p>

        <p className="mt-2 font-semibold text-gray-700">■ 自動的に収集される情報（分析ツール経由）</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>アクセス日時・利用機能・画面遷移などの利用状況</li>
          <li>端末の種類・OSバージョン・ブラウザ種別</li>
        </ul>
        <p className="mt-2 text-[11px] text-gray-400">
          ※ Google Analytics を使用する場合があります。収集される情報は匿名化されており、個人を特定するものではありません。
        </p>
      </Section>

      <Section title="3. 情報の利用目的">
        <ul className="list-disc pl-4 space-y-1">
          <li>本アプリの機能提供および改善</li>
          <li>利用状況の分析とユーザー体験の向上</li>
          <li>不具合の調査・修正</li>
          <li>お問い合わせへの対応</li>
        </ul>
      </Section>

      <Section title="4. 第三者提供">
        <p>
          運営者は、法令に基づく場合を除き、ユーザーの個人情報を第三者に提供・開示・売却することはありません。
        </p>
      </Section>

      <Section title="5. 広告について">
        <p>
          本アプリでは、Google AdSense / AdMob 等の広告サービスを利用する場合があります。
          これらのサービスはCookieを使用して、ユーザーの興味に基づく広告を表示することがあります。
          詳しくはGoogleのプライバシーポリシーをご確認ください。
        </p>
        <p className="mt-2 text-[11px] text-blue-500 underline">
          https://policies.google.com/privacy
        </p>
      </Section>

      <Section title="6. 画像データの取り扱い">
        <p>
          ユーザーが商品登録時にアップロードした画像は、端末内にのみ保存されます。
          外部サーバーへの送信・保存は行いません。
          アプリのアンインストールまたはデータ消去により、すべての画像データは削除されます。
        </p>
      </Section>

      <Section title="7. 未成年者の利用">
        <p>
          本アプリは18歳未満の方のご利用を想定していません。
          18歳未満の方が本アプリを利用される場合は、保護者の同意を得てご利用ください。
        </p>
      </Section>

      <Section title="8. プライバシーポリシーの変更">
        <p>
          運営者は、必要に応じて本プライバシーポリシーを改定することがあります。
          改定後のポリシーはアプリ内に掲載した時点から効力を生じるものとします。
        </p>
      </Section>

      <Section title="9. お問い合わせ">
        <p>本ポリシーに関するお問い合わせは以下までご連絡ください。</p>
        <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3 space-y-1">
          <p><span className="text-gray-400">運営者：</span>{OPERATOR}</p>
          <p><span className="text-gray-400">メール：</span>{EMAIL}</p>
        </div>
      </Section>

    </LegalLayout>
  )
}

// ─────────────────────────────────────────
// 2. 利用規約
// ─────────────────────────────────────────
export function TermsOfService({ onBack }) {
  return (
    <LegalLayout title="利用規約" onBack={onBack}>

      <Section title="第1条（適用）">
        <p>
          本規約は、{OPERATOR}（以下「運営者」）が提供する{APP_NAME}（以下「本アプリ」）の
          利用条件を定めるものです。ユーザーは本規約に同意の上、本アプリをご利用ください。
        </p>
      </Section>

      <Section title="第2条（利用登録）">
        <p>
          本アプリは、本規約に同意した上でご利用いただくことで、利用登録が完了するものとします。
          現時点ではアカウント登録は不要です。
        </p>
      </Section>

      <Section title="第3条（禁止事項）">
        <p>ユーザーは以下の行為を行ってはなりません。</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>法令または公序良俗に反する行為</li>
          <li>本アプリの運営を妨害する行為</li>
          <li>本アプリをリバースエンジニアリング・改ざんする行為</li>
          <li>本アプリを商業目的で無断転用・再配布する行為</li>
          <li>不正な手段によるアクセスや攻撃行為</li>
          <li>他のユーザーまたは第三者に損害を与える行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>
      </Section>

      <Section title="第4条（本アプリの提供の停止等）">
        <p>
          運営者は、以下の場合に事前通知なく本アプリの提供を停止・中断することができます。
        </p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li>システムの保守・点検を行う場合</li>
          <li>天災・その他不可抗力により提供が困難な場合</li>
          <li>その他、運営者が停止・中断が必要と判断した場合</li>
        </ul>
      </Section>

      <Section title="第5条（免責事項）">
        <p>
          運営者は、本アプリに起因してユーザーに生じたいかなる損害（計算結果の誤り・
          データ消失・機会損失等を含む）についても、一切の責任を負いません。
        </p>
        <p className="mt-2">
          本アプリが提供する計算結果・情報は参考値であり、実際のフリマプラットフォームの
          手数料・送料等と異なる場合があります。最終的な判断はユーザー自身の責任において行ってください。
        </p>
        <p className="mt-2">
          各フリマプラットフォーム（メルカリ・Yahoo!フリマ・ラクマ・ヤフオク）の
          利用規約は各社が定めるものであり、本アプリは各社と無関係です。
        </p>
      </Section>

      <Section title="第6条（サービス内容の変更等）">
        <p>
          運営者は、ユーザーへの事前通知なく本アプリの内容を変更・追加・廃止することができます。
          これによりユーザーに生じた損害について、運営者は一切の責任を負いません。
        </p>
      </Section>

      <Section title="第7条（プレミアムプランについて）">
        <p>
          本アプリは無料プランと有料プレミアムプランを提供しています。
          プレミアムプランの購入・解約・払い戻しについては、各ストア（App Store / Google Play）
          のポリシーに従います。
        </p>
        <p className="mt-2">
          デジタルコンテンツの性質上、購入完了後の返金は原則として対応しておりません。
        </p>
      </Section>

      <Section title="第8条（利用規約の変更）">
        <p>
          運営者は、必要と判断した場合に本規約を変更することができます。
          変更後の規約はアプリ内に掲載した時点から効力を生じます。
          変更後も本アプリを継続してご利用の場合、変更後の規約に同意したものとみなします。
        </p>
      </Section>

      <Section title="第9条（準拠法・管轄裁判所）">
        <p>
          本規約の解釈は日本法に準拠します。
          本アプリに関して紛争が生じた場合、運営者の所在地を管轄する裁判所を
          専属的合意管轄裁判所とします。
        </p>
      </Section>

      <Section title="第10条（お問い合わせ）">
        <p>本規約に関するお問い合わせは以下までご連絡ください。</p>
        <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3 space-y-1">
          <p><span className="text-gray-400">運営者：</span>{OPERATOR}</p>
          <p><span className="text-gray-400">メール：</span>{EMAIL}</p>
        </div>
      </Section>

    </LegalLayout>
  )
}

// ─────────────────────────────────────────
// 3. 特定商取引法に基づく表記
// ─────────────────────────────────────────
export function CommercialDisclosure({ onBack }) {
  const rows = [
    { label: '販売業者',         value: OPERATOR },
    { label: '所在地',           value: ADDRESS },
    { label: 'メールアドレス',   value: EMAIL },
    { label: '電話番号',         value: 'メールにてお問い合わせください（お問い合わせ後、必要に応じてご連絡します）' },
    { label: 'サービス名',       value: APP_NAME },
    { label: '販売価格',         value: 'アプリ内の各プランページに表示する価格（税込）' },
    { label: '支払方法',         value: 'App Store / Google Play の決済システムに準じます（クレジットカード等）' },
    { label: '支払時期',         value: '購入手続き完了時にお支払いとなります' },
    { label: 'サービス提供時期', value: '購入完了後、即時ご利用いただけます' },
    { label: '返品・キャンセル', value: 'デジタルコンテンツの性質上、購入完了後の返金・キャンセルは原則として対応しておりません。ただし法令に基づく場合はこの限りではありません。' },
    { label: '動作環境',         value: 'iOS 15以上 / Android 8以上 / 最新版のモダンブラウザ（Chrome・Safari・Firefox）' },
    { label: '無料体験',         value: '無料プランをご用意しています（一部機能制限あり）' },
  ]

  return (
    <LegalLayout title="特定商取引法に基づく表記" onBack={onBack}>

      <Section>
        <p className="text-[11px] text-gray-500">
          特定商取引法第11条に基づき、以下の事項を表記します。
        </p>
      </Section>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex gap-3 px-5 py-3 ${i !== rows.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <p className="text-[11px] font-semibold text-gray-500 shrink-0 w-28">{row.label}</p>
            <p className="text-[11px] text-gray-700 leading-relaxed">{row.value}</p>
          </div>
        ))}
      </div>

      <Section title="お問い合わせ">
        <p>ご不明な点は下記までお気軽にお問い合わせください。</p>
        <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3 space-y-1">
          <p><span className="text-gray-400">運営者：</span>{OPERATOR}</p>
          <p><span className="text-gray-400">メール：</span>{EMAIL}</p>
          <p className="text-[10px] text-gray-400 mt-1">通常2〜3営業日以内にご返信します</p>
        </div>
      </Section>

    </LegalLayout>
  )
}
