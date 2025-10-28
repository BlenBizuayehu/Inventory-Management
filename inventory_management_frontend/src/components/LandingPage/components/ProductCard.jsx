import './ProductCard.css';

const ProductCard = ({ image, title, description }) => {
  return (
    <div className="product-card">
      <div className="product-image" style={{ backgroundImage: `url(${image})` }} />
      <div className="product-overlay">
        <h3>{title}</h3>
        <p className="product-description">{description}</p>
      </div>
    </div>
  );
};

export default ProductCard;