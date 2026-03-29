/* ══════════════════════════════════════════════════════════
   THE PANG — Counter Animation (counter.js)
   IntersectionObserver based CountUp
   ══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const counters = document.querySelectorAll('.stats__number[data-target]');
    let hasAnimated = false;

    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 2000; // ms
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;

        const easeOutQuad = t => t * (2 - t);

        const update = () => {
            frame++;
            const progress = easeOutQuad(frame / totalFrames);
            const current = Math.round(target * progress);

            el.textContent = current.toLocaleString() + suffix;

            if (frame < totalFrames) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target.toLocaleString() + suffix;
            }
        };

        update();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                counters.forEach(counter => animateCounter(counter));
            }
        });
    }, {
        threshold: 0.5
    });

    if (counters.length > 0) {
        observer.observe(counters[0].closest('.stats'));
    }
});
