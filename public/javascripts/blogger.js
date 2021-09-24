function playBtn(ev){
    const btn=ev;
    const audio=ev.previousElementSibling;
        btn.classList.toggle('active');
    if(btn.classList.contains('active')){
    btn.classList.remove('bi-play-fill');
    btn.classList.add('bi-pause-fill');
    audio.play();
    }else{
    btn.classList.add('bi-play-fill');
    btn.classList.remove('bi-pause-fill');
    audio.pause();
    }
}
function endedPlay(ev){
    const btn=ev.nextElementSibling;
    btn.classList.remove('bi-pause-fill');
    btn.classList.add('bi-play-fill');
    btn.classList.remove('active');
}