import './ImageTextSection.css';

const ImageTextSection = ({ image, title, description, reverse }) => {
  return (
    <div className={`image-text-section ${reverse ? 'reverse' : ''}`}>
      <div className="image-block" style={{ backgroundImage: `url(${image})` }}></div>
      <div className="text-block">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default ImageTextSection;
