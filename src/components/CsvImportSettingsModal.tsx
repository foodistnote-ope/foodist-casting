import { useState } from 'react';
import './DatabaseView.css';

interface CsvImportSettingsModalProps {
    onClose: () => void;
    onConfirm: (file: File, matchKey: '活動名' | 'ニックネーム' | 'メールアドレス') => void;
    title: string;
}

export const CsvImportSettingsModal = ({ onClose, onConfirm, title }: CsvImportSettingsModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [matchKey, setMatchKey] = useState<'活動名' | 'ニックネーム' | 'メールアドレス'>('活動名');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleConfirm = () => {
        if (!file) {
            alert('CSVファイルを選択してください。');
            return;
        }
        onConfirm(file, matchKey);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <button className="modal-close" onClick={onClose} aria-label="閉じる">×</button>
                <div className="modal-header">
                    <h2 className="modal-name">{title}</h2>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>
                    <div className="modal-section" style={{ border: 'none', padding: 0 }}>
                        <p style={{ marginBottom: 16 }}>インポートするCSVファイルと、既存データと突き合わせる際の「照合キー」を選択してください。</p>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>1. CSVファイル</label>
                            <input type="file" accept=".csv" onChange={handleFileChange} className="form-input" style={{ padding: '8px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>2. 照合キー（マッチングキー）</label>
                            <select 
                                value={matchKey} 
                                onChange={e => setMatchKey(e.target.value as any)}
                                className="form-input"
                            >
                                <option value="活動名">活動名</option>
                                <option value="ニックネーム">ニックネーム</option>
                                <option value="メールアドレス">メールアドレス</option>
                            </select>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 8 }}>
                                ※選択した項目を基準にして既存データを探し、内容を上書き・追加します。<br />
                                ※重複するデータが見つかった場合は、誤更新を防ぐため対象行のインポートをスキップします。
                            </p>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-primary" onClick={handleConfirm} disabled={!file}>
                        実行する
                    </button>
                    <button className="btn-secondary" onClick={onClose}>キャンセル</button>
                </div>
            </div>
        </div>
    );
};
