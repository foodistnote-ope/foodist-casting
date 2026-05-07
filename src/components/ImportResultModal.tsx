import { useState } from 'react';
import './ImportResultModal.css';

interface ImportResultModalProps {
    title: string;
    summary: {
        success: number;
        added?: number;
        updated?: number;
    };
    failures?: {
        type: 'notFound' | 'conflict' | 'duplicate' | 'noUpdate';
        label: string;
        items: string[];
    }[];
    onClose: () => void;
}

export const ImportResultModal = ({ title, summary, failures = [], onClose }: ImportResultModalProps) => {
    const [copied, setCopied] = useState(false);

    const generateSummaryText = () => {
        let text = `${title}\n`;
        if (summary.added !== undefined) text += `新規追加: ${summary.added}件\n`;
        if (summary.updated !== undefined) text += `既存更新: ${summary.updated}件\n`;
        if (summary.added === undefined && summary.updated === undefined) text += `更新完了: ${summary.success}件\n`;

        failures.forEach(f => {
            if (f.items.length > 0) {
                text += `\n【${f.label}】: ${f.items.length}件\n`;
                text += f.items.join(', ') + '\n';
            }
        });
        return text;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateSummaryText());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content import-result-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                
                <div className="modal-body">
                    <div className="result-summary-cards">
                        {summary.added !== undefined && (
                            <div className="result-card success">
                                <span className="result-label">新規追加</span>
                                <span className="result-count">{summary.added}</span>
                            </div>
                        )}
                        {summary.updated !== undefined && (
                            <div className="result-card update">
                                <span className="result-label">既存更新</span>
                                <span className="result-count">{summary.updated}</span>
                            </div>
                        )}
                        {summary.added === undefined && summary.updated === undefined && (
                            <div className="result-card success">
                                <span className="result-label">完了件数</span>
                                <span className="result-count">{summary.success}</span>
                            </div>
                        )}
                    </div>

                    {failures.map((f, idx) => f.items.length > 0 && (
                        <div key={idx} className={`result-failure-section ${f.type}`}>
                            <h3 className="failure-title">
                                <span className="failure-icon">⚠️</span>
                                {f.label}: {f.items.length}件
                            </h3>
                            <div className="failure-list-container">
                                <p className="failure-items">
                                    {f.items.join(', ')}
                                </p>
                            </div>
                            {f.type === 'conflict' && (
                                <p className="failure-hint">※ 名前やエイリアスが他者と重複しているためスキップされました。</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={handleCopy}>
                        {copied ? '✅ コピーしました' : '📋 結果をコピー'}
                    </button>
                    <button className="btn-primary" onClick={onClose}>閉じる</button>
                </div>
            </div>
        </div>
    );
};
