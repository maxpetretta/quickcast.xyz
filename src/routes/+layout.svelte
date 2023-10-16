<script>
  import "../app.css"
  
  import { dev } from "$app/environment"
  import { inject } from "@vercel/analytics"

  inject({ mode: dev ? "development" : "production"})
</script>

<main
  class="flex w-full h-[100svh] items-center justify-center bg-gradient-to-b from-[#8A63D2] via-[#8A63D2] to-[#472A92] text-white px-5"
>
  <slot />
</main>
