from flask_wtf import FlaskForm
from wtforms import TextAreaField, StringField, HiddenField, SelectField, BooleanField
from wtforms.validators import DataRequired


class NewPaste(FlaskForm):
    pasteText = TextAreaField('pasteText', validators=[DataRequired()])
    nonce = HiddenField('nonce')
    # (expire time in minutes, label)
    destructChoices = [('3600', ' '), ('1', '1m'), ('5', '5m'), ('10', '10m'), ('30', '30m'), ('60', '1h'), ('300', '5h'),('1440', '1d')]
    selfDestructTime = SelectField('selfDestructTime', choices=destructChoices)
    typeChoices = [('txt', 'Plain Text'), ('md', 'Markdown')]
    pasteType = SelectField('pasteType', choices=typeChoices)
    burnAfterRead = BooleanField('burnAfterRead', default=False)
