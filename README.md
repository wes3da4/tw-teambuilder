# TW Team Builder

TalesWeaver のコンテンツ向けチーム編成管理ツール。

[https://wes3da4.github.io/tw-teambuilder/](https://wes3da4.github.io/tw-teambuilder/)

## 環境

本ツールはPC（デスクトップ）環境専用です。

## 不具合報告

- [@lu_uj](https://x.com/lu_uj)

## 機能

- **複数コンテンツ管理** — コンテンツごとにロール構成・PT 数を設定
- **ドラッグ&ドロップ編成** — メンバーをスロットへドラッグして配置、PT 間の入れ替えも可能
- **PT 並び替え** — PT ボックスをドラッグで順番変更
- **メンバー管理** — キャラクター・ロール・エタレベルを管理、欠席者フラグ対応
- **エタ表示切替** — メイン画面のエタ情報を一括表示/非表示
- **クリップボードコピー** — PT 編成をテキストまたはスクリーンショットでコピー
- **メモ機能** — メンバーごとの恒常メモ・コンテンツごとのスポットメモを管理
- **AI 編成プロンプト生成** — メモ・ロール・エタ情報をもとに AI への編成依頼プロンプトを生成してコピー
- **テキストから配置** — AI や共有テキストを貼り付けて PT 編成を一括適用（エラー検出・プレビュー付き）
- **データ永続化** — localStorage に自動保存

## Notes

This project was built with the assistance of [Claude](https://claude.ai/) (Anthropic).

## 技術スタック

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [@dnd-kit](https://dndkit.com/) — ドラッグ&ドロップ
- [html2canvas](https://html2canvas.hertzen.com/) — スクリーンショット

## 著作権表示

本ツールで利用しているキャラクター画像・アイコン類・名称に関する著作権はすべて以下に帰属します。

> Copyrights (C) NEXON Corporation and NEXON Co., Ltd. All Rights Reserved.

本ツールはファンメイドのユーティリティであり、NEXON Korea Corporation および NEXON Co., Ltd. とは一切関係ありません。

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

スキルデータの一部は [TaleWiki](https://talewiki.com/) (GFDL) を出典としています。詳細は [CREDITS.md](CREDITS.md) を参照してください。
