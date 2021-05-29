import QRReader from './vendor/qrscan.js';
import { snackbar } from './snackbar.js';
import { isURL, hasProtocolInUrl } from './utils';

import '../css/styles.css';

async function handleSubmit(event) {
  var textBoxEle = document.querySelector('#result');
  var scanningEle = document.querySelector('.custom-scanner');
  var dialogOpenBtnElement = document.querySelector('.app__dialog-open');
  var dialogElement = document.querySelector('.app__dialog');
  var dialogOverlayElement = document.querySelector('.app__dialog-overlay');
  event.preventDefault();
  const data = new FormData(event.target);
  const name = data.get('name');
  const address = data.get('address');
  const instance = data.get('instance');
  const position_id = data.get('position');
  const body = JSON.stringify({ name, address, instance, position_id });
  console.log(body);
  let res = await fetch('http://localhost:8000/api/guest/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body
  })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.error('Error:', error);
    });

  let msg = 'Login gagal';

  if (res.success) {
    msg = res.success;
  }

  if (!msg) {
    textBoxEle.value = 'Anda belum terdaftar atau terverifikasi';
  } else {
    textBoxEle.value = msg;
  }
  textBoxEle.select();
  scanningEle.style.display = 'none';
  if (isURL(result)) {
    dialogOpenBtnElement.style.display = 'inline-block';
  }
  dialogElement.classList.remove('app__dialog--hide');
  dialogOverlayElement.classList.remove('app__dialog--hide');
}
const form = document.querySelector('form');
form.addEventListener('submit', handleSubmit);

//If service worker is installed, show offline usage notification
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => {
        console.log('SW registered: ', reg);
        if (!localStorage.getItem('offline')) {
          localStorage.setItem('offline', true);
          snackbar.show('App is ready for offline usage.', 5000);
        }
      })
      .catch(regError => {
        console.log('SW registration failed: ', regError);
      });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  //To check the device and add iOS support
  window.iOS = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
  window.isMediaStreamAPISupported = navigator && navigator.mediaDevices && 'enumerateDevices' in navigator.mediaDevices;
  window.noCameraPermission = false;

  getGuest().then(msg => {
    let table ="";
    msg.forEach(element => {
        table += `<tr><td>${element.name}</td><td>${element.entry_time}</td></tr>`;
    });
    document.getElementById("data_visitor").innerHTML = table;
  });

  var copiedText = null;
  var frame = null;
  var selectPhotoBtn = document.querySelector('.app__select-photos');
  var dialogElement = document.querySelector('.app__dialog');
  var dialogOverlayElement = document.querySelector('.app__dialog-overlay');
  var dialogOpenBtnElement = document.querySelector('.app__dialog-open');
  var dialogCloseBtnElement = document.querySelector('.app__dialog-close');
  var scanningEle = document.querySelector('.custom-scanner');
  var textBoxEle = document.querySelector('#result');
  var helpTextEle = document.querySelector('.app__help-text');
  var infoSvg = document.querySelector('.app__header-icon svg');
  var videoElement = document.querySelector('video');
  window.appOverlay = document.querySelector('.app__overlay');

  //Initializing qr scanner
  window.addEventListener('load', event => {
    QRReader.init(); //To initialize QR Scanner
    // Set camera overlay size
    setTimeout(() => {
      setCameraOverlay();
      if (window.isMediaStreamAPISupported) {
        scan();
      }
    }, 1000);

    // To support other browsers who dont have mediaStreamAPI
    selectFromPhoto();
  });

  function setCameraOverlay() {
    window.appOverlay.style.borderStyle = 'solid';
  }

  function createFrame() {
    frame = document.createElement('img');
    frame.src = '';
    frame.id = 'frame';
  }

  //Dialog close btn event
  dialogCloseBtnElement.addEventListener('click', hideDialog, false);
  dialogOpenBtnElement.addEventListener('click', openInBrowser, false);

  //To open result in browser
  function openInBrowser() {
    console.log('Result: ', copiedText);

    if (!hasProtocolInUrl(copiedText)) {
      copiedText = `//${copiedText}`;
    }

    window.open(copiedText, '_blank', 'toolbar=0,location=0,menubar=0');
    copiedText = null;
    hideDialog();
  }

  //Scan
  function scan(forSelectedPhotos = false) {
    if (window.isMediaStreamAPISupported && !window.noCameraPermission) {
      scanningEle.style.display = 'block';
    }

    if (forSelectedPhotos) {
      scanningEle.style.display = 'block';
    }

    QRReader.scan(async result => {
      copiedText = result;
      let msg = await resToJson(result);
      QRReader.init();
      if (!msg) {
        textBoxEle.value = 'Anda belum terdaftar atau terverifikasi';
      } else {
        textBoxEle.value = msg;
      }
      textBoxEle.select();
      scanningEle.style.display = 'none';
      if (isURL(result)) {
        dialogOpenBtnElement.style.display = 'inline-block';
      }
      dialogElement.classList.remove('app__dialog--hide');
      dialogOverlayElement.classList.remove('app__dialog--hide');
    }, forSelectedPhotos);
  }

  //Hide dialog
  function hideDialog() {
    copiedText = null;
    textBoxEle.value = '';

    if (!window.isMediaStreamAPISupported) {
      frame.src = '';
      frame.className = '';
    }

    dialogElement.classList.add('app__dialog--hide');
    dialogOverlayElement.classList.add('app__dialog--hide');
    location.reload(true);
  }

  function selectFromPhoto() {
    //Creating the camera element
    var camera = document.createElement('input');
    camera.setAttribute('type', 'file');
    camera.setAttribute('capture', 'camera');
    camera.id = 'camera';
    window.appOverlay.style.borderStyle = '';
    selectPhotoBtn.style.display = 'block';
    createFrame();

    //Add the camera and img element to DOM
    var pageContentElement = document.querySelector('.app__layout-content');
    pageContentElement.appendChild(camera);
    pageContentElement.appendChild(frame);

    //Click of camera fab icon
    selectPhotoBtn.addEventListener('click', () => {
      scanningEle.style.display = 'none';
      document.querySelector('#camera').click();
    });

    //On camera change
    camera.addEventListener('change', event => {
      if (event.target && event.target.files.length > 0) {
        frame.className = 'app__overlay';
        frame.src = URL.createObjectURL(event.target.files[0]);
        if (!window.noCameraPermission) scanningEle.style.display = 'block';
        window.appOverlay.style.borderColor = 'rgb(62, 78, 184)';
        scan(true);
      }
    });
  }
});

async function resToJson(scanRes) {
  let objReq = new Object();
  objReq.no = scanRes.substring(0, 5);
  objReq.identityNo = scanRes.substring(5);
  let jsonString = JSON.stringify(objReq);

  let res = await fetch('http://localhost:8000/api/visitor/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: jsonString
  })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.error('Error:', error);
    });

  if (res.success) {
    return res.success.name;
  } else {
    return false;
  }
}

async function getGuest() {
  let res = await fetch('http://localhost:8000/api/visitors/checkwho', {
    method: 'GET'
  })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.error('Error:', error);
    });

  if (res.success) {
    return res.success;
  } else {
    return false;
  }
}
