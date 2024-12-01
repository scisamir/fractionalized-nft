<script lang="ts">
  import { mint } from "$lib/mint";
  import { focusTrap } from "@skeletonlabs/skeleton";
  let isFocused: boolean = true;
  let policy: string = "";
  let asset: string = "";
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
    name="Asset"
    bind:value={asset}
    placeholder="Asset"
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
    <button class="btn variant-filled-primary" on:click={() => mint()}
      >Mint</button
    >
    <button class="btn hover:variant-outline-success" disabled={false}
      >Unlock</button
    >
  </div>
</form>
