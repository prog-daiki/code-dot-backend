export const Messages = {
  MSG_ERR_001: "認証されていません",
  MSG_ERR_002: "管理者ではありません",
  MSG_ERR_003: (entity: string) => `存在しない${entity}です`,
  MSG_ERR_TITLE_REQUIRED: "タイトルは必須です",
  MSG_ERR_TITLE_LIMIT: "タイトルは100文字以内です",
  MSG_ERR_DESCRIPTION_LIMIT: "詳細は1000文字以内です",
  MSG_ERR_IMAGE_URL_REQUIRED: "サムネイルは必須です",
  MSG_ERR_CATEGORY_REQUIRED: "カテゴリー名は必須です",
  MSG_ERR_CATEGORY_LIMIT: "カテゴリー名は100文字以内です",
};

export const Entity = {
  COURSE: "講座",
};
