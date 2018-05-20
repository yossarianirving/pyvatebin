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
        "expire_time": parseInt(forme.elements["selfDestructTime"].value)
      };// json data that will be used in ajax
    // encrypting the text
    crypto.subtle.encrypt(algorithm, key, pasteUtf).then(function(res) {
      jdata.pasteText = new Uint8Array(res);
      console.log(jdata.pasteText);
      console.log(res);
      crypto.subtle.exportKey('jwk', key).then(function(x){
        console.log(x);
        //decrypt(jdata.pasteText, x.k, jdata.nonce);
        sendPaste(jdata, x.k);
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


async function decrypt(encryptedPaste, jwkey, iv) {
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
    await decryptData(alg, key, data);

}

async function decryptData(alg, key, data) {
  var pastebuff = crypto.subtle.decrypt(alg, key, data);
  pastebuff.then(function(decryptedPaste){
    pastetxt = new TextDecoder().decode(decryptedPaste);
    // this is to prevent XSS and html from rendering
    var decpaste = document.getElementById('decpaste');
    var escapedPt = document.createTextNode(pastetxt);
    decpaste.appendChild(escapedPt);
    download(pastetxt);
  });
}

function clone() {
    document.getElementById('submission').elements['pasteText'].innerHTML =
        document.getElementById('decpaste').innerHTML;
    document.getElementById('decpaste').style.display = "none";
    document.getElementById('text').style.display = "block";
    document.getElementById('clone-form').style.display = "inline";
    document.getElementById('clone').style.display = "none";
}

function download(pastetext) {
    var link = document.getElementById('dwnld');
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(pastetext));
    link.setAttribute('dwnld', "paste.txt");
}
