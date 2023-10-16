<script lang="ts">
  const shortcutUrl = import.meta.env.VITE_SHORTCUT_URL
</script>

<div class="max-w-xl flex flex-col items-center">
  <h1 class="text-6xl font-semibold">Quickcast</h1>
  <p class="mt-4 text-center">
    A minimum viable client for Farcaster, built with iOS Shortcuts and <a
      class="underline underline-offset-2"
      href="https://neynar.xyz">Neynar</a
    >.
  </p>

  <a
    class="mt-8 px-10 py-3 rounded-full text-black font-bold shadow-md transition-all duration-200 bg-white pointer-events-auto hover:shadow-lg hover:scale-105"
    href={shortcutUrl}>
    Download Shortcut
  </a>

</div>
