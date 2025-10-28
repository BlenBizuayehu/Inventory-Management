import './AboutPage.css';

function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>About Us</h1>
        <p>Crafting quality experiences through trusted partnerships and exceptional products.</p>
      </section>

      <section className="about-section">
        <h2>About Total Product</h2>
        <p>
          Total Product is a global leader in innovative consumer goods, known for their dedication to quality,
          sustainability, and cutting-edge design. Their commitment to excellence aligns perfectly with our values,
          making them an ideal brand to work with.
        </p>
      </section>

      <section className="about-section">
        <h2>Our Partnership</h2>
        <p>
          Our collaboration with Total Product is built on trust and shared vision. Together, we bring their top-tier
          offerings directly to our customers with transparency, efficiency, and heart. We work closely to ensure that
          every product we carry meets the highest standards of quality and performance.
        </p>
      </section>

      <section className="our-team">
        <h2>Our Team</h2>
        <p>
            
        </p>
        <div className="team-members">
          <div className="team-member">
            <img src="/team1.jpg" alt="Team Member 1" />
            <h3>Birhane Teferi</h3>
            <p>Founder & CEO</p>
          </div>
          <div className="team-member">
            <img src="/team2.jpg" alt="Team Member 2" />
            <h3>Sara Mekonnen</h3>
            <p>Sales Manager</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>About Our Shop</h2>
        <p>
          At our shop, we aim to deliver more than just products—we provide a curated experience. From our carefully
          selected inventory to our responsive customer service, everything we do is driven by our mission to inspire,
          empower, and satisfy every customer. Whether you’re discovering your new favorite product or coming back for
          something you trust, we're here for the long haul.
        </p>
      </section>
    </div>
  );
}

export default AboutPage;
