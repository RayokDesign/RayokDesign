let audioActive = null;
let timerAutoPlay = null;
let audioList = document.getElementsByTagName('audio');
let autoNum = 0;
let autoPlayStatus = false;

function playBtn(ev,auto){
    if(auto){
        autoPlayStatus = auto;
    }else{
        clearTimeout(timerAutoPlay);
        autoPlayStatus = false;
        autoNum = 0;
    }
    const btn=ev;
    const audio=ev.previousElementSibling;
    if(btn.classList.contains('active')){
        btn.classList.remove('bi-play-fill');
        btn.classList.add('bi-pause-fill');
        if(audioActive){
            audioActive.pause();
            audioActive.currentTime = 0;
            endedPlay(audioActive,true);
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
function autoPlay(){
    if(audioActive){
        audioActive.pause();
        audioActive.currentTime = 0;
        endedPlay(audioActive,true);
    }
    timerAutoPlay = setTimeout(function(){
        if (autoNum<audioList.length){
            audioList[autoNum].nextElementSibling.classList.add('active');
            playBtn(audioList[autoNum].nextElementSibling,true);
        }else{
            autoNum=0;
            autoPlayStatus = false;
        }
    },200);
}

function endedPlay(ev,stop){
    const btn=ev.nextElementSibling;
    btn.classList.remove('bi-pause-fill');
    btn.classList.add('bi-play-fill');
    btn.classList.remove('active');
    audioActive = null;
    if (autoPlayStatus && !stop){
        autoNum++;
        autoPlay();
    }else{
        autoNum=0;
    }
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