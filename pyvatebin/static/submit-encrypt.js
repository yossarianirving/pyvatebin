function subenc() {
  var promiseKey = crypto.subtle.generateKey({name: "AES-GCM", length: 256}, true, ['encrypt']);
  console.log(promiseKey);
  promiseKey.then(function(value) {
    console.log(value);
    encryptSubmit(value)
  });
}

function encryptSubmit(key) {
    // create key and iv
    var forme = document.getElementById('submission');
    document.getElementById("submit").style.display = "none";
    // storing initialization vector as 'nonce'. yeah I know
    var pasteToEncrypt = forme.elements["pasteText"].value;
    var pasteUtf = new TextEncoder().encode(pasteToEncrypt);
    var iv = crypto.getRandomValues(new Uint8Array(12));
    console.log(iv);
    var nonce = JSON.stringify(iv);
    document.getElementById('nonce').value = nonce;
    var algorithm = { name: 'AES-GCM', iv: iv};
    // var encrypted = crypto.subtle.encrypt(algorithm, key, pasteUtf);
    console.log(forme.elements["burnAfterRead"].data)
    var jdata = {"nonce": iv, 
        "burnAfterRead": forme.elements["burnAfterRead"].checked,
        "expire_time": parseInt(forme.elements["selfDestructTime"].value),
        "pasteType": forme.elements["pasteType"].value
      };// json data that will be used in ajax
    // encrypting the text
    crypto.subtle.encrypt(algorithm, key, pasteUtf).then(function(res) {
      jdata.pasteText = new Uint8Array(res);
      console.log(jdata.pasteText);
      console.log(res);
      crypto.subtle.exportKey('jwk', key).then(function(x){
        console.log(x);
        //decrypt(jdata.pasteText, x.k, jdata.nonce);
        concatBufSHA(pasteUtf, x.k).then(h => {
          console.log(h);
          jdata.hash = h;
          sendPaste(jdata, x.k);
        });
      });
    });
}

function sendPaste(jdata, key) {
  console.log(JSON.stringify(jdata));
  var forme = document.getElementById('submission');
  var csrf_token = forme.elements["csrf_token"].value;
  fetch('/submit', {
    method: 'post',
    body: JSON.stringify(jdata),
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      'X-CSRFToken': csrf_token,
    }
  }).then(response => {
    response.json().then(jres => {
      document.getElementById('text').readOnly = true;
      link = document.getElementById('link');
      link.href = jres['id']+"#"+key;
      link.innerHTML = link.href;
      link.style.display = "block";
    })
  }).catch(error => console.error(error));
}


async function decrypt(encryptedPaste, jwkey, iv, pid, bar, paste_type) {
  var key = new Object();
  var jsonData = JSON.parse(encryptedPaste);
  var data = new Uint8Array(Object.values(jsonData));
  // creates JSON WebKey Object
  key.alg = "A256GCM";
  key.k = jwkey;
  key.ext = true;
  key.key_ops = ['encrypt', 'decrypt'];
  key.kty = "oct";
  console.log("Decrypting");
  iv = new Uint8Array(Object.values(JSON.parse(iv)));
  var alg = { name: 'AES-GCM', iv: iv};
  key = await crypto.subtle.importKey("jwk", key, alg, true, ['encrypt', 'decrypt']);
  await decryptData(alg, key, data, pid, bar, jwkey);
  if (paste_type == "md") {
    var prevPaste = document.getElementById('previewPaste');
    var text = document.getElementById('decpaste');
    text.style.display = "none";
    converter = new showdown.Converter({tables: true});
    prevPaste.innerHTML = converter.makeHtml(text.innerText);
    prevPaste.style.display = "block";
    console.log("Showing Markdown");
    // sets paste type to markdown
    document.getElementById('pasteType').value = 'md';
  }
}

