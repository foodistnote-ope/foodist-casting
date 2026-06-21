/**
 * 登録申請などの通知を管理するユーティリティ
 */

const notifySlack = async (displayName: string, data: any) => {
    // .env ファイルから Slack Webhook の URL を読み込みます
    const webhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL;

    // URLが設定されていない場合は、エラーにならないようにここで処理を終わります
    if (!webhookUrl) {
        console.warn('Slack Webhook URLが設定されていません。通知はスキップされました。');
        return false;
    }

    // Slackに送信するメッセージの内容を作成します
    const message = {
        text: `${displayName}さんから「料理の活動に関するアンケート」が送信されました。\n管理画面の「登録審査」から確認をお願いします。`
    };

    try {
        // SlackのWebhookは、ブラウザから送る際に特定のデータ形式でないと弾かれることがあります。
        // 確実に届く形式（URLエンコード形式のpayload）に変換して送信します。
        const formData = new URLSearchParams();
        formData.append('payload', JSON.stringify(message));

        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData,
            mode: 'no-cors'
        });
        
        console.log('Slackへ通知を送信しました:', displayName);
        return true;
    } catch (err) {
        console.error('Slack通知の送信に失敗しました:', err);
        return false;
    }
};

export { notifySlack };
