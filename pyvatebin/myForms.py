from flask_wtf import Form
from wtforms import TextAreaField, StringField, HiddenField
from wtforms.validators import DataRequired


class NewPaste(Form):
    pasteText = TextAreaField('pasteText', validators=[DataRequired()])
    nonce = HiddenField('nonce')
