<script lang="ts">
  import { burn } from "$lib/burn";
  import { mint, TESTmint } from "$lib/mint";
  import { BrowserWalletState } from "$lib/state/browser-wallet-state.svelte";
  import { focusTrap } from "@skeletonlabs/skeleton";
  import { tokenToString } from "typescript";
  let isFocused: boolean = true;
  let policy: string = "";
  let tokenName: string = "";
  let amountN: number = 1;
  let amountM: number = 1;
  $: ismint = true;
  let isSuccess: Boolean = true;
  let error: string = "General Error!";

  function handleMint() {
    mint(policy, tokenName, amountM, amountN).catch((e) => {
      isSuccess = false;
      error = e;
    });
  }

  function handleBurn() {
    burn(policy, tokenName).catch((e) => {
      isSuccess = false;
      error = e;
    });
  }
</script>

<form use:focusTrap={isFocused} class="w-1/2 m-auto">
  <input
    class="input input-group p-2 m-2"
    type="text"
    name="Policy"
    bind:value={policy}
    placeholder="Policy"
  />
  <input
    class="input input-group p-2 m-2"
    type="text"
    name="Token Name"
    bind:value={tokenName}
    placeholder="Token Name (Text Only)"
  />
  {#if ismint}
    <input
      class="input input-group p-2 m-2"
      type="number"
      name="M_Amount"
      bind:value={amountM}
      placeholder="M Amount"
    />
    <input
      class="input input-group p-2 m-2"
      type="number"
      name="N_Amount"
      bind:value={amountN}
      placeholder="N Amount"
    />
  {/if}
  <div class="text-center">
    {#if ismint}
      <button
        class="btn variant-filled-primary"
        disabled={BrowserWalletState.wallet == undefined}
        on:click={() => handleMint()}>Mint</button
      >
    {:else}
      <button
        class="btn hover:variant-outline-success"
        disabled={BrowserWalletState.wallet == undefined}
        on:click={() => handleBurn()}>Unlock</button
      >
    {/if}
    <p class="text-error-400" class:hidden={isSuccess}>
      {JSON.stringify(error) == "{}"
        ? "If this failure is unexpected, please contact support"
        : JSON.stringify(error)}
    </p>
  </div>
  <div class="m-auto text-center p-2">
    <label class="inline-flex items-center cursor-pointer m-auto">
      <input type="checkbox" value="" class="sr-only peer" checked />
      <div
        on:click={() => {
          ismint = !ismint;
          isSuccess = true;
        }}
        class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-secondary-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"
      ></div>
    </label>
  </div>
</form>
<div class="m-auto text-center m-4 relative">
  <button
    class="btn hover:variant-outline-success"
    disabled={BrowserWalletState.wallet == undefined}
    on:click={() => TESTmint(tokenName)}>TEST MINT</button
  >
</div>
