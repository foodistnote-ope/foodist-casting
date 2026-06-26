export default async function handler(req, res) {
    // 許可されたメソッドの確認
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { displayName } = req.body;
    
    // サーバー側の環境変数から安全にWebhook URLを取得（ブラウザには公開されない）
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('SLACK_WEBHOOK_URL is not configured in Vercel environment variables.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const message = {
        text: `${displayName}さんから「料理の活動に関するアンケート」が送信されました。\n管理画面の「登録審査」から確認をお願いします。`
    };

    try {
        const formData = new URLSearchParams();
        formData.append('payload', JSON.stringify(message));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.statusText}`);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Failed to send Slack notification:', error);
        return res.status(500).json({ error: 'Failed to send notification.' });
    }
}