async function decryptData(alg, key, data, pid, bar, jwkey) {
  var pastebuff = crypto.subtle.decrypt(alg, key, data);
  await pastebuff.then(function(decryptedPaste){
    pastetxt = new TextDecoder().decode(decryptedPaste);
    // this is to prevent XSS and html from rendering
    var decpaste = document.getElementById('decpaste');
    var escapedPt = document.createTextNode(pastetxt);
    decpaste.appendChild(escapedPt);
    download(pastetxt);
    console.log("Decrypted");
    // if paste is to be burned after reading
    if (bar == "1") {
      concatBufSHA(new TextEncoder().encode(pastetxt), jwkey).then(h => {
        burnPaste(pid, h);
      })
    }
  });
}

function burnPaste(pid, pHash) {
  var forme = document.getElementById('submission');
  var csrf_token = forme.elements["csrf_token"].value;
  fetch('/delete', {
    method: 'post',
    body: JSON.stringify({"pasteid": pid, "hash": pHash}),
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      'X-CSRFToken': csrf_token,
    }
  }).then(response => {
    response.json().then(jres => {
      console.log(jres)
    })
  }).catch(error => console.error(error));
}

function clone() {
    document.getElementById('submission').elements['pasteText'].innerHTML =
        document.getElementById('decpaste').innerHTML;
    document.getElementById('decpaste').style.display = "none";
    document.getElementById('text').style.display = "block";
    document.getElementById('clone-form').style.display = "inline";
    document.getElementById('clone').style.display = "none";
    enableTab()
}

function download(pastetext) {
    var link = document.getElementById('dwnld');
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(pastetext));
    link.setAttribute('dwnld', "paste.txt");
}

// joins the paste text and key, then returns its hash
async function concatBufSHA(buf1, buf2acii) {
  var buf2 = new TextEncoder().encode(buf2acii);
  console.log(buf1.length+buf2.length);
  var t = new Uint8Array(buf1.length+buf2.length);
  console.log(t);
  t.set(new Uint8Array(buf1), 0);
  t.set(new Uint8Array(buf2), buf1.byteLength);
  const hBuf = await crypto.subtle.digest('SHA-256', t);
  // convert ArrayBuffer to Array
  const hAry = Array.from(new Uint8Array(hBuf));
  // convert bytes to hex string
  const hash = hAry.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return hash;
}

function enableTab() {
  var txtArea = document.getElementById('text');
  txtArea.onkeydown = function(e) {
      if (e.keyCode === 9) { // tab was pressed
          var val = this.value;
          var start = this.selectionStart;
          var end = this.selectionEnd;
          this.value = val.substring(0, start) + '\t' + val.substring(end);
          this.selectionStart = this.selectionEnd = start + 1;
          return false;
      }
  };
}

function toEdit() {
  // display the text entry
  document.getElementById('text').style.display = "block";
  document.getElementById('editor').classList = ['btn-active button'];
  document.getElementById('preview').classList = ['button'];
  console.log("Editing");
}

function toPreview() {
  var prevPaste = document.getElementById('previewPaste');
  var text = document.getElementById('text');
  var pasteType = document.getElementById('pasteType').value;
  text.style.display = "none";
  // removes the preview's TextNode if it exists
  if (prevPaste.firstChild != null) {
    prevPaste.removeChild(prevPaste.firstChild);
  }
  // fixes the markdown not being removed
  prevPaste.innerHTML = "";
  document.getElementById('editor').classList = ['button'];
  document.getElementById('preview').classList = ['btn-active button'];
  // if the format is markdown
  if (pasteType == "md") {
    converter = new showdown.Converter({tables: true});
    prevPaste.innerHTML = converter.makeHtml(text.value);
  }
  // if format is plain text
  else if (pasteType == 'txt') {
    var escapedPrev = document.createTextNode(text.value);
    prevPaste.appendChild(escapedPrev);
  }
  prevPaste.style.display = "block";
  console.log("previewing");
}