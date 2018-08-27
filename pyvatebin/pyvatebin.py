import os
import sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, send_from_directory, jsonify, abort, make_response
try:
    from .myForms import NewPaste
except ImportError:  # needed for "production" server
    from myForms import NewPaste
import uuid
import json
import time
from secrets import token_urlsafe
# Some of this should be moved to another file
app = Flask(__name__)
app.config.from_object(__name__)

app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'pyvatebin.db'),
    SECRET_KEY='usesomethingbetter',
    RF_ENABLED=True,
))
app.config.from_envvar('PYVATEBIN_SETTINGS', silent=True)


@app.route('/favicon.ico')  # adds favicon. removes an error
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                        'favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.route('/', methods=['POST', 'GET'])
def mainPage():
    form = NewPaste()
    nonce = token_urlsafe(16)
    resp =  make_response(render_template('newp.html', form=form, nonce=nonce))
    resp.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'nonce-"+nonce+"'")
    return resp

@app.route('/<pasteid>')
def showpaste(pasteid):
    # form is for the clone feature.
    form = NewPaste()
    # Convert hex to int and retrieve from database
    try:
        idAsInt = int(pasteid, 16)
    except Exception:
        abort(404)
    db = get_db()
    cur = db.execute('select * from pastes where id = ?', [idAsInt]).fetchone()
    if cur is not None:
        if cur["expire_time"] < time.time():
            db.execute('delete from pastes where id = ?', [idAsInt])
            print("Expired")
            db.commit()
            abort(404)
        nonce = token_urlsafe(16)
        resp = make_response(render_template('showpaste.html', entry=cur, form=form, pid=pasteid, nonce=nonce))
        resp.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'nonce-"+nonce+"'")
        return resp
    else:
        print("not found")
        abort(404)


@app.route('/submit', methods=['POST'])
def submit():
    if request.method == 'POST':
        form = request.get_json(force=True)
        pasteText = json.dumps(form['pasteText'])
        nonce = json.dumps(form['nonce'])
        burnAfterRead  = json.dumps(form['burnAfterRead'])
        pasteKeyHash = json.dumps(form['hash'])
        if burnAfterRead == "true":
            burnAfterRead = True
        else:
            burnAfterRead = False
        # Creates Expire time
        expireTime = json.dumps(form['expire_time'])
        expireTime = int(time.time()) + int(expireTime)*60
        # set paste type
        pasteType = json.dumps(form['pasteType'])[1:-1] # cuts "'" out
        # print(type(form['nonce']))
        db = get_db()
        # Creates random 64 bit int
        idAsInt = uuid.uuid4().int >> 65
        db.execute('''insert into pastes (id, paste_text, nonce, 
                expire_time, burn_after_read, paste_hash, paste_format) values (?, ?, ?, ?, ?, ?, ?)''', 
                [idAsInt, pasteText, nonce, expireTime, burnAfterRead, pasteKeyHash, pasteType])
        db.commit()  # add text to sqlite3 db
        return jsonify(id=hex(idAsInt)[2:])


@app.route('/delete', methods=['POST'])
def delete_paste():
    """This deletes the paste if Burn after read is selected"""
    if request.method == 'POST':
        form = request.get_json(force=True)
        # the [1:-1] gets rid of the extra quotes
        pasteid = int(json.dumps(form["pasteid"])[1:-1], 16)
        pasteHash = json.dumps(form["hash"])
        db = get_db()
        cur = db.execute('select * from pastes where id = ?', [pasteid]).fetchone()
        if cur is not None:
            # the hash is compared to make sure the paste was properly decrypted
            if (cur["burn_after_read"] == 1) and (cur["paste_hash"] == pasteHash):
                db.execute('delete from pastes where id = ?', [pasteid])
                db.commit()
                print("Paste Deleted")
                return jsonify('deleted')
            else:
                print("Could not authenticate paste")
        return jsonify('Could not Delete')



@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

def connect_db():
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv


def get_db():
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db


@app.teardown_appcontext
def close_db(error):
    # Not sure how much this is needed.
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()


def init_db():
    db = get_db()
    with app.open_resource('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()


@app.cli.command('initdb')
def initdb_command():
    """Initializes the database."""
    init_db()
    print('Database initialized.')


@app.cli.command('clean-db')
def clean_db_command():
    """Deletes expired pastes"""
    db = get_db()
    expiredTime = int(time.time())
    db.execute('delete from pastes where expire_time < ?',[expiredTime])
    db.commit()

@app.cli.command('vacuum')
def vaccum_db():
    """Delete and Vacuum pastes"""
    db = get_db()
    expiredTime = int(time.time())
    db.execute('delete from pastes where expire_time < ?',[expiredTime])
    db.commit()
    db.execute('vacuum')
    db.commit()