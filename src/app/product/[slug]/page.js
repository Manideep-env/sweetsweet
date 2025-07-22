import { Product, Category, Discount } from '@/models';
import ProductClient from './ProductClient';
import { Op } from 'sequelize';

export default async function ProductPage({ params }) {
  const { slug } = params;
  const today = new Date();

  const product = await Product.findOne({
    where: { slug },
    include: [
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
    return <div className="p-6 text-red-600">Product not found</div>;
  }

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
    isAvailable: product.isAvailable,
    finalDiscount,
    discountedPrice,
  };

  return <ProductClient product={JSON.parse(JSON.stringify(enrichedProduct))} />;
}
