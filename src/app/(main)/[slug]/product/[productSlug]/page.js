import { Product, Category, Discount, Seller, StoreCustomization } from '@/models';
import ProductClient from './ProductClient';
import { Op } from 'sequelize';
import { sequelize } from '@/lib/db';

export default async function ProductDetailPage({ params }) {
  const { slug, productSlug } = params;
  const today = new Date();

  // Fetch product and customization settings in parallel
  const [product, customization] = await Promise.all([
    Product.findOne({
      where: { slug: productSlug },
      include: [
        { model: Seller, where: { storeSlug: slug }, attributes: [] },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
          include: [{
            model: Discount,
            as: 'Discounts',
            where: {
              startDate: { [Op.lte]: today },
              endDate: { [Op.gte]: today },
            },
            required: false,
            attributes: ['percentage'],
          }],
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
    }),
    StoreCustomization.findOne({
      include: [{
        model: Seller,
        where: { storeSlug: slug },
        attributes: [],
      }],
    })
  ]);

  if (!product) {
    return <div className="p-6 text-red-600">Product not found in this store.</div>;
  }

  // Calculate discount (logic remains the same)
  const prodDiscount = product.Discounts?.[0]?.percentage || 0;
  const catDiscount = product.category?.Discounts?.[0]?.percentage || 0;
  const finalDiscount = Math.max(prodDiscount, catDiscount);
  const basePrice = product.pricePerKg ?? product.pricePerUnit;
  const discountedPrice = finalDiscount
    ? parseFloat((basePrice * (1 - finalDiscount / 100)).toFixed(2))
    : null;

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
    finalDiscount,
    discountedPrice,
  };

  // Pass all necessary data to the client component
  return (
    <ProductClient
      product={JSON.parse(JSON.stringify(enrichedProduct))}
      storeSlug={slug}
      customization={JSON.parse(JSON.stringify(customization))}
    />
  );
}
