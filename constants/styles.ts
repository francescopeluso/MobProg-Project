/**
 * @file constants/styles.ts
 * @description Stili comuni e variabili di design condivise in tutta l'app
 */

import { StyleSheet } from 'react-native';

// Palette colori principale - Design centrato sul blu
export const Colors = {
  // Colori primari - Blu principale
  primary: '#4A90E2',
  primaryDark: '#2E5BBF',
  primaryLight: '#6BA3E8',
  secondary: '#5C6BC0', // Indigo per contrasto
  
  // Colori di sfondo - Più vivaci
  background: '#F5F7FF', // Sfondo con tinta blu leggera
  surface: '#ffffff',
  surfaceVariant: '#E8F2FF', // Variante con tinta blu
  
  // Colori testo
  textPrimary: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#718096',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#ffffff',
  
  // Colori di stato - Più vivaci
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
  info: '#4299E1',
  
  // Colori accent vivaci
  accent: '#9F7AEA', // Viola
  accentSecondary: '#38B2AC', // Teal
  accentTertiary: '#ED64A6', // Rosa
  accentLight: '#EBF8FF',
  
  // Colori funzionali
  reading: '#48BB78', // Verde per "in lettura"
  completed: '#4299E1', // Blu per "completato"
  toRead: '#9F7AEA', // Viola per "da leggere"
  
  // Bordi e separatori
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Overlay
  overlay: 'rgba(26,32,44,0.6)',
  overlayLight: 'rgba(26,32,44,0.1)',
  
  // Colori per grafici - Palette colorata
  chart1: '#4A90E2', // Blu primario
  chart2: '#9F7AEA', // Viola
  chart3: '#38B2AC', // Teal
  chart4: '#ED64A6', // Rosa
  chart5: '#48BB78', // Verde
  chart6: '#5C6BC0', // Indigo
  chart7: '#F6AD55', // Arancione caldo (solo per varietà nei grafici)
  chart8: '#4299E1', // Blu info
};

// Dimensioni e spaziature
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius
export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
};

// Typography
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Shadows
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Stili comuni condivisi
export const CommonStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  
  // Header styles
  header: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: Typography.fontSize.huge,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textOnPrimary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textOnPrimary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  iconButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  
  // Form elements
  formSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  labelIcon: {
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  
  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  cardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    ...Shadows.large,
  },
  closeIcon: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    zIndex: 10,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  
  // Empty states
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.lg,
    fontStyle: 'italic',
  },
  
  // Pills and tags
  pill: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pillActive: {
    backgroundColor: Colors.accent,
  },
  pillText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  
  // Status indicators
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  
  // Safe area
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

// Layout utilities
export const LayoutUtils = {
  row: {
    flexDirection: 'row' as const,
  },
  column: {
    flexDirection: 'column' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  spaceBetween: {
    justifyContent: 'space-between' as const,
  },
  flex1: {
    flex: 1,
  },
};
