'use strict';

import initAuth from './initAuth';
import uploadSlideURL from './updateSlideURL';

initAuth();
uploadSlideURL();


const slierElement = document.getElementById('carouselExampleIndicators');

document.querySelector('.nav-link[href="/"]').classList.add('active');