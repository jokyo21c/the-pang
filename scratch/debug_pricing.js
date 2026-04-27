console.log('--- DEBUG INFO ---');
setTimeout(() => {
    const grid = document.getElementById('pricingGrid');
    const dots = document.querySelectorAll('.pricing-dot');
    const prev = document.querySelector('.pricing-nav--prev');
    const next = document.querySelector('.pricing-nav--next');
    console.log('Grid children:', grid ? grid.children.length : 'null');
    console.log('Dots length:', dots.length);
    console.log('Prev exists:', !!prev);
    console.log('Next exists:', !!next);
    console.log('Width:', window.innerWidth);
    console.log('isPricingInfiniteSetup:', grid ? Array.from(grid.children).some(c => c.classList.contains('clone')) : false);
}, 2000);
