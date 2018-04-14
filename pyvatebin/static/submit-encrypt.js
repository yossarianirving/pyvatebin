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
    // storing initialization vector as 'nonce'. yeah I know
    var pasteToEncrypt = forme.elements["pasteText"].value;
    var pasteUtf = new TextEncoder().encode(pasteToEncrypt);
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var nonce = JSON.stringify(iv);
    document.getElementById('nonce').value = nonce;
    var algorithm = { name: 'AES-GCM', iv: iv};
    // var encrypted = crypto.subtle.encrypt(algorithm, key, pasteUtf);
    var jdata = {"nonce": nonce};// json data that will be used in ajax
    // encrypting the text
    crypto.subtle.encrypt(algorithm, key, pasteUtf).then(function(res) {
      jdata.pasteText = JSON.stringify(new Uint8Array(res));
      crypto.subtle.exportKey('jwk', key).then(function(x){
        sendPaste(jdata, x.k);
      });
    });


}

function sendPaste(jdata, key) {
  var forme = document.getElementById('submission');
    // inserts crsf token into headers of ajax request
    var csrf_token = forme.elements["csrf_token"].value;
    $.ajaxSetup({
       beforeSend: function(xhr, settings) {
           if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
               xhr.setRequestHeader("X-CSRFToken", csrf_token);
           }
       }
    });
    $.ajax({
    url: "/submit",
    type: "POST",
    dataType : 'json',
    contentType: "application/json",
    data: JSON.stringify(jdata),
    success: function (response) {
        console.log("We did it");
        console.log(response);
        $("#text").prop("disabled", true);
        $("#text").prop("rows", '')
        link = document.getElementById('link');
        link.innerHTML = window.location.href+response['id']+"#"+escape(key);
        link.href = response['id']+"#"+escape(jsonKey);
        link.style.display = "block";
    },
    error: function (result) {
        console.log(result);
        console.log("☹");
    }
    });
    // testenc(encrypted, key, iv);
    console.log("at end");
}


// I have no idea what this is.
// function getFormData($form){
//     var unindexed_array = $form.serializeArray();
//     var indexed_array = {};
//
//     $.map(unindexed_array, function(n, i){
//         indexed_array[n['name']] = n['value'];
//     });
//
//     return indexed_array;
// }

function decrypt(encryptedPaste, key, iv) {
    console.log("Decrypting");
    try {
        // decrypt
        // new Int8Array(Object.values(JSON.stringify(iv | paste...)))
    }
    catch (err) {
        console.log(err);
        return;
    }
    // document.getElementById('decpaste').innerHTML = pastetxt;
    $(document).ready(function(){
        $("#decpaste").text(pastetxt);
    });
    console.log(pastetxt);
    download(pastetxt);

}

function clone() {
    document.getElementById('submission').elements['pasteText'].innerHTML =
        document.getElementById('decpaste').innerHTML;

    document.getElementById('decpaste').style.display = "none";
    document.getElementById('text').style.display = "block";
    document.getElementById('clone').style.display = "none";
    document.getElementById('submit').style.display = "block";

}

function download(pastetext) {
    var link = document.getElementById('dwnld');
    console.log("please work");
    console.log(pastetext);
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(pastetext));

    link.setAttribute('dwnld', "paste.txt");
}
