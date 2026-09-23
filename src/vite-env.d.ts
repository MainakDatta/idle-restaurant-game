// Types for our VITE_ values in .env, so `import.meta.env.VITE_GAME_TITLE` is a string
// instead of `any`. This merges into the ImportMetaEnv type that Vite already provides.
interface ImportMetaEnv {
  readonly VITE_GAME_TITLE: string
}
