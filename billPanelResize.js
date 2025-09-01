// Bill Panel Resize Functionality
class BillPanelResize {
    constructor() {
        this.billPanel = document.getElementById('bill-panel');
        this.mainContent = document.getElementById('main-content');
        this.isResizing = false;
        this.startX = 0;
        this.startWidth = 0;
        
        this.init();
    }

    init() {
        // Create resize handle
        this.createResizeHandle();
        
        // Load saved width from localStorage
        this.loadSavedWidth();
        
        // Add resize observer to update main content margin
        this.setupResizeObserver();
    }

    createResizeHandle() {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'bill-resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 8px;
            cursor: col-resize;
            background: transparent;
            z-index: 1001;
            user-select: none;
        `;

        // Add hover effect
        resizeHandle.addEventListener('mouseenter', () => {
            resizeHandle.style.background = 'rgba(13, 59, 102, 0.2)';
        });

        resizeHandle.addEventListener('mouseleave', () => {
            if (!this.isResizing) {
                resizeHandle.style.background = 'transparent';
            }
        });

        // Add resize functionality
        resizeHandle.addEventListener('mousedown', (e) => {
            this.startResize(e);
        });

        this.billPanel.appendChild(resizeHandle);
        this.resizeHandle = resizeHandle;
    }

    startResize(e) {
        this.isResizing = true;
        this.startX = e.clientX;
        this.startWidth = parseInt(document.defaultView.getComputedStyle(this.billPanel).width, 10);
        
        document.addEventListener('mousemove', this.handleResize.bind(this));
        document.addEventListener('mouseup', this.stopResize.bind(this));
        
        // Add visual feedback
        document.body.style.cursor = 'col-resize';
        this.resizeHandle.style.background = 'rgba(13, 59, 102, 0.4)';
        
        // Prevent text selection during resize
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    }

    handleResize(e) {
        if (!this.isResizing) return;
        
        const dx = this.startX - e.clientX;
        const newWidth = this.startWidth + dx;
        
        // Apply constraints
        const minWidth = 300;
        const maxWidth = 800;
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        
        this.billPanel.style.width = constrainedWidth + 'px';
        this.updateMainContentMargin(constrainedWidth);
    }

    stopResize() {
        this.isResizing = false;
        
        document.removeEventListener('mousemove', this.handleResize.bind(this));
        document.removeEventListener('mouseup', this.stopResize.bind(this));
        
        // Remove visual feedback
        document.body.style.cursor = '';
        this.resizeHandle.style.background = 'transparent';
        document.body.style.userSelect = '';
        
        // Save the new width
        this.saveWidth();
    }

    updateMainContentMargin(billPanelWidth) {
        if (this.mainContent && this.billPanel.style.display !== 'none') {
            this.mainContent.style.marginRight = (billPanelWidth + 20) + 'px';
        }
    }

    setupResizeObserver() {
        // Use ResizeObserver if available, otherwise fallback to MutationObserver
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const width = entry.contentRect.width;
                    this.updateMainContentMargin(width);
                }
            });
            resizeObserver.observe(this.billPanel);
        } else {
            // Fallback: periodically check for width changes
            setInterval(() => {
                if (this.billPanel.style.display !== 'none') {
                    const currentWidth = parseInt(this.billPanel.style.width || '600', 10);
                    this.updateMainContentMargin(currentWidth);
                }
            }, 100);
        }
    }

    saveWidth() {
        const currentWidth = this.billPanel.style.width;
        localStorage.setItem('billPanelWidth', currentWidth);
    }

    loadSavedWidth() {
        const savedWidth = localStorage.getItem('billPanelWidth');
        if (savedWidth) {
            this.billPanel.style.width = savedWidth;
            const width = parseInt(savedWidth, 10);
            this.updateMainContentMargin(width);
        }
    }

    // Method to show/hide bill panel and update margins accordingly
    toggleBillPanel(show) {
        if (show) {
            this.billPanel.style.display = 'flex';
            const width = parseInt(this.billPanel.style.width || '600', 10);
            this.updateMainContentMargin(width);
        } else {
            this.billPanel.style.display = 'none';
            this.mainContent.style.marginRight = '0px';
        }
    }
}

// Initialize bill panel resize functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.billPanelResize = new BillPanelResize();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BillPanelResize;
}
