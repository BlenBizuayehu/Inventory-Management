import ProductCard from './ProductCard';
import './Products.css'; // Add specific styling for the products section

const products = [
  {
    image: '/card4.webp',
    title: 'Total Quartz 9000',
    description: 'High-performance motor oil for modern gasoline and diesel engines, ensuring long-lasting protection and fuel efficiency.',
  },
  {
    image: '/card4.webp',
    title: 'Total Rubia TIR 7900',
    description: 'Engine oil designed for commercial vehicles, offering improved engine cleanliness and protection under extreme operating conditions.',
  },
  {
    image: '/card4.webp',
    title: 'Total Transmission Fluid',
    description: 'Advanced transmission fluid for smoother gear shifting and longer lifespan, designed for both manual and automatic transmissions.',
  },
   {
    image: '/card4.webp',
    title: 'Total Transmission Fluid',
    description: 'Advanced transmission fluid for smoother gear shifting and longer lifespan, designed for both manual and automatic transmissions.',
  },
];

function Products() {
  return (
    <section className="products-section" id="products">
      <h2 className="products-title">Our Products</h2>
      <div className="product-cards-container">
        {products.map((product, index) => (
          <ProductCard
            key={index}
            image={product.image}
            title={product.title}
            description={product.description}
          />
        ))}
      </div>
    </section>
  );
}

export default Products;
