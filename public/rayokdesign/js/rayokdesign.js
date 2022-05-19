gsap.registerPlugin(ScrollTrigger);

function scrollArrow(){
    let tl = gsap.timeline({repeat: -1});

    tl.to(".scroll-arrow", {duration: 0.8, delay: 2, ease: "power4.in", y: 110})
    .to(".scroll-arrow", {duration: 0, y:-110})
    .to(".scroll-arrow", {duration: 0.8, ease: "power4.out", y:0});
}

scrollArrow();


gsap.from(".headline-wrap", {duration: 0.8, ease: "power1.out", opacity: 0, y: 60 });
gsap.from(".hero-paragraph, .button-wrapper", {duration: 0.8, delay: 0.2, ease: "power1.out", opacity: 0, y: 60 });
gsap.from(".highlight", {duration: 0.6, delay: 0.8, transformOrigin: "0% 50%", scaleX: 0, stagger: 0.6})

gsap.set(".what-i-do, .what-to-work", {
    opacity: 0,
    y: 60
})
gsap.to(".what-i-do, .what-to-work", {
    scrollTrigger: {
        trigger: ".what-i-do, .what-to-work",
        start: "top 85%",
        toggleActions: "restart pause reverse pause",
    },
    duration: 0.8,
    ease: "power1.out",
    opacity: 1,
    y: 0
});

function mouseInOut(e, tl){
    e.addEventListener('mouseenter', () => {
        tl.play();
    });
    e.addEventListener('mouseleave', () => {
        tl.reverse();
    })
}

gsap.utils.toArray(".nav-link").forEach(e => {
    let tl = gsap.timeline({ paused: true });

    tl.to(e, {
        duration: 0.2,
        boxShadow: "0px -25px #ffe872 inset",
    });

    mouseInOut(e, tl)
})

gsap.set(".button-border", {x: 11, y: 11});
gsap.set(".button-border button", {x: -8, y: -8});
gsap.utils.toArray(".button-border button").forEach(e => {
    let tl = gsap.timeline({ paused: true });
    
    tl.to(e, {
        duration: 0.2,
        x: 0,
        y: 0
    });

    mouseInOut(e, tl);
});

gsap.utils.toArray(".mockup-column").forEach(e => {
    let mockupArrow = e.querySelector('.mockup-arrow'),
    mockupHoverText = e.querySelector('.mockup-hover-text'),
    mockupImg = e.querySelector('.mockup-img');
    tl = gsap.timeline({  paused: true });
    
    gsap.set(mockupArrow, {
        x: -35
    })
    gsap.set(mockupHoverText, {
        opacity: 0,
        x: -9
    })

    tl.to(mockupHoverText, {
        duration: 0.1,
        opacity: 1,
        x: 0
    })
    .to(mockupArrow, {
        duration: 0.2,
        opacity: 1,
        x: 0
    }, 0.1)
    .to(mockupImg, {
        duration: 0.3,
        x: 8,
        y: -8
    }, 0);

    mouseInOut(e, tl);
})
