/**
 * @jest-environment jsdom
 */

import Array from './src/simulator/src/arrayHelpers.js';
import 'codemirror/addon/hint/show-hint.js';

global.window = window;
window.Jquery = require('jquery');
window.$ = require('jquery');
global.jQuery = require('jquery');
// global.inputSpinner = require('bootstrap-input-spinner/src/inputSpinner.js');

window.restrictedElements = [];
window.userSignedIn = true;
window.embed = false;
window.Array = Array;

const fs = require('fs');
const path = require('path');

// const html = fs.readFileSync(path.resolve(`${__dirname}/src/views/simulator/edit.html.erb`), 'utf8');
// document.documentElement.innerHTML = html.toString();