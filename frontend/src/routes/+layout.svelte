<script>
  import "../app.css";
  import "$lib/styles/global.css";
  import { AppBar } from "@skeletonlabs/skeleton";
  import WalletConnect from "$lib/components/WalletConnect.svelte";
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <strong class="text-success-500 text-xl">Fractus!</strong>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <WalletConnect />
  </svelte:fragment>
  <!-- <svelte:fragment slot="headline">(headline)</svelte:fragment> -->
</AppBar>

<div class="flex flex-row min-h-screen justify-center items-center">
  <slot></slot>
</div>
