<script lang="ts">
  import { burn } from "$lib/burn";
  import { mint } from "$lib/mint";
  import { focusTrap } from "@skeletonlabs/skeleton";
  import { tokenToString } from "typescript";
  let isFocused: boolean = true;
  let policy: string = "";
  let tokenName: string = "";
  let amountN: number = 1;
  let amountM: number = 1;
</script>

<form use:focusTrap={isFocused} class="p-4">
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
    placeholder="Token Name"
  />
  <input
    class="input input-group p-2 m-2"
    type="number"
    name="N_Amount"
    bind:value={amountN}
    placeholder="N Amount"
  />
  <input
    class="input input-group p-2 m-2"
    type="number"
    name="M_Amount"
    bind:value={amountM}
    placeholder="M Amount"
  />
  <div class="text-center">
    <button
      class="btn variant-filled-primary"
      on:click={() => mint(policy, tokenName)}>Mint</button
    >
    <button
      class="btn hover:variant-outline-success"
      on:click={() => burn(policy, tokenName)}>Unlock</button
    >
  </div>
</form>
