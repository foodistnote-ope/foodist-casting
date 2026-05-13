import Encoding from 'encoding-japanese';

/**
 * CSVの文字列をShift-JISに変換してダウンロードする
 * Windows版Excelでの文字化けを防ぐため、Shift-JIS (CP932) を使用する
 */
export const downloadCsvAsShiftJis = (csvString: string, filename: string): void => {
    // JavaScriptのUnicode文字列をUint8Arrayに変換
    const unicodeArray = Encoding.stringToCode(csvString);
    // Shift-JIS (CP932) に変換
    const sjisArray = Encoding.convert(unicodeArray, {
        to: 'SJIS',
        from: 'UNICODE',
    });
    const sjisBuffer = new Uint8Array(sjisArray);

    const blob = new Blob([sjisBuffer], { type: 'text/csv;charset=shift-jis;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
