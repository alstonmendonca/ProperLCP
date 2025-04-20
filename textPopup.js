//textPopup.js

function createTextPopup(message) {
    // Remove existing popup if it exists
    let existingPopup = document.getElementById("custom-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.classList.add("edit-popup");

    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    popup.innerHTML = `
        <div style="
            background-color: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            width: 350px;
            max-width: 90%;
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
        ">
            <p style="
                font-size: 18px;
                margin-bottom: 20px;
                color: #333;
            ">${message}</p>

            <button id="textPopup_closePopup" style="
                background-color: #1DB954;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            ">OK</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listener for closing popup
    document.getElementById("textPopup_closePopup").addEventListener("click", () => {
        popup.remove();
    });
}

function createConfirmPopup(message, callback) {
    // Remove existing popup if it exists
    let existingPopup = document.getElementById("custom-confirm-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "custom-confirm-popup";
    popup.classList.add("confirm-popup");

    popup.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    popup.innerHTML = `
        <div style="
            background-color: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            width: 350px;
            max-width: 90%;
            text-align: center;
            font-family: 'Segoe UI', sans-serif;
        ">
            <p style="
                font-size: 18px;
                margin-bottom: 20px;
                color: #333;
            ">${message}</p>

            <button id="confirmPopup_okButton" style="
                background-color: #1DB954;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                margin-right: 15px;
            ">OK</button>

            <button id="confirmPopup_cancelButton" style="
                background-color: #f44336;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            ">Cancel</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listeners for both buttons
    document.getElementById("confirmPopup_okButton").addEventListener("click", () => {
        popup.remove(); // Close the popup
        callback(true); // Call the callback with 'true' (OK clicked)
    });

    document.getElementById("confirmPopup_cancelButton").addEventListener("click", () => {
        popup.remove(); // Close the popup
        callback(false); // Call the callback with 'false' (Cancel clicked)
    });
}




module.exports = { createTextPopup};
module.exports = { createConfirmPopup};