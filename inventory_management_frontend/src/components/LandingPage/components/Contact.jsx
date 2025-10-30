import './contact.css'; // Assuming you'll add styles in this file
import ContactUs from './ContactUs';
import MapSection from './MapSection';

function Contact() {
  return (
    <section className="contact-section" id="contact-visit">
        <div className="contact-visit-content">
            <MapSection/>
            <div className="divider"></div> {/* Bold line in the center */}
            <ContactUs/>
        </div>

    </section>
  );
}

export default Contact;
