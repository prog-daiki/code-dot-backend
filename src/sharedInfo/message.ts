export const Messages = {
  MSG_ERR_001: "認証されていません",
  MSG_ERR_002: "管理者ではありません",
  MSG_ERR_003: (entity: Entity) => `存在しない${entity}です`,
  MSG_ERR_004: "必須項目が未入力です",
  MSG_ERR_005: "購入済みの講座です",
};

export enum Entity {
  COURSE = "講座",
  CATEGORY = "カテゴリー",
  CHAPTER = "チャプター",
  MUXDATA = "Muxデータ",
}

export enum Property {
  TITLE = "タイトル",
  DESCRIPTION = "説明",
  IMAGE_URL = "サムネイル",
  PRICE = "価格",
  CATEGORY_ID = "カテゴリーID",
  CATEGORY_NAME = "カテゴリー名",
}

export enum Length {
  TITLE = "100文字",
  DESCRIPTION = "1000文字",
  CATEGORY_NAME = "100文字",
}
