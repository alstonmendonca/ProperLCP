function loadHelpSection() {
    const mainContent = document.getElementById("main-content");
    const billPanel = document.getElementById("bill-panel");

    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';

    mainContent.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1DB954 0%, #0D3B66 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ">
            <h2 style="
                margin: 0;
                font-size: 28px;
                font-weight: 600;
                letter-spacing: 0.5px;
            ">Help & Support Center</h2>
        </div>
        
        <div style="
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        ">
            <p style="
                font-size: 16px;
                line-height: 1.6;
                color: #555;
                margin-bottom: 30px;
            ">Need assistance with our POS system? We're here to help you with any questions or issues you may have.</p>
            
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-bottom: 40px;
            ">
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #1DB954;
                ">
                    <h3 style="
                        color: #0D3B66;
                        margin-top: 0;
                        font-size: 20px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span style="
                            background: #1DB954;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 16px;
                        ">1</span>
                        Contact Information
                    </h3>
                    <div style="margin-left: 40px;">
                        <p style="margin: 15px 0;">
                            <strong style="color: #333; min-width: 80px; display: inline-block;">Email:</strong>
                            <a href="mailto:support@lassicorner.com" style="color: #1DB954; text-decoration: none;">
                                support@lassicorner.com
                            </a>
                        </p>
                        <p style="margin: 15px 0;">
                            <strong style="color: #333; min-width: 80px; display: inline-block;">Phone:</strong>
                            <a href="tel:+919876543210" style="color: #1DB954; text-decoration: none;">
                                +91 98765 43210
                            </a>
                        </p>
                    </div>
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #1DB954;
                ">
                    <h3 style="
                        color: #0D3B66;
                        margin-top: 0;
                        font-size: 20px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span style="
                            background: #1DB954;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 16px;
                        ">2</span>
                        Support Hours
                    </h3>
                    <div style="margin-left: 40px;">
                        <p style="margin: 15px 0;">
                            <strong style="color: #333;">Available:</strong> Monday - Saturday<br>
                            9:00 AM - 9:00 PM
                        </p>
                        <p style="margin: 15px 0;">
                            <strong style="color: #333;">Response Time:</strong> Within 24 hours
                        </p>
                    </div>
                </div>
            </div>
            
            <div style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #1DB954;
                margin-bottom: 30px;
            ">
                <h3 style="
                    color: #0D3B66;
                    margin-top: 0;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="
                        background: #1DB954;
                        color: white;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                    ">3</span>
                    Report an Issue
                </h3>
                <div style="margin-left: 40px;">
                    <p style="margin: 15px 0; line-height: 1.6;">
                        If you encounter any bugs or issues with the system, please report them to our 
                        <a href="mailto:support@lassicorner.com" style="color: #1DB954; text-decoration: none;">
                            support email
                        </a> with screenshots and detailed steps to reproduce the issue.
                    </p>
                </div>
            </div>
            
            <div style="
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #1DB954;
            ">
                <h3 style="
                    color: #0D3B66;
                    margin-top: 0;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="
                        background: #1DB954;
                        color: white;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                    ">4</span>
                    Feedback & Suggestions
                </h3>
                <div style="margin-left: 40px;">
                    <p style="margin: 15px 0; line-height: 1.6;">
                        Your feedback helps us improve! Share your suggestions at 
                        <a href="mailto:feedback@lassicorner.com" style="color: #1DB954; text-decoration: none;">
                            feedback@lassicorner.com
                        </a>
                    </p>
                    <button style="
                        background: #1DB954;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 500;
                        margin-top: 10px;
                        transition: all 0.2s;
                    " 
                    onmouseover="this.style.backgroundColor='#0D3B66'" 
                    onmouseout="this.style.backgroundColor='#1DB954'">
                        Send Feedback
                    </button>
                </div>
            </div>
        </div>
    `;
}