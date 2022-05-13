window.onload = function(){
    const highlights = document.querySelectorAll('.highlight');
    for (let i = 0; i < highlights.length; i++){
        highlights[i].classList.add('enable');
    }
    console.log(highlights);
}