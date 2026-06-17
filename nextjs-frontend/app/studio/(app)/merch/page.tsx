import { MerchManager } from "@/components/studio/MerchManager";
import { fetchProducts } from "@/lib/studio-data";

export default async function MerchPage() {
  const products = await fetchProducts();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Merchandise shop</h1>
        <p className="text-muted-foreground">
          Sell prints and merch from your booking page. Add products, then customers
          can add to cart and check out.
        </p>
      </div>
      <MerchManager products={products} />
    </div>
  );
}
