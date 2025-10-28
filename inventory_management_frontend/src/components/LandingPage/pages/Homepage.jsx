import AboutUs from "../components/AboutUs";
import Contact from "../components/Contact";
import Hero from "../components/Hero";
import Products from "../components/Products";
import "./Homepage.css";

function Homepage() {
  return (
    <>
      <Hero />
      <AboutUs />
      <Products />
      <div>
        {/* Content Sections */}
        <div className="main-content">
          <section className="content-section">
            <h2>Our Commitment</h2>
            <p>Innovation, sustainability, and performance at every turn.</p>
          </section>
        </div>
        <Contact />

        <div className="footer-parallax">
          {/* Quick Links Section */}
          <div className="quick-links">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#products">Products</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#team">Our Team</a></li>
              <li><a href="#team">Shops</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="copyright">
          <p>&copy; 2025 Your Company. All Rights Reserved.</p>
        </div>
      </div>
    </>
  );
}

export default Homepage;
