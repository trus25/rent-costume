export const CATALOGUE_MAX_IMAGE_COUNT = 6;
export const MAX_IMAGE_SIZE = 1024 * 1024;
export const editorTabs = ['details', 'variants', 'media', 'maintenance'] as const;
export type CatalogueEditorTab = (typeof editorTabs)[number];
