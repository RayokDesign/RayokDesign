let audioPlaying = null;
let autoPlayStatus = false;
let autoPlayCount = 0;
let autoPlayTimer = null;
const audioList = document.getElementsByTagName('audio');


function startPlay(ev,autoSwitch){
    if(!autoSwitch){
        clearTimeout(autoPlayTimer);
        autoPlayCount = 0;
        autoPlayStatus = false;
    }
    if(audioPlaying){
        audioPlaying.pause();
        audioPlaying.currentTime = 0;
        endPlay(audioPlaying);
    }
    const btn=ev;
    const audio=ev.previousElementSibling;
    if(btn.classList.contains('active')){
        btn.classList.remove('bi-play-fill');
        btn.classList.add('bi-stop-fill');
        audioPlaying = audio;
        audio.play();
    }
}

function endPlay(ev,stop){
    const btn=ev.nextElementSibling;
    btn.classList.remove('bi-stop-fill');
    btn.classList.add('bi-play-fill');
    btn.classList.remove('active');
    audioPlaying = null;
    if(autoPlayCount < audioList.length-1 && autoPlayStatus == true && !stop){
        autoPlayCount++;
        autoPlayTimer = setTimeout(function(){
            audioList[autoPlayCount].nextElementSibling.classList.add('active');
            startPlay(audioList[autoPlayCount].nextElementSibling,autoPlayStatus);
        },200);
    }else{
        autoPlayCount = 0;
        autoPlayStatus = false;
        clearTimeout(autoPlayTimer);
    }
}

function autoPlay(){
    if(audioPlaying){
        if(audioPlaying == audioList[0]){
            audioPlaying = null;
        }else{
            audioPlaying.pause();
            audioPlaying.currentTime = 0;
            endPlay(audioPlaying,true);
        }
    }
    autoPlayStatus=autoPlayStatus?false:true;
    if(autoPlayStatus){
        audioList[0].nextElementSibling.classList.add('active');
        startPlay(audioList[0].nextElementSibling,autoPlayStatus);
    }
}
//old funtion
function playBtn(ev){
    if(audioPlaying){
        audioPlaying.pause();
        audioPlaying.currentTime = 0;
        endPlay(audioPlaying);
    }
    const btn=ev;
    const audio=ev.previousElementSibling;
    if(btn.classList.contains('active')){
        btn.classList.remove('bi-play-fill');
        btn.classList.add('bi-stop-fill');
        audioPlaying = audio;
        audio.play();
    }
}

function endedPlay(ev){
    const btn=ev.nextElementSibling;
    btn.classList.remove('bi-stop-fill');
    btn.classList.add('bi-play-fill');
    btn.classList.remove('active');
    audioPlaying = null;
}
//old funtion

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