'use strict';

import initAuth from './initAuth';
import updateSlideURL from './updateSlideURL';

initAuth();
updateSlideURL();

document.querySelector('.nav-link[href="/about"]').classList.add('active');