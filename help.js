function loadHelpSection() {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    mainContent.innerHTML = `
        <h2>Help & Support</h2>
        <p>Need assistance? Contact us through the details below:</p>
        
        <h3>Contact Information</h3>
        <p><strong>Email:</strong> support@lassicorner.com</p>
        <p><strong>Phone:</strong> +91 98765 43210</p>
        
        <h3>Support Hours</h3>
        <p><strong>Available:</strong> Monday - Saturday, 9:00 AM - 9:00 PM</p>
        <p><strong>Response Time:</strong> Within 24 hours</p>
        
        <h3>Report an Issue</h3>
        <p>If you encounter any bugs or issues, please report them to our support email.</p>

        <h3>Feedback</h3>
        <p>Your feedback is valuable! Let us know how we can improve by emailing us at feedback@lassicorner.com.</p>
        
        <div id="helpDiv"></div>
    `;

    billPanel.style.display = 'none';
}
