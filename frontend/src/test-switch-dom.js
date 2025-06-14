// Quick test to inspect react-switch DOM structure
// Run this in your browser console when viewing the dashboard

function inspectSwitchDOM() {
    console.log('=== REACT-SWITCH DOM STRUCTURE ANALYSIS ===');
    
    // Find all switch elements
    const switches = document.querySelectorAll('.switch');
    console.log(`Found ${switches.length} switches`);
    
    switches.forEach((switchEl, index) => {
        console.log(`\n--- Switch ${index + 1} ---`);
        console.log('Switch element:', switchEl);
        console.log('Switch HTML:', switchEl.outerHTML);
        
        // Check all child elements
        const children = switchEl.querySelectorAll('*');
        console.log('All child elements:', children);
        
        children.forEach((child, childIndex) => {
            console.log(`Child ${childIndex}:`, {
                tagName: child.tagName,
                className: child.className,
                id: child.id,
                ariaChecked: child.getAttribute('aria-checked'),
                role: child.getAttribute('role'),
                type: child.type
            });
        });
        
        // Look for specific elements
        const input = switchEl.querySelector('input');
        const handle = switchEl.querySelector('.react-switch-handle');
        const bg = switchEl.querySelector('.react-switch-bg');
        
        console.log('Input element:', input);
        console.log('Handle element:', handle);
        console.log('Background element:', bg);
        
        // Check if input has aria-checked
        if (input) {
            console.log('Input aria-checked:', input.getAttribute('aria-checked'));
            console.log('Input checked:', input.checked);
        }
    });
    
    // Look for any elements with react-switch classes
    const reactSwitchElements = document.querySelectorAll('[class*="react-switch"]');
    console.log('\nAll react-switch elements:', reactSwitchElements);
    
    reactSwitchElements.forEach((el, index) => {
        console.log(`React-switch element ${index}:`, {
            tagName: el.tagName,
            className: el.className,
            parentClassName: el.parentElement?.className
        });
    });
}

// Auto-run inspection
inspectSwitchDOM();

// Export for manual use
window.inspectSwitchDOM = inspectSwitchDOM;