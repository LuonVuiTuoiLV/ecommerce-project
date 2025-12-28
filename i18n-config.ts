export const i18n = {
  locales: [
    { code: 'vi', name: 'Tiếng Việt', icon: '🇻🇳' },
    { code: 'en-US', name: 'English', icon: '🇺🇸' },
  ],
  defaultLocale: 'vi',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getDirection = (locale: string) => {
  return 'ltr'
}
export type I18nConfig = typeof i18n
export type Locale = I18nConfig['locales'][number]
