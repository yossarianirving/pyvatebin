from flask_wtf import FlaskForm
from wtforms import TextAreaField, StringField, HiddenField, SelectField, BooleanField
from wtforms.validators import DataRequired


class NewPaste(FlaskForm):
    pasteText = TextAreaField('pasteText', validators=[DataRequired()])
    nonce = HiddenField('nonce')
    destructChoices = [('3600', ' '), ('1', '1m'), ('5', '5m'), ('10', '10m'), ('30', '30m'), ('60', '1h')]
    selfDestructTime = SelectField('selfDestructTime', choices=destructChoices)
    burnAfterRead = BooleanField('burnAfterRead', default=False)
