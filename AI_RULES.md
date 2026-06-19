# AI 開発アシスタント向けルール (AI_RULES)

このファイルは、AIアシスタントがこのプロジェクト（foodist-casting）で開発作業をサポートする際に、必ず遵守すべきルールを定義したものです。AIは新しい会話を開始した際、または作業を行う際にこのファイルを参照し、以下のルールを厳格に守ってください。

## 1. Git 操作に関するルール（最重要）

- **無断でのプッシュ禁止**:
  コードの変更やファイルの作成・修正を行った後、ユーザーから明確な「コミット・プッシュしてOK」という許可（またはそれに準ずる指示）が出るまでは、絶対に `git commit` および `git push` を実行しないでください。
  
2. **Localhost Confirmation First**:
   - The AI MUST NEVER execute `git push` or create a Pull Request directly after modifying code.
   - After any code modification, the AI MUST explicitly ask the USER to verify the changes on `localhost` (e.g., `npm run dev`).
   - Only AFTER the USER explicitly confirms that the localhost verification was successful, the AI is allowed to proceed with committing, pushing, or PR creation.

3. **Consent Before Action (Tools Execution)**:
   - Before executing ANY tool that modifies files or runs commands, the AI MUST explain its intended actions in text (e.g., "I will now edit file X to do Y") and ask for the user's consent.
   - The AI must wait for the user to explicitly agree before triggering the tool call, to prevent confusing permission popups for the user.

## 2. コミュニケーションと作業フロー

- 修正が完了した段階で、どのファイルをどのように修正したかを簡潔に報告し、次のステップ（確認依頼）を提示してください。
- ユーザーから修正内容に対するフィードバックや追加要望があった場合は、プッシュする前にコードを再修正してください。
- ユーザーから「確認しました。問題ありません」「プッシュしてください」「PRを作ってください」などの許可が出た段階で、初めてコミットとプッシュを行ってください。
