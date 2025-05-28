/**
 * @file constants/layout.ts
 * @description Costanti per il layout dell'applicazione.
 */

/** Altezza della tab bar in pixel */
export const TAB_BAR_HEIGHT = 90;

/** Padding extra da aggiungere sotto il contenuto delle schermate tabs */
export const TAB_CONTENT_BOTTOM_PADDING = 16;

/**
 * Calcola il padding bottom totale per le schermate con tab bar
 * @param safeAreaBottom Valore di insets.bottom da useSafeAreaInsets
 * @returns Padding bottom totale
 */
export const getTabContentBottomPadding = (safeAreaBottom: number): number => {
  return TAB_BAR_HEIGHT + TAB_CONTENT_BOTTOM_PADDING + safeAreaBottom;
};
