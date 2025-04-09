const { ipcRenderer } = require('electron');

function loadBusinessInfo(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
    
    mainContent.innerHTML = `
        <div class="business-info-container" style="
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            background: #f9f9f9;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
        ">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="
                    color: #2c3e50;
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                    font-weight: 600;
                ">Lassi Corner</h1>
                <div style="
                    height: 3px;
                    width: 100px;
                    background: #e67e22;
                    margin: 0 auto 20px;
                "></div>
                <p style="
                    font-size: 1.1rem;
                    color: #7f8c8d;
                    margin-bottom: 5px;
                ">Authentic Indian Yogurt Drinks & Snacks</p>
            </div>

            <div style="display: flex; gap: 30px;">
                <div style="flex: 1;">
                    <h2 style="
                        color: #e67e22;
                        font-size: 1.4rem;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 8px;
                    ">About Us</h2>
                    <p style="
                        line-height: 1.6;
                        margin-bottom: 20px;
                    ">Lassi Corner serves, not just Lassi, but even burgers, wraps, sandwiches, milkshakes and momos as well. It is a constantly growing franchise with a mouth-watering menu.</p>
                    
                    <h2 style="
                        color: #e67e22;
                        font-size: 1.4rem;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 8px;
                    ">Contact</h2>
                    <div style="margin-bottom: 15px;">
                        <strong style="display: inline-block; width: 100px;">Address:</strong>
                        <span>Vamanjoor, Mangalore, Karnataka 575028</span>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong style="display: inline-block; width: 100px;">Phone:</strong>
                        <span>+91 9876543210</span>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong style="display: inline-block; width: 100px;">Email:</strong>
                        <span>contact@lassicorner.com</span>
                    </div>
                </div>

                <div style="flex: 1;">
                    <h2 style="
                        color: #e67e22;
                        font-size: 1.4rem;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 8px;
                    ">Business Hours</h2>
                    <div style="margin-bottom: 8px;">
                        <strong style="display: inline-block; width: 120px;">Monday - Friday:</strong>
                        <span>9:00 AM - 10:00 PM</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong style="display: inline-block; width: 120px;">Saturday:</strong>
                        <span>10:00 AM - 11:00 PM</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong style="display: inline-block; width: 120px;">Sunday:</strong>
                        <span>Timings not available</span>
                    </div>

                    <h2 style="
                        color: #e67e22;
                        font-size: 1.4rem;
                        margin-bottom: 15px;
                        margin-top: 30px;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 8px;
                    ">Owner</h2>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: #ddd;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.5rem;
                            color: #777;
                        ">AA</div>
                        <div>
                            <div style="font-weight: 600; font-size: 1.1rem;">Ajay Anchan</div>
                            <div style="color: #7f8c8d; font-size: 0.9rem;">Founder & CEO</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

module.exports = { loadBusinessInfo };