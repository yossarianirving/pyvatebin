function subenc() {
    // create key and iv
    var key = forge.random.getBytesSync(16);
    var iv =  forge.random.getBytesSync(16);
    var forme = document.getElementById('submission');
    // storing initialization vector as 'nonce'. yeah I know
    document.getElementById('nonce').value = iv;
    var jdata = {};// json data that will be used in ajax
    jdata.nonce = iv;
    // encrypting the text
    var pasteContent = forme.elements["pasteText"].value;
    var cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(
        pasteContent));
    cipher.finish();
    var encrypted = cipher.output;
    encrypted.push
    // stores encrypted text
    jdata.pasteText = JSON.stringify(encrypted);
    var csrf_token = forme.elements["csrf_token"].value;
    forme.elements["pasteText"].value = pasteContent;
    // inserts crsf token into headers of ajax request
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
        link.href = response['id']+"#"+escape(key);
        link.style.display = "block";
    },
    error: function (result) {
        console.log(result);
        console.log("☹");
    }
    });
    // testenc(encrypted, key, iv);
}

console.log("Check 1… 2… ☭");

function testenc(encrypted, key, iv){
    console.log("Decrypting...");
    var decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({iv: iv});
    decipher.update(encrypted);
    var result = decipher.finish();
    console.log(decipher.output.data);
}

function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}

function decrypt(encryptedPaste, key, iv) {
    console.log("Decrypting");
    try {
        var decipher = forge.cipher.createDecipher('AES-CBC', key);
        decipher.start({iv: iv});
        decipher.update(forge.util.createBuffer(JSON.parse(encryptedPaste)));
        var result = decipher.finish()
        var pastetxt = decipher.output.data;
    }
    catch (err) {
        console.log(err);
        return;
    }
    // document.getElementById('decpaste').innerHTML = pastetxt;
    $(document).ready(function(){
        $("#decpaste").text(pastetxt);
    });
}

function clone() {
    document.getElementById('submission').elements['pasteText'].innerHTML =
        document.getElementById('decpaste').innerHTML;

    document.getElementById('decpaste').style.display = "none";
    document.getElementById('text').style.display = "block";
    document.getElementById('clone').style.display = "none";
    document.getElementById('submit').style.display = "block";

}

function download() {
    var link = document.getElementById('dwnld');
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pastetxt));
}
