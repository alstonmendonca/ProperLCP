const { ipcRenderer } = require('electron');
const  {createTextPopup} = require("./textPopup");

// Function to load the Notes UI
function loadUserNotes(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
    
    // Load existing notes from storage
    let notes = JSON.parse(localStorage.getItem('userNotes') || []);
    
    mainContent.innerHTML = `
        <div class="notes-container">
            <div class="section-title">
                <h2>Notes</h2>
                <button id="addNoteBtn" class="add-note-btn">
                    <span class="plus-sign">+</span>
                </button>
            </div>
            <div id="notesList" class="notes-list"></div>
        </div>
        <style>
            * {
                box-sizing: border-box;
            }
            .notes-container {
                width: 100%;
                overflow-x: hidden;
            }
            .notes-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-right: 10px;
            }
            .add-note-btn {
                font-size: 24px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background-color: #1DB954;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                position: relative;
            }
            .plus-sign {
                position: relative;
                top: -1px;
            }
            .notes-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
                width: 100%;
            }
            .note-container {
                position: relative;
                width: 100%;
            }
            .note-box {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                min-height: 100px;
                resize: vertical;
                width: 100%;
                font-family: inherit;
                font-size: 14px;
            }
            .delete-note-btn {
                position: absolute;
                right: 10px;
                top: 10px;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                border: none;
                background-color: #ff4444;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                padding: 0;
            }
            .delete-note-btn:hover {
                background-color: #cc0000;
            }
            .confirmation-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                text-align: center;
            }
            .confirmation-dialog p {
                margin-bottom: 20px;
            }
            .confirmation-dialog button {
                margin: 0 10px;
                padding: 5px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .confirm-btn {
                background-color: #ff4444;
                color: white;
            }
            .cancel-btn {
                background-color: #ccc;
            }
        </style>
    `;

    const notesList = document.getElementById('notesList');
    const addNoteBtn = document.getElementById('addNoteBtn');

    // Render existing notes
    renderNotes(notes, notesList);

    // Add new note button click handler
    addNoteBtn.addEventListener('click', () => {
        if (notes.length >= 10) {
            createTextPopup('Maximum limit of 10 notes reached!');
            return;
        }
        
        notes.push({ id: Date.now(), content: '' });
        localStorage.setItem('userNotes', JSON.stringify(notes));
        renderNotes(notes, notesList);
        
        // Focus the new note
        const newNote = document.getElementById(`note-${notes[notes.length-1].id}`);
        if (newNote) newNote.focus();
    });
}

function renderNotes(notes, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    notes.forEach(note => {
        const noteContainer = document.createElement('div');
        noteContainer.className = 'note-container';
        
        const noteElement = document.createElement('textarea');
        noteElement.id = `note-${note.id}`;
        noteElement.className = 'note-box';
        noteElement.value = note.content || '';
        noteElement.placeholder = 'Type your note here...';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-note-btn';
        deleteBtn.innerHTML = '−'; // Minus sign
        deleteBtn.title = 'Delete this note';
        
        // Save on change with debounce
        let saveTimeout;
        noteElement.addEventListener('input', (e) => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const updatedNotes = JSON.parse(localStorage.getItem('userNotes') || []);
                const noteToUpdate = updatedNotes.find(n => n.id === note.id);
                if (noteToUpdate) {
                    noteToUpdate.content = e.target.value;
                    localStorage.setItem('userNotes', JSON.stringify(updatedNotes));
                }
            }, 500);
        });
        
        // Delete button click handler
        deleteBtn.addEventListener('click', () => {
            showDeleteConfirmation(note.id, notes, container);
        });
        
        noteContainer.appendChild(noteElement);
        noteContainer.appendChild(deleteBtn);
        container.appendChild(noteContainer);
    });
}

function showDeleteConfirmation(noteId, notes, container) {
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
        <p>Are you sure you want to delete this note?</p>
        <button class="confirm-btn">Delete</button>
        <button class="cancel-btn">Cancel</button>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('.confirm-btn').addEventListener('click', () => {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        localStorage.setItem('userNotes', JSON.stringify(updatedNotes));
        renderNotes(updatedNotes, container);
        dialog.remove();
    });
    
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
        dialog.remove();
    });
}

module.exports = { loadUserNotes };