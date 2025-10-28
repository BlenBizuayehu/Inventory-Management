import './AboutUs.css';
import ImageTextSection from './ImageTextSection';

const shopSections = [
  {
    image: '/images/shop1.jpg',
    title: 'Head Office & Main Showroom',
    description: 'Our flagship showroom located in the heart of the city provides full access to the complete Total Lubricants portfolio for retail and commercial clients.',
  },
  {
    image: '/images/shop2.jpg',
    title: 'Industrial Supply Outlet',
    description: 'Engineered to serve heavy-duty operations and B2B clients, this branch offers expert consultation and bulk solutions for industrial-grade lubricants.',
  },
  {
    image: '/images/shop3.jpg',
    title: 'Highway Service Point',
    description: 'Our strategic location on the national highway ensures drivers and logistics fleets have quick access to premium oils, greases, and cooling fluids for optimized performance.',
  }
];

const AboutUs = () => {
  return (
    <section className="about-section" id="about">
      <div className="about-content">
        <h2>About Us</h2>
        <p className="about-description">
          We are a certified <strong>Total Lubricants distributor</strong>, providing authentic and high-performance lubrication solutions. 
          Our commitment to technical integrity and customer trust makes us a preferred choice across the automotive and industrial sectors.
        </p>

        {shopSections.map((shop, i) => (
          <ImageTextSection
            key={i}
            image={shop.image}
            title={shop.title}
            description={shop.description}
            reverse={i % 2 !== 0}
          />
        ))}
      </div>
    </section>
  );
};

export default AboutUs;
