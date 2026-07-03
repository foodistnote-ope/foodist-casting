import React from 'react';
import './GuideView.css';

export const GuideView = () => {
    return (
        <div className="guide-container">
            <h1 className="guide-title">使い方・注意事項ガイド</h1>
            
            <section className="guide-section">
                <h2>はじめに（ツールの前提条件）</h2>
                <div className="guide-card">
                    <ul className="guide-list">
                        <li style={{ marginBottom: '8px' }}><strong>会員登録状況について</strong><br/>本ツールはフーディスト会員システム（FS Console）と自動連動していません。正確な会員登録状況は、フーディスト会員システム（FS Console）でご確認ください。</li>
                        <li style={{ marginBottom: '8px' }}><strong>SNSのフォロワー数について</strong><br/>SNSのフォロワー数は「更新時点」の情報です。リアルタイムな数値ではないため、個別の詳細画面の「アカウント情報」にある「最終更新日時」をご参照いただくか、提案時などは実際のSNSアカウントをご確認ください。</li>
                        <li style={{ marginBottom: '8px' }}><strong>基本情報について</strong><br/>生年月日の登録がない場合の「年齢」、「子どもの有無・数・成長時期」などの基本情報は、過去の情報（アンケート回答時や運営側での登録時など）を元にしているため、最新の状態ではない場合があります。</li>
                        <li><strong>「最新アンケート回答日」について</strong><br/>対象となるアンケートは「料理の活動に関するアンケート」です。</li>
                    </ul>
                </div>
            </section>

            <section className="guide-section">
                <h2>よくある質問・機能の解説</h2>
                <div className="guide-card">
                    <h3>Q. 画面右上にある各種CSV機能の違いは何ですか？</h3>
                    <p>フーディストデータの一括操作に関する以下の3つのボタンがあります。</p>
                    <ul style={{ paddingLeft: '1.2rem', marginTop: '8px', marginBottom: '16px' }}>
                        <li style={{ marginBottom: '8px' }}><strong>更新テンプレ</strong><br/>新規追加や部分更新に使用する「空のテンプレート（フォーマット）」をダウンロードします。</li>
                        <li style={{ marginBottom: '8px' }}><strong>新規追加CSV</strong><br/>ダウンロードした「更新テンプレ」に新しいフーディストの情報を入力し、ここからアップロードすることで、一括で新しく登録します。</li>
                        <li><strong>部分更新CSV</strong><br/>ダウンロードした「更新テンプレ」を用いて、既存データを一括で上書き更新します。<br/><span style={{ fontSize: '0.85rem', color: '#64748b' }}>※フーディストを特定するため、「活動名」「ニックネーム」「メールアドレス」のいずれかを必ずA列（一番左）に入力し、それ以外は変更したい項目（列）のみを残してアップロードしてください。</span></li>
                    </ul>

                    <h3>Q. ダウンロード（CSVエクスポート）されるデータについて</h3>
                    <p>データベース画面右上の「CSV出力」からは、現在画面に表示されているフーディストの情報がダウンロードされます。<br/>
                    項目数が非常に多いため、初期状態では「よく使われる代表的な項目」のみが出力されるようになっています。<br/>
                    その他の詳細な項目も出力したい場合は、隣の<strong>「出力項目を選択」</strong>メニューから、必要な列にチェックを入れて追加してください。</p>
                </div>
            </section>
        </div>
    );
};
