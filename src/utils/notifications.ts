/**
 * 登録申請などの通知を管理するユーティリティ
 */

/**
 * 新規登録申請があった際に通知を送信する
 * (現在はコンソールログのみ。将来的にSlackやメール連携が可能)
 */
export const notifySlack = async (data: { displayName: string; email: string }) => {
    console.log('New registration application received (Slack Notification Stub):', data);
    return true;
};
