<script>
  import Form from "$lib/components/Form.svelte";
  import WalletConnect from "$lib/components/WalletConnect.svelte";
</script>

<div class="">
  <h1 class="text-lg m-auto text-center">
    <strong class="text-success-500 text-xl">Fractionalize</strong> Your NFT
  </h1>
  <!-- <button on:click={() => loadWalletBuildTx()}>Load Wallet Build Tx</button> -->
  <Form></Form>

  <div class="m-auto">
    <WalletConnect />
  </div>
</div>
