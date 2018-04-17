from flask_wtf import FlaskForm
from wtforms import TextAreaField, StringField, HiddenField
from wtforms.validators import DataRequired


class NewPaste(FlaskForm):
    pasteText = TextAreaField('pasteText', validators=[DataRequired()])
    nonce = HiddenField('nonce')
