const { ipcRenderer } = require('electron');

// Function to load the Notes UI
function loadUserNotes(mainContent, billPanel) {
    mainContent.style.marginLeft = "200px";
    mainContent.style.marginRight = "0px";
    billPanel.style.display = 'none';
    
    // Load existing notes from storage
    let notes = JSON.parse(localStorage.getItem('userNotes') || '[]');
    
    mainContent.innerHTML = `
        <div class="notes-container">
            <div class="notes-header">
                <h1>Notes</h1>
                <button id="addNoteBtn" class="add-note-btn">+ New Note</button>
            </div>
            <div id="notesList" class="notes-list"></div>
        </div>
        <style>
            .notes-container {
                padding: 20px;
            }
            .notes-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
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
            }
            .notes-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
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
        </style>
    `;

    const notesList = document.getElementById('notesList');
    const addNoteBtn = document.getElementById('addNoteBtn');

    // Render existing notes
    renderNotes(notes, notesList);

    // Add new note button click handler
    addNoteBtn.addEventListener('click', () => {
        if (notes.length >= 10) {
            alert('Maximum limit of 10 notes reached!');
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
        const noteElement = document.createElement('textarea');
        noteElement.id = `note-${note.id}`;
        noteElement.className = 'note-box';
        noteElement.value = note.content || '';
        noteElement.placeholder = 'Type your note here...';
        
        // Save on change with debounce
        let saveTimeout;
        noteElement.addEventListener('input', (e) => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const updatedNotes = JSON.parse(localStorage.getItem('userNotes') || '[]');
                const noteToUpdate = updatedNotes.find(n => n.id === note.id);
                if (noteToUpdate) {
                    noteToUpdate.content = e.target.value;
                    localStorage.setItem('userNotes', JSON.stringify(updatedNotes));
                }
            }, 500);
        });
        
        container.appendChild(noteElement);
    });
}

module.exports = { loadUserNotes };