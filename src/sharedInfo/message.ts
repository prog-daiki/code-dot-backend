export const Messages = {
  MSG_ERR_001: "認証されていません",
  MSG_ERR_002: "管理者ではありません",
  MSG_ERR_003: (entity: Entity) => `存在しない${entity}です`,
  MSG_ERR_004: (property: Property) => `${property}は必須です`,
  MSG_ERR_005: (property: Property, length: Length) =>
    `${property}は${length}以内です`,
};

export enum Entity {
  COURSE = "講座",
}

export enum Property {
  TITLE = "タイトル",
  DESCRIPTION = "説明",
  IMAGE_URL = "サムネイル",
}

export enum Length {
  TITLE = "100文字",
  DESCRIPTION = "1000文字",
}
