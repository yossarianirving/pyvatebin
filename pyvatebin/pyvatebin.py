import os
import sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash
from .myForms import NewPaste
import uuid
import lxml
from lxml.html.clean import Cleaner

URL = '127.0.0.1:5000/'
app = Flask(__name__)
app.config.from_object(__name__)

app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'pyvatebin.db'),
    SECRET_KEY='usesomethingbetter',
    RF_ENABLED=True,
))
app.config.from_envvar('PYVATEBIN_SETTINGS', silent=True)

@app.route('/', methods=['POST', 'GET'])
def mainPage():
    db = get_db()
    form = NewPaste()
    if form.validate_on_submit():
        idAsInt = uuid.uuid4().int>>65
        db.execute('insert into pastes (id, paste_text) values (?, ?)', [idAsInt, request.form['pasteText']])
        db.commit()
        print('asdfadsf')
        print(idAsInt)
        print('url:', hex(idAsInt)[2:])
        return render_template('postsub.html', text=request.form['pasteText'], paste_url=hex(idAsInt)[2:], new_url=URL)
    else:
        print(form.errors)
    return render_template('newp.html', form=form)


@app.route('/<pasteid>')
def showpaste(pasteid):
    idAsInt = int(pasteid, 16)
    db = get_db()
    print(idAsInt)
    cur = db.execute('select * from pastes where id = ?', [idAsInt]).fetchone()
    return render_template('showpaste.html', entry=cur)

@app.route('/raw/<pasteid>')
def rawpaste(pasteid):
    idAsInt = int(pasteid, 16)
    db = get_db()
    print(idAsInt)
    cur = db.execute('select * from pastes where id = ?', [idAsInt]).fetchone()
    return render_template('rawpaste.html', entry=cur), {'Content-Type': 'text/plain'}

# might be a horrible idea
# Or might not work
@app.route('/html-with-js/<pasteid>', methods=['POST', 'GET'])
def htmlpaste(pasteid):
    if request.method == 'POST':
        print(request)
        if request.form['action'] == 'confirmed':
            print('wtf')
            idAsInt = int(pasteid, 16)
            db = get_db()
            print(idAsInt)
            cur = db.execute('select * from pastes where id = ?', [idAsInt]).fetchone()
            print(cur)
            return render_template('htmlpaste.html', entry=cur['paste_text'])
        else:
            print('he')
    elif request.method == 'GET':
        return render_template('yousure.html', pid=pasteid)
    else:
        print('not valid')
'''
Move all below this to another file eventually
Possibly add conformation for javascript
'''
@app.route('/html/<pasteid>')
def html_no_jspaste(pasteid):
    cleaner = Cleaner()
    cleaner.javascript = True
    idAsInt = int(pasteid, 16)
    db = get_db()
    print(idAsInt)
    cur = db.execute('select * from pastes where id = ?', [idAsInt]).fetchone()
    no_js = cleaner.clean_html(cur['paste_text'])
    print(no_js)
    return render_template('htmlpaste.html', entry=no_js)

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
    print('Initialized the database.')
