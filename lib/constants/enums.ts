// Enum value tuples mirroring prisma/schema.prisma.
//
// These exist so Zod schemas, searchParams validation and UI dropdowns all read from one
// place. The 12-value Language list used to be copy-pasted into 12 API route files; adding a
// language meant editing all of them, and missing one produced a runtime 400 on a valid value
// with no compile error.
//
// `as const` keeps the literal union, which is what z.enum() needs.

export const MOVIE_STATUS_VALUES = ["WATCHED", "WANT_TO_WATCH", "DROPPED"] as const;
export const GAME_STATUS_VALUES = ["PLAYING", "COMPLETED", "PLAN_TO_PLAY", "DROPPED", "PLATINUM"] as const;
export const GAME_PLATFORM_VALUES = ["PC", "MAC", "STEAM_DECK", "PS5", "PS4", "PS3", "PS2", "PS1", "PSP", "PS_VITA", "XBOX_SERIES_X", "XBOX_SERIES_S", "XBOX_ONE_X", "XBOX_ONE_S", "XBOX_ONE", "XBOX_360", "XBOX", "SWITCH_2", "SWITCH", "SWITCH_OLED", "SWITCH_LITE", "WII_U", "WII", "GAMECUBE", "N64", "SNES", "NES", "NINTENDO_3DS", "DS", "GBA", "GBC", "GAMEBOY", "SEGA_DREAMCAST", "SEGA_SATURN", "SEGA_GENESIS", "GAME_GEAR", "IOS", "ANDROID", "OTHER"] as const;
export const MANGA_FORMAT_VALUES = ["MANGA", "MANHWA", "MANHUA"] as const;
export const MANGA_STATUS_VALUES = ["READING", "COMPLETED", "PLAN_TO_READ"] as const;
export const ARTICLE_STATUS_VALUES = ["READ", "WANT_TO_READ"] as const;
export const DAY_KIND_VALUES = ["SCHOOL", "HOLIDAY"] as const;
export const EXPENSE_CATEGORY_VALUES = ["FOOD", "BOOKS", "EDUCATION", "ENTERTAINMENT", "CLOTHING", "SUBSCRIPTIONS", "SELF_CARE", "TRANSPORTATION", "OTHER", "CASH"] as const;
