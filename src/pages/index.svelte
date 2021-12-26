<script>
    import { Address } from "ergo-lib-wasm-browser";

    const addr = "8fc4fc070cc786fa723cbfac54e2d71094daf275ebe1088caf602ddcefc95d88";
    a =  Address.from_mainnet_str(addr).to_ergo_tree().to_base16_bytes()
</script>

<h1>App?!</h1>
<p>{a}</p>

<a href="/guide">guide</a>