/**
 * 登録申請などの通知を管理するユーティリティ
 */

const notifySlack = async (displayName: string, data: any) => {
    // ローカル開発環境のフォールバック処理
    // Viteデベロップメントサーバーでは /api のルーティングがデフォルトで動作しないため、
    // ローカルテスト時に SlackWebhook が動作するようVITE_SLACK_WEBHOOK_URLがある場合はそちらを使います。
    // ※ セキュリティ向上のため、本番環境の.envにはVITE_プレフィックスを設定しないでください。
    if (import.meta.env.DEV) {
        const localWebhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL;
        if (localWebhookUrl) {
            const message = {
                text: `${displayName}さんから「料理の活動に関するアンケート」が送信されました。\n管理画面の「登録審査」から確認をお願いします。`
            };
            try {
                const formData = new URLSearchParams();
                formData.append('payload', JSON.stringify(message));
                await fetch(localWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                    mode: 'no-cors'
                });
                console.log('[Local Dev] Slackへ通知を直接送信しました:', displayName);
                return true;
            } catch (err) {
                console.error('[Local Dev] Slack通知の送信に失敗しました:', err);
                return false;
            }
        } else {
            // ローカルで VITE_SLACK_WEBHOOK_URL が設定されていない場合はスキップ
            console.log(`[Local Dev] Slack Webhook URLが未設定のため通知をスキップしました (displayName: ${displayName})`);
            return true;
        }
    }

    // 本番環境 (Vercel) ではバックエンドのServerless Functionを呼び出す
    try {
        const response = await fetch('/api/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ displayName }),
        });
        
        if (!response.ok) {
            throw new Error(`Serverless API error: ${response.statusText}`);
        }
        
        console.log('Slackへ通知を送信しました:', displayName);
        return true;
    } catch (err) {
        console.error('Slack通知の送信に失敗しました:', err);
        return false;
    }
};

export { notifySlack };
