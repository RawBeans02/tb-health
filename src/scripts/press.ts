// The pressed state on iPhones (step 15.3): iOS Safari applies :active to what a finger is on
// only while the page has a touchstart listener, so global.css's pressed state would show
// for a mouse but never for a finger. This one does nothing, and is passive, so it never
// holds up a scroll.
document.addEventListener('touchstart', () => {}, { passive: true });
