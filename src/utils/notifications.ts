/**
 * 登録申請などの通知を管理するユーティリティ
 */

/**
 * 新規登録申請があった際に通知を送信する
 * (現在はコンソールログのみ。将来的にSlackやメール連携が可能)
 */
export const sendRegistrationNotification = async (data: { displayName: string; email: string }) => {
    console.log('New registration application received:', data);
    
    // 将来の拡張用: Slack WebhookやメールAPIの呼び出しをここに記述
    // try {
    //     await fetch(process.env.SLACK_WEBHOOK_URL, { ... });
    // } catch (e) {
    //     console.error('Notification failed:', e);
    // }
    
    return true;
};
