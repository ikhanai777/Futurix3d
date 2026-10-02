import { createProduct } from "../../actions";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New product</h1>
      <p className="text-sm text-zinc-500">Save first, then upload files and photos on the next screen.</p>
      <ProductForm action={createProduct} submitLabel="Create product" />
    </div>
  );
}
