import { useState } from 'react';
import './ProductsPage.css';

const productData = [
  { name: "Quartz 9000 Energy 5W-40", category: "Engine Oil", description: "Premium synthetic engine oil for passenger vehicles." },
  { name: "Rubia TIR 9900 FE 5W-30", category: "Diesel Engine Oil", description: "Advanced diesel engine oil for trucks and heavy-duty engines." },
  { name: "Hydransafe HFDU 46", category: "Hydraulic Oil", description: "Fire-resistant hydraulic fluid for industrial use." },
  { name: "Carter EP 220", category: "Gear Oil", description: "Extreme pressure industrial gear lubricant." },
  { name: "TOTAL Multipurpose Grease", category: "Grease", description: "High-performance grease for multi-use lubrication." }
];

function ProductsPage() {
  const [search, setSearch] = useState("");

  const filteredProducts = productData.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(productData.map(p => p.category))];

  return (
    <div className="products-page">
      <h1>Our Products</h1>

      <section className="intro">
        <p>
          We are proud distributors of <strong>TOTAL</strong> lubricants, one of the world's leading manufacturers of high-performance oils and greases.
          TOTAL lubricants are designed to meet the demands of modern machinery and engines, offering:
        </p>
        <ul>
          <li>Superior engine protection</li>
          <li>Longer drain intervals</li>
          <li>Reduced emissions and improved fuel economy</li>
          <li>Trusted performance in extreme conditions</li>
        </ul>
      </section>

      <input
        type="text"
        placeholder="Search by product name or category..."
        className="product-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="categories">
        {categories.map((cat, index) => (
          <div key={index} className="category-card">
            <h3>{cat}</h3>
            <ul>
              {filteredProducts
                .filter(p => p.category === cat)
                .map((product, idx) => (
                  <li key={idx}>
                    <strong>{product.name}</strong><br />
                    <span>{product.description}</span>
                  </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;
