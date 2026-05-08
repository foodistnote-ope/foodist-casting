/**
 * 登録申請などの通知を管理するユーティリティ
 */

const notifySlack = async (displayName: string, data: any) => {
    console.log('New registration application received (Slack Notification Stub):', displayName, data);
    return true;
};

export { notifySlack };
