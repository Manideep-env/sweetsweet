import { Product, Category, Discount, Seller } from '@/models';
import ProductClient from './ProductClient';
import { Op } from 'sequelize';

// This server component fetches data for a specific product within a specific store
export default async function ProductDetailPage({ params }) {
  const { slug, productSlug } = params;
  const today = new Date();

  // Find the product, ensuring it belongs to the correct store, and include active discounts
  const product = await Product.findOne({
    where: { slug: productSlug },
    include: [
      {
        model: Seller,
        where: { storeSlug: slug },
        attributes: [], // We only use this to filter, not to get seller data
      },
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
        include: [
          {
            model: Discount,
            as: 'Discounts',
            where: {
              startDate: { [Op.lte]: today },
              endDate: { [Op.gte]: today },
            },
            required: false,
            attributes: ['percentage'],
          },
        ],
      },
      {
        model: Discount,
        as: 'Discounts',
        where: {
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today },
        },
        required: false,
        attributes: ['percentage'],
      },
    ],
  });

  if (!product) {
    return <div className="p-6 text-red-600">Product not found in this store.</div>;
  }

  // Calculate the final discount and discounted price
  const prodDiscount = product.Discounts?.[0]?.percentage || 0;
  const catDiscount = product.category?.Discounts?.[0]?.percentage || 0;
  const finalDiscount = Math.max(prodDiscount, catDiscount);

  const basePrice = product.pricePerKg ?? product.pricePerUnit;
  const discountedPrice = finalDiscount
    ? parseFloat((basePrice * (1 - finalDiscount / 100)).toFixed(2))
    : null;

  // Create a clean, enriched product object to pass to the client
  const enrichedProduct = {
    id: product.id,
    title: product.name,
    slug: product.slug,
    category: product.category,
    image: product.image,
    description: product.description,
    pricePerKg: product.pricePerKg,
    pricePerUnit: product.pricePerUnit,
    unitLabel: product.unitLabel,
    isAvailable: product.isAvailable,
    finalDiscount,
    discountedPrice,
  };

  // Pass the store slug and the enriched product object to the client
  return (
    <ProductClient
      product={JSON.parse(JSON.stringify(enrichedProduct))}
      storeSlug={slug}
    />
  );
}