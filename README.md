# pyvatebin
**Pyvatebin** is a simple pastebin written in python using the Flask framework.
It uses the WebCrypto API to encrypt and decrypt the pastes. 

# Current Features

* Uses Python with the Flask framework.
* SQLite database.
* Client side encryption/decryption (default: AES-256 GCM).
* Server has no knowledge of paste content.
* Clone paste.
* WebCrypto as the cryptographic interface.
* Markdown rendering.
* Burn after reading.
* Delete after set amount of time.

# Planned Features


* Normal, raw and HTML page rendering.

# Improvements needed

* Improved UI.
* Work well with mobile devices.
* Consistant look across all browsers.

**Features/enhancements** project might be more current.

# Installation

Clone the git repository into either a python3 virtualenv or just a regular folder.
See <https://docs.python.org/3/library/venv.html>
Install the requirements (may need to take out a line or two).
`pip3 install -r requirements.txt`
Make sure the enviornment variables are set up.
On Linux:

    export FLASK_APP=pyvatebin.py
    export FLASK_DEBUG=true

Enter the `pyvatebin` directory within the project.
Initialize the SQLite database

    flask initdb

When you are ready to run pyvatebin, use `flask run`

\* Note: `flask run` should only be used for development. See <http://flask.pocoo.org/docs/0.12/deploying/>
