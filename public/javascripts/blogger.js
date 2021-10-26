var audioActive = null;
function playBtn(ev){
    const btn=ev;
    const audio=ev.previousElementSibling;
    if(btn.classList.contains('active')){
        btn.classList.remove('bi-play-fill');
        btn.classList.add('bi-pause-fill');
        console.log(audioActive);
        if(audioActive){
            audioActive.pause();
            audioActive.currentTime = 0;
            endedPlay(audioActive);
        }
        audioActive = audio;
        audio.play();
    }else{
        btn.classList.add('bi-play-fill');
        btn.classList.remove('bi-pause-fill');
        audio.pause();
        audioActive = null;
    }
}

function endedPlay(ev){
    const btn=ev.nextElementSibling;
    btn.classList.remove('bi-pause-fill');
    btn.classList.add('bi-play-fill');
    btn.classList.remove('active');
    audioActive = null;
}

function switchWord(ev){
    const th=ev;
    const tw=th.nextElementSibling;
    const audio1=tw.nextElementSibling;
    const audio2=audio1.nextElementSibling

    th.children[0].classList.toggle('d-none');
    th.children[1].classList.toggle('d-none');
    tw.children[0].classList.toggle('d-none');
    tw.children[1].classList.toggle('d-none');
    audio1.classList.toggle('d-none');
    audio2.classList.toggle('d-none');
}

function switchWord2(ev){
    const tw=ev;
    const th=tw.previousElementSibling;
    const audio1=tw.nextElementSibling;
    const audio2=audio1.nextElementSibling

    th.children[0].classList.toggle('d-none');
    th.children[1].classList.toggle('d-none');
    tw.children[0].classList.toggle('d-none');
    tw.children[1].classList.toggle('d-none');
    audio1.classList.toggle('d-none');
    audio2.classList.toggle('d-none');
}