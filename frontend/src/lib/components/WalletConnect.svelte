<script lang="ts">
  import { onMount } from "svelte";

  import type { Wallet } from "@meshsdk/core";
  import { BrowserWallet } from "@meshsdk/core";

  import {
    BrowserWalletState,
    connect,
    disconnect,
  } from "../state/browser-wallet-state.svelte.js";
  import { type CardanoWalletButtonProps } from "./";

  const {
    label = "Connect Wallet",
    onConnected,
    isDark = true,
    metamask = undefined,
    extensions = [],
  }: CardanoWalletButtonProps = $props();

  let availableWallets: Wallet[] = $state([]);

  onMount(() => {
    BrowserWallet.getAvailableWallets().then((aw) => {
      availableWallets = aw;
    });
  });

  let hideMenuList: boolean = $state(true);

  let lovelaceBalance: string | undefined = $state();

  $effect(() => {
    if (BrowserWalletState.connected && onConnected) {
      onConnected();
    }
    if (BrowserWalletState.wallet) {
      BrowserWalletState.wallet.getLovelace().then((l) => {
        lovelaceBalance = l;
      });
    }
  });
</script>

<div
  role="button"
  tabindex="0"
  aria-label="Connect Wallet"
  onmouseenter={() => (hideMenuList = false)}
  onmouseleave={() => (hideMenuList = true)}
  class="z-50 w-min text-center m-auto"
>
  <button
       class="btn variant-filled-primary"
    onclick={() => (hideMenuList = !hideMenuList)}
  >
    {#if BrowserWalletState.connecting}
      Connecting...
    {:else if BrowserWalletState.wallet === undefined}
      {label}
    {:else if BrowserWalletState.wallet && BrowserWalletState.wallet && lovelaceBalance}
      <img
        alt="Wallet Icon"
        class="m-2 h-6"
        src={BrowserWalletState.icon}
      />₳{" "}
      {parseInt((parseInt(lovelaceBalance, 10) / 1_000_000).toString(), 10)}.
      <span class="text-xs"
        >{lovelaceBalance.substring(lovelaceBalance.length - 6)}</span
      >
    {:else if BrowserWalletState.wallet && BrowserWalletState.wallet && lovelaceBalance === undefined}
      Loading...
    {/if}
    <svg
      class="m-2 h-6"
      fill="none"
      aria-hidden="true"
      viewBox="0 0 24 24"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>
  
  <div
    class={`mr-menu-list z-50 w-40  justify-center m-auto  rounded-b-md border text-center shadow-sm backdrop-blur ${hideMenuList && "hidden"} ${isDark ? `bg-primary-950  text-neutral-50` : `bg-neutral-50 text-neutral-950`}`}
  >
    {#if BrowserWalletState.wallet === undefined && availableWallets.length > 0}
      {#each availableWallets as enabledWallet}
        {@render menuItem(
          enabledWallet.icon,
          () => connect(enabledWallet),
          enabledWallet.name,
        )}
      {/each}
    {:else if BrowserWalletState.wallet === undefined && availableWallets.length === 0}
      <span>No Wallet Found</span>
    {:else if BrowserWalletState.wallet}
      {@render menuItem(undefined, () => disconnect(), "Disconnect")}
    {/if}
  </div>
</div>
{#snippet menuItem(icon: string | undefined, onclick: () => void, name: string)}
  <button
    class="flex h-16 cursor-pointer items-center px-4 w-full py-2 opacity-80 hover:opacity-100 hover:bg-primary-500"
    {onclick}
  >
    {#if icon}
      <img
        alt={name + " wallet icon"}
        class="m-1 h-8 pr-2"
        src={icon}
      />
    {/if}
    <span
      class="mr-menu-item text-xl font-normal text-gray-700"
      class:text-white={isDark}
    >
      {name
        .split(" ")
        .map((word: string) => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ")}
    </span>
  </button>
{/snippet}