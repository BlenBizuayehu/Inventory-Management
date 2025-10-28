import {
  faFacebookF,
  faLinkedinIn,
  faWhatsapp
} from '@fortawesome/free-brands-svg-icons';
import {
  faEnvelope,
  faPhoneAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ContactUs.css';

function ContactUs() {
  return (
    <div className="contact-us-section">
      <div className="contact-header">
        <h2>📞 </h2>
      </div>
      
      <div className="contact-card">
        <div className="contact-info">
          <div className="contact-item">
            <div className="icon-container email">
              <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
            </div>
            <div>
              <h3>EMAIL US</h3>
              <p>contact@lubricantspro.com</p>
            </div>
          </div>
          
          <div className="contact-item">
            <div className="icon-container phone">
              <FontAwesomeIcon icon={faPhoneAlt} className="contact-icon" />
            </div>
            <div>
              <h3>CALL US</h3>
              <p>+123 456 7890</p>
              <p className="hours">Mon-Fri: 8AM-6PM</p>
            </div>
          </div>
          
        </div>
        
        <div className="social-links">
          <a href="#" className="social-icon whatsapp" title="WhatsApp">
            <FontAwesomeIcon icon={faWhatsapp} />
          </a>
          <a href="#" className="social-icon facebook" title="Facebook">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="#" className="social-icon linkedin" title="LinkedIn">
            <FontAwesomeIcon icon={faLinkedinIn} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;