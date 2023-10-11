<script lang="ts">
  import clsx from "clsx"
  
  const shortcutUrl = import.meta.env.VITE_SHORTCUT_URL
  let hasAgreed = false
</script>

<div class="max-w-xl flex flex-col items-center">
  <h1 class="text-6xl font-semibold">Quickcast</h1>
  <p class="mt-4 text-center">
    A minimum viable client for Farcaster, built with iOS Shortcuts and <a
      class="underline underline-offset-2"
      href="https://neynar.xyz">Neynar</a
    >.
  </p>
  
  <p class="mt-4 text-center">Quickcast relies on the free <a class="underline underline-offset-2" href="https://apps.apple.com/us/app/actions/id1586435171">Actions</a> app, which <strong>must</strong> be installed before downloading the shortcut.</p>
  
  <a
    class={clsx("mt-10 px-10 py-3 rounded-full text-black font-bold shadow-md transition-all duration-200",
    {"bg-gray-400 pointer-events-none": !hasAgreed},
    {"bg-white pointer-events-auto hover:shadow-lg hover:scale-105": hasAgreed})}
    href={shortcutUrl}>
    Download Shortcut
  </a>
  <div class="flex items-center mt-4">
    <input type="checkbox" bind:checked={hasAgreed} />
    <span class="ml-1.5">I have installed the <a class="underline underline-offset-2" href="https://apps.apple.com/us/app/actions/id1586435171">Actions app</a></span>
  </div>
</div>
